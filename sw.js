// 圏外(電車の中など)でもアプリを開けるよう、ページと PDF 表示用プログラムを端末に保存しておく。
// ページ本体は通信できればいつも最新を取りにいき、つながらないときだけ保存してあるものを使う。
// ファイルを変えたら VERSION を上げる(古い保存分を入れ替えるため)
const VERSION = 'v2';
const CACHE = `silentcam-${VERSION}`;
const FILES = [
  './',
  'index.html',
  'mp4split.js',
  'manifest.json',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'vendor/pdfjs/cmaps/78-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/78-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/78-H.bcmap',
  'vendor/pdfjs/cmaps/78-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/78-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/78-V.bcmap',
  'vendor/pdfjs/cmaps/78ms-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/78ms-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/83pv-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/90ms-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/90ms-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/90msp-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/90msp-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/90pv-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/90pv-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/Add-H.bcmap',
  'vendor/pdfjs/cmaps/Add-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/Add-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/Add-V.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-0.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-1.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-3.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-4.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-5.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-6.bcmap',
  'vendor/pdfjs/cmaps/Adobe-CNS1-UCS2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-0.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-1.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-3.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-4.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-5.bcmap',
  'vendor/pdfjs/cmaps/Adobe-GB1-UCS2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-0.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-1.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-3.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-4.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-5.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-6.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Japan1-UCS2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Korea1-0.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Korea1-1.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Korea1-2.bcmap',
  'vendor/pdfjs/cmaps/Adobe-Korea1-UCS2.bcmap',
  'vendor/pdfjs/cmaps/B5-H.bcmap',
  'vendor/pdfjs/cmaps/B5-V.bcmap',
  'vendor/pdfjs/cmaps/B5pc-H.bcmap',
  'vendor/pdfjs/cmaps/B5pc-V.bcmap',
  'vendor/pdfjs/cmaps/CNS-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/CNS-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/CNS1-H.bcmap',
  'vendor/pdfjs/cmaps/CNS1-V.bcmap',
  'vendor/pdfjs/cmaps/CNS2-H.bcmap',
  'vendor/pdfjs/cmaps/CNS2-V.bcmap',
  'vendor/pdfjs/cmaps/ETHK-B5-H.bcmap',
  'vendor/pdfjs/cmaps/ETHK-B5-V.bcmap',
  'vendor/pdfjs/cmaps/ETen-B5-H.bcmap',
  'vendor/pdfjs/cmaps/ETen-B5-V.bcmap',
  'vendor/pdfjs/cmaps/ETenms-B5-H.bcmap',
  'vendor/pdfjs/cmaps/ETenms-B5-V.bcmap',
  'vendor/pdfjs/cmaps/EUC-H.bcmap',
  'vendor/pdfjs/cmaps/EUC-V.bcmap',
  'vendor/pdfjs/cmaps/Ext-H.bcmap',
  'vendor/pdfjs/cmaps/Ext-RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/Ext-RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/Ext-V.bcmap',
  'vendor/pdfjs/cmaps/GB-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GB-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/GB-H.bcmap',
  'vendor/pdfjs/cmaps/GB-V.bcmap',
  'vendor/pdfjs/cmaps/GBK-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GBK-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/GBK2K-H.bcmap',
  'vendor/pdfjs/cmaps/GBK2K-V.bcmap',
  'vendor/pdfjs/cmaps/GBKp-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GBKp-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/GBT-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GBT-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/GBT-H.bcmap',
  'vendor/pdfjs/cmaps/GBT-V.bcmap',
  'vendor/pdfjs/cmaps/GBTpc-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GBTpc-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/GBpc-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/GBpc-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/H.bcmap',
  'vendor/pdfjs/cmaps/HKdla-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKdla-B5-V.bcmap',
  'vendor/pdfjs/cmaps/HKdlb-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKdlb-B5-V.bcmap',
  'vendor/pdfjs/cmaps/HKgccs-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKgccs-B5-V.bcmap',
  'vendor/pdfjs/cmaps/HKm314-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKm314-B5-V.bcmap',
  'vendor/pdfjs/cmaps/HKm471-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKm471-B5-V.bcmap',
  'vendor/pdfjs/cmaps/HKscs-B5-H.bcmap',
  'vendor/pdfjs/cmaps/HKscs-B5-V.bcmap',
  'vendor/pdfjs/cmaps/Hankaku.bcmap',
  'vendor/pdfjs/cmaps/Hiragana.bcmap',
  'vendor/pdfjs/cmaps/KSC-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/KSC-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/KSC-H.bcmap',
  'vendor/pdfjs/cmaps/KSC-Johab-H.bcmap',
  'vendor/pdfjs/cmaps/KSC-Johab-V.bcmap',
  'vendor/pdfjs/cmaps/KSC-V.bcmap',
  'vendor/pdfjs/cmaps/KSCms-UHC-H.bcmap',
  'vendor/pdfjs/cmaps/KSCms-UHC-HW-H.bcmap',
  'vendor/pdfjs/cmaps/KSCms-UHC-HW-V.bcmap',
  'vendor/pdfjs/cmaps/KSCms-UHC-V.bcmap',
  'vendor/pdfjs/cmaps/KSCpc-EUC-H.bcmap',
  'vendor/pdfjs/cmaps/KSCpc-EUC-V.bcmap',
  'vendor/pdfjs/cmaps/Katakana.bcmap',
  'vendor/pdfjs/cmaps/NWP-H.bcmap',
  'vendor/pdfjs/cmaps/NWP-V.bcmap',
  'vendor/pdfjs/cmaps/RKSJ-H.bcmap',
  'vendor/pdfjs/cmaps/RKSJ-V.bcmap',
  'vendor/pdfjs/cmaps/Roman.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UCS2-H.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UCS2-V.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF16-H.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF16-V.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF8-H.bcmap',
  'vendor/pdfjs/cmaps/UniCNS-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UCS2-H.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UCS2-V.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF16-H.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF16-V.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF8-H.bcmap',
  'vendor/pdfjs/cmaps/UniGB-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UCS2-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UCS2-HW-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UCS2-HW-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UCS2-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF16-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF16-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF8-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF16-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF16-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF8-H.bcmap',
  'vendor/pdfjs/cmaps/UniJIS2004-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/UniJISPro-UCS2-HW-V.bcmap',
  'vendor/pdfjs/cmaps/UniJISPro-UCS2-V.bcmap',
  'vendor/pdfjs/cmaps/UniJISPro-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/UniJISX0213-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniJISX0213-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniJISX02132004-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniJISX02132004-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UCS2-H.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UCS2-V.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF16-H.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF16-V.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF32-H.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF32-V.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF8-H.bcmap',
  'vendor/pdfjs/cmaps/UniKS-UTF8-V.bcmap',
  'vendor/pdfjs/cmaps/V.bcmap',
  'vendor/pdfjs/cmaps/WP-Symbol.bcmap',
  'vendor/pdfjs/pdf.min.js',
  'vendor/pdfjs/pdf.worker.min.js',
  'vendor/pdfjs/standard_fonts/FoxitDingbats.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixed.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerif.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSymbol.pfb',
  'vendor/pdfjs/standard_fonts/LICENSE_FOXIT',
  'vendor/pdfjs/standard_fonts/LICENSE_LIBERATION',
  'vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('silentcam-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 電波が弱いと通信がなかなか失敗しないので、一定時間で諦めて保存分を使う
function fetchWithTimeout(req, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), ms);
    fetch(req).then(r => { clearTimeout(t); res(r); }, e => { clearTimeout(t); rej(e); });
  });
}

// ---------- 録画の書き出し(ファイルアプリへのダウンロード) ----------
// ページから「どの部分をどの順に書き出すか」の設計図を受け取り、端末内DBの録画データを少しずつ読み出して流す。
// 一度に全部をメモリに読み込まないので、数十GBの録画でも書き出せる。進み具合はページに知らせる
const exportsById = new Map();

self.addEventListener('message', e => {
  const m = e.data;
  if (m && m.type === 'export') {
    exportsById.set(m.id, m);
    setTimeout(() => exportsById.delete(m.id), 60 * 60 * 1000);
    if (e.ports[0]) e.ports[0].postMessage('ok');
  }
});

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('silentcam', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('chunks'); r.result.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function recordingBlob(m) {
  const db = await openDB();
  const prefix = m.legacy ? m.sid : `${m.sid}:${m.pp}`;
  const blobs = await new Promise((res, rej) => {
    const q = db.transaction('chunks').objectStore('chunks').getAll(IDBKeyRange.bound(`${prefix}:`, `${prefix}:\uffff`));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  db.close();
  return new Blob(blobs);
}

async function notify(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

async function exportResponse(id) {
  const m = exportsById.get(id);
  if (!m) return new Response('この書き出しは期限切れです。もう一度お試しください。', { status: 404 });
  const blob = await recordingBlob(m);
  const STEP = 4 * 1024 * 1024;
  let i = 0, off = 0, sent = 0, lastPct = -1;
  const report = (extra) => {
    const pct = Math.floor(sent / m.size * 100);
    if (extra || pct !== lastPct) { lastPct = pct; notify({ type: 'exportProgress', id, sent, total: m.size, ...extra }); }
  };
  const stream = new ReadableStream({
    async pull(ctrl) {
      try {
        if (i >= m.items.length) { report({ done: true }); ctrl.close(); return; }
        const it = m.items[i];
        let chunk;
        if (it.b) { chunk = it.b; i++; }
        else {
          const end = Math.min(it.e, it.s + off + STEP);
          chunk = new Uint8Array(await blob.slice(it.s + off, end).arrayBuffer());
          off = end - it.s;
          if (end >= it.e) { i++; off = 0; }
        }
        ctrl.enqueue(chunk);
        sent += chunk.length;
        report();
      } catch (err) {
        report({ error: err.name || 'error' });
        ctrl.error(err);
      }
    },
    cancel() { report({ error: '中断されました' }); },
  });
  report();
  return new Response(stream, { headers: {
    'Content-Type': m.mime || 'video/mp4',
    'Content-Length': String(m.size),
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(m.name)}`,
  } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const ex = new URL(req.url).pathname.match(/\/export\/([a-z0-9]+)\//);
  if (ex) { e.respondWith(exportResponse(ex[1])); return; }
  if (req.mode === 'navigate') {
    e.respondWith(fetchWithTimeout(req, 4000)
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); } return res; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
