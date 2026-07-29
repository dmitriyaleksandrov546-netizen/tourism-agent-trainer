#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Busboy from 'busboy';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const uploadDir = path.join(root, 'private-data', 'video-inbox');
const port = Number(process.env.PORT || 5190);
const token = process.env.VIDEO_UPLOAD_TOKEN;
const maxBytes = Number(process.env.VIDEO_UPLOAD_MAX_BYTES || 2 * 1024 * 1024 * 1024);

fs.mkdirSync(uploadDir, { recursive: true });

function safeName(name) {
  const base = path.basename(name || `video-${Date.now()}.mp4`);
  return base.replace(/[^a-zA-Z0-9а-яА-Я._ -]+/g, '_').slice(0, 160);
}

function html(body) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Upload video</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0f1115;color:#f4f4f5;margin:0;padding:28px;line-height:1.45}.box{max-width:680px;margin:0 auto;background:#171a21;border:1px solid #2c3240;border-radius:18px;padding:24px}input,button{font:inherit}input[type=file]{display:block;margin:18px 0;padding:16px;background:#11141a;border:1px dashed #4b5563;border-radius:12px;width:100%;box-sizing:border-box}button{background:#22c55e;color:#05130a;border:0;border-radius:12px;padding:14px 18px;font-weight:700;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.muted{color:#9ca3af}.warn{color:#fbbf24}.bar{height:12px;background:#2c3240;border-radius:999px;overflow:hidden;margin:14px 0}.fill{height:100%;width:0;background:#22c55e}.status{white-space:pre-wrap;background:#0b0d12;border-radius:12px;padding:12px;margin-top:12px;color:#d1d5db}</style></head><body><div class="box">${body}</div></body></html>`;
}

function authorized(reqUrl) {
  if (!token) return true;
  const url = new URL(reqUrl, `http://localhost:${port}`);
  return url.searchParams.get('token') === token;
}

const server = http.createServer((req, res) => {
  if (!authorized(req.url || '/')) {
    res.writeHead(403, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html('<h1>403</h1><p>Неверная ссылка загрузки.</p>'));
    return;
  }

  if (req.method === 'GET') {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const tokenPart = token ? `?token=${encodeURIComponent(token)}` : '';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html(`
      <h1>Загрузка видео сделок</h1>
      <p class="muted">Файл сохранится приватно на сервере в <code>private-data/video-inbox/</code>.</p>
      <p class="warn">Лучше MP4, 1080p, 10–20 диалогов на видео. Лимит сервера: до ${Math.round(maxBytes / 1024 / 1024)} МБ.</p>
      <form id="uploadForm" method="post" action="/upload${tokenPart}" enctype="multipart/form-data">
        <input id="videoInput" type="file" name="video" accept="video/*,.mp4,.mov,.mkv,.webm" required>
        <button id="uploadButton" type="submit">Загрузить видео</button>
      </form>
      <div class="bar"><div id="progressFill" class="fill"></div></div>
      <div id="status" class="status">Выбери файл и нажми кнопку. Если кнопка не реагирует — файл начнёт грузиться автоматически после выбора.</div>
      <script>
        const form = document.getElementById('uploadForm');
        const input = document.getElementById('videoInput');
        const button = document.getElementById('uploadButton');
        const fill = document.getElementById('progressFill');
        const status = document.getElementById('status');
        let uploading = false;
        function upload() {
          if (uploading) return;
          if (!input.files || !input.files[0]) { status.textContent = 'Сначала выбери файл'; return; }
          uploading = true;
          button.disabled = true;
          button.textContent = 'Загружается...';
          const file = input.files[0];
          status.textContent = 'Начинаю загрузку: ' + file.name + ' (' + Math.round(file.size/1024/1024) + ' МБ)';
          const data = new FormData();
          data.append('video', file);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', form.action, true);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              fill.style.width = pct + '%';
              status.textContent = 'Загрузка: ' + pct + '%';
            }
          };
          xhr.onload = () => {
            fill.style.width = '100%';
            if (xhr.status >= 200 && xhr.status < 300) {
              document.open(); document.write(xhr.responseText); document.close();
            } else {
              uploading = false; button.disabled = false; button.textContent = 'Повторить загрузку';
              status.textContent = 'Ошибка HTTP ' + xhr.status + '\n' + xhr.responseText.slice(0, 500);
            }
          };
          xhr.onerror = () => {
            uploading = false; button.disabled = false; button.textContent = 'Повторить загрузку';
            status.textContent = 'Сеть оборвала загрузку. Попробуй ещё раз или через Google Drive.';
          };
          xhr.send(data);
        }
        form.addEventListener('submit', (e) => { e.preventDefault(); upload(); });
        input.addEventListener('change', () => { if (input.files && input.files[0]) setTimeout(upload, 300); });
      </script>
    `));
    return;
  }

  if (req.method !== 'POST' || !(req.url || '').startsWith('/upload')) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }

  let received = 0;
  let savedPath = '';
  let errored = false;
  const busboy = Busboy({ headers: req.headers, limits: { fileSize: maxBytes, files: 1 } });

  busboy.on('file', (_name, file, info) => {
    const original = safeName(info.filename);
    const target = path.join(uploadDir, `${Date.now()}-${original}`);
    savedPath = target;
    const out = fs.createWriteStream(target);
    file.on('data', chunk => {
      received += chunk.length;
    });
    file.on('limit', () => {
      errored = true;
      out.destroy();
      fs.rm(target, { force: true }, () => {});
    });
    file.pipe(out);
  });

  busboy.on('error', err => {
    errored = true;
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html(`<h1>Ошибка загрузки</h1><pre>${String(err.message || err)}</pre>`));
  });

  busboy.on('finish', () => {
    if (errored) {
      res.writeHead(413, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html('<h1>Файл слишком большой или загрузка оборвалась</h1><p>Попробуй сжать видео или отправить Google Drive/Яндекс Диск ссылкой.</p>'));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html(`<h1>Видео загружено ✅</h1><p>Размер: ${(received / 1024 / 1024).toFixed(1)} МБ</p><p class="muted">Файл: <code>${path.basename(savedPath)}</code></p><p>Можешь вернуться в Telegram и написать: загружено.</p>`));
    console.log(JSON.stringify({ status: 'uploaded', path: savedPath, bytes: received }));
  });

  req.pipe(busboy);
});

server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ status: 'listening', port, uploadDir, tokenRequired: Boolean(token) }));
});
