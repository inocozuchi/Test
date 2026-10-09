// 断片化MP4(fMP4)を、選んだ区間だけの「単独で再生できるMP4」に作り直す。
// iPhoneのSafariが録画するMP4は「初期化部分(ftyp+moov)」と「短い区切り(moof+mdat)の連続」でできている。
// 区切りの単位で切り出し、各区切りの時刻を0から始まるように書き換える。映像データ(mdat)はコピーせず元を参照する。
// ページとサービスワーカーの両方から使う。
(function (g) {
  'use strict';

  const fourcc = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

  async function readBytes(blob, start, len) {
    return new Uint8Array(await blob.slice(start, start + len).arrayBuffer());
  }

  // バッファ内の箱(box)を順に返す
  function* boxesIn(buf, start, end) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let p = start;
    while (p + 8 <= end) {
      let size = dv.getUint32(p), hdr = 8;
      const type = fourcc(buf, p + 4);
      if (size === 1) { size = Number(dv.getBigUint64(p + 8)); hdr = 16; }
      else if (size === 0) size = end - p;
      if (size < hdr || p + size > end) return;
      yield { type, start: p, size, body: p + hdr, end: p + size };
      p += size;
    }
  }

  function child(buf, box, type) {
    for (const b of boxesIn(buf, box.body, box.end)) if (b.type === type) return b;
    return null;
  }

  // ファイル全体の一番外側の箱を並べる。8KBずつ読み、その中に収まる小さな箱(styp/sidx/moof)はまとめて読み取る。
  // 大きな箱(mdat)は中身を読まずに飛ばす。moof の中身は後で使うので取っておく
  async function topBoxes(blob, onProgress) {
    const list = [], moofs = new Map();
    const total = blob.size;
    let pos = 0, n = 0;
    while (pos + 8 <= total) {
      const win = await readBytes(blob, pos, 8192);
      const dv = new DataView(win.buffer);
      let q = 0;
      while (q + 8 <= win.length) {
        let size = dv.getUint32(q), hdr = 8;
        const type = fourcc(win, q + 4);
        if (size === 1) {
          if (q + 16 > win.length) break;
          size = Number(dv.getBigUint64(q + 8)); hdr = 16;
        } else if (size === 0) size = total - (pos + q);
        if (size < hdr || pos + q + size > total) return { list, moofs };  // 録画が途中で終わった最後の箱は使わない
        list.push({ type, start: pos + q, size });
        if (type === 'moof' && q + size <= win.length) moofs.set(pos + q, win.slice(q, q + size));
        q += size;
      }
      if (q === 0) break;
      pos += q;
      if (onProgress && ++n % 50 === 0) onProgress(pos / total);
    }
    return { list, moofs };
  }

  // moov から、トラックごとの時間の単位(timescale)と標準の1コマの長さを読む。mehd(全体の長さ)は取り除く
  function parseMoov(moov) {
    const tracks = {};
    const top = { body: 8, end: moov.length };
    const dv = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
    for (const trak of boxesIn(moov, top.body, top.end)) {
      if (trak.type !== 'trak') continue;
      const tkhd = child(moov, trak, 'tkhd');
      const mdia = child(moov, trak, 'mdia');
      const mdhd = mdia && child(moov, mdia, 'mdhd');
      if (!tkhd || !mdhd) continue;
      const id = dv.getUint32(tkhd.body + (moov[tkhd.body] === 1 ? 20 : 12));
      const timescale = dv.getUint32(mdhd.body + (moov[mdhd.body] === 1 ? 20 : 12));
      const hdlr = child(moov, mdia, 'hdlr');
      const handler = hdlr ? fourcc(moov, hdlr.body + 8) : '';
      tracks[id] = { id, timescale, handler, defaultDuration: 0 };
    }
    const mvex = [...boxesIn(moov, top.body, top.end)].find(b => b.type === 'mvex');
    let mehd = null;
    if (mvex) {
      for (const b of boxesIn(moov, mvex.body, mvex.end)) {
        if (b.type === 'trex') {
          const id = dv.getUint32(b.body + 4);
          if (tracks[id]) tracks[id].defaultDuration = dv.getUint32(b.body + 12);
        }
        if (b.type === 'mehd') mehd = b;
      }
    }
    // mehd は「録画全体の長さ」なので、切り出した動画では間違いになる。取り除いて親の箱の大きさを直す
    let out = moov;
    if (mehd) {
      out = new Uint8Array(moov.length - mehd.size);
      out.set(moov.subarray(0, mehd.start), 0);
      out.set(moov.subarray(mehd.end), mehd.start);
      const odv = new DataView(out.buffer);
      odv.setUint32(0, odv.getUint32(0) - mehd.size);                   // moov(大きさが4バイトの形のみ)
      odv.setUint32(mvex.start, odv.getUint32(mvex.start) - mehd.size); // mvex
    }
    return { tracks, moov: out };
  }

  // moof を読んで、トラックごとの開始時刻と長さ、書き換える場所を調べる
  function parseMoof(moof, tracks) {
    const dv = new DataView(moof.buffer, moof.byteOffset, moof.byteLength);
    const trafs = [];
    for (const traf of boxesIn(moof, 8, moof.length)) {
      if (traf.type !== 'traf') continue;
      const t = { track: 0, tfdtOff: -1, tfdtVer: 0, base: 0, bdoOff: -1, dur: 0 };
      let defDur = 0;
      for (const b of boxesIn(moof, traf.body, traf.end)) {
        if (b.type === 'tfhd') {
          const flags = dv.getUint32(b.body) & 0xffffff;
          t.track = dv.getUint32(b.body + 4);
          let o = b.body + 8;
          if (flags & 0x1) { t.bdoOff = o; o += 8; }
          if (flags & 0x2) o += 4;
          if (flags & 0x8) defDur = dv.getUint32(o);
        } else if (b.type === 'tfdt') {
          t.tfdtVer = moof[b.body];
          t.tfdtOff = b.body + 4;
          t.base = t.tfdtVer === 1 ? Number(dv.getBigUint64(t.tfdtOff)) : dv.getUint32(t.tfdtOff);
        } else if (b.type === 'trun') {
          const flags = dv.getUint32(b.body) & 0xffffff;
          const count = dv.getUint32(b.body + 4);
          let o = b.body + 8;
          if (flags & 0x1) o += 4;
          if (flags & 0x4) o += 4;
          const per = ((flags & 0x100) ? 4 : 0) + ((flags & 0x200) ? 4 : 0) + ((flags & 0x400) ? 4 : 0) + ((flags & 0x800) ? 4 : 0);
          if (flags & 0x100) for (let i = 0; i < count; i++) t.dur += dv.getUint32(o + i * per);
          else t.dur += count * (defDur || (tracks[t.track] && tracks[t.track].defaultDuration) || 0);
        }
      }
      trafs.push(t);
    }
    return trafs;
  }

  // 動画全体の目次を作る。断片化MP4でなければ null
  async function index(blob, onProgress) {
    const { list: boxes, moofs } = await topBoxes(blob, onProgress);
    const ftyp = boxes.find(b => b.type === 'ftyp');
    const moovBox = boxes.find(b => b.type === 'moov');
    if (!ftyp || !moovBox || !boxes.some(b => b.type === 'moof')) return null;
    const { tracks, moov } = parseMoov(await readBytes(blob, moovBox.start, moovBox.size));
    const ids = Object.keys(tracks).map(Number);
    if (!ids.length) return null;
    const main = (ids.find(id => tracks[id].handler === 'vide') || ids[0]);

    // 区切り = moof と、それに続く mdat。styp/sidx/prft(区切りの目印)は作り直したファイルでは使わない
    const segs = [];
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.type !== 'moof') continue;
      const datas = [];
      for (let j = i + 1; j < boxes.length && boxes[j].type !== 'moof'; j++) {
        if (boxes[j].type === 'mdat') datas.push(boxes[j]);
      }
      if (!datas.length) continue;  // 映像データがない(途中で終わった)区切りは使わない
      segs.push({ moofStart: b.start, moofSize: b.size, datas, moof: null, trafs: null, time: 0, dur: 0, bytes: b.size + datas.reduce((a, d) => a + d.size, 0) });
    }
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      s.moof = moofs.get(s.moofStart) || await readBytes(blob, s.moofStart, s.moofSize);
      s.trafs = parseMoof(s.moof, tracks);
      const t = s.trafs.find(x => x.track === main) || s.trafs[0];
      if (t) { s.time = t.base / tracks[t.track].timescale; s.dur = t.dur / tracks[t.track].timescale; }
      if (onProgress && k % 100 === 0) onProgress(0.999);
    }
    if (!segs.length) return null;
    const t0 = segs[0].time;
    for (const s of segs) s.time -= t0;
    const last = segs[segs.length - 1];
    return { ftyp: { start: ftyp.start, size: ftyp.size }, moov, tracks, segs, duration: last.time + last.dur, size: blob.size };
  }

  // 区切り i0〜i1(両端含む)を1本のMP4にする設計図を作る。items は「書き換えたバイト列」か「元ファイルの範囲」
  function plan(idx, i0, i1, name) {
    const items = [{ s: idx.ftyp.start, e: idx.ftyp.start + idx.ftyp.size }, { b: idx.moov }];
    let pos = idx.ftyp.size + idx.moov.length;
    const base0 = {};
    for (const t of idx.segs[i0].trafs) base0[t.track] = t.base;
    for (let k = i0; k <= i1; k++) {
      const s = idx.segs[k];
      const moof = new Uint8Array(s.moof);  // 元を変えないよう複製してから書き換える
      const dv = new DataView(moof.buffer);
      for (const t of s.trafs) {
        if (t.tfdtOff >= 0) {
          const v = Math.max(0, t.base - (base0[t.track] ?? t.base));
          if (t.tfdtVer === 1) dv.setBigUint64(t.tfdtOff, BigInt(v)); else dv.setUint32(t.tfdtOff, v);
        }
        if (t.bdoOff >= 0) {  // 位置がファイルの先頭からの絶対値で書かれている場合は、新しい位置に合わせる
          const old = Number(dv.getBigUint64(t.bdoOff));
          dv.setBigUint64(t.bdoOff, BigInt(old - s.moofStart + pos));
        }
      }
      items.push({ b: moof });
      pos += moof.length;
      for (const d of s.datas) { items.push({ s: d.start, e: d.start + d.size }); pos += d.size; }
    }
    return { name, size: pos, items, from: idx.segs[i0].time, to: idx.segs[i1].time + idx.segs[i1].dur };
  }

  // 選んだ区間を、1本が maxBytes 以下になるように分けて設計図を作る
  function plans(idx, i0, i1, maxBytes, baseName, ext) {
    const out = [];
    let start = i0, bytes = 0;
    for (let k = i0; k <= i1; k++) {
      const b = idx.segs[k].bytes;
      if (k > start && bytes + b > maxBytes) { out.push([start, k - 1]); start = k; bytes = 0; }
      bytes += b;
    }
    out.push([start, i1]);
    return out.map(([a, z], n) => plan(idx, a, z, out.length > 1 ? `${baseName}-${n + 1}.${ext}` : `${baseName}.${ext}`));
  }

  // 設計図からファイルを作る(中身は元の録画を参照するだけなので軽い)
  function toFile(p, blob, type) {
    return new File(p.items.map(x => x.b || blob.slice(x.s, x.e)), p.name, { type: type || 'video/mp4' });
  }

  // 区間 [from, to] 秒に重なる区切りの番号
  function range(idx, from, to) {
    let i0 = 0, i1 = idx.segs.length - 1;
    while (i0 < i1 && idx.segs[i0].time + idx.segs[i0].dur <= from) i0++;
    while (i1 > i0 && idx.segs[i1].time >= to) i1--;
    return [i0, i1];
  }

  g.MP4Split = { index, plan, plans, toFile, range };
})(typeof self !== 'undefined' ? self : this);
