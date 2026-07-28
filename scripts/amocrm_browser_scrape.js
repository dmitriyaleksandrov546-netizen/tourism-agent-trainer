#!/usr/bin/env node
/**
 * amoCRM browser scraper prototype.
 *
 * It opens lead URLs with Playwright, saves page text/html/screenshots for later analysis,
 * and uses a persistent browser profile under private-data/browser-profile.
 *
 * This is useful when Wazzup history is visible in amoCRM UI but unavailable via API.
 * Login/session is the hard part: run with --headed on a machine with a display, log in once,
 * then reuse the profile for --scan.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dataDir = path.join(root, 'private-data', 'browser-scrape');
const profileDir = path.join(root, 'private-data', 'browser-profile');
const defaultUrlsPath = path.join(root, 'private-data', 'browser-scrape', 'lead-urls.txt');

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9а-яА-Я._-]+/g, '-').slice(0, 120);
}

function loadUrls(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function loadCookies(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.cookies || [];
  return items
    .map((cookie) => {
      const domain = cookie.domain || cookie.host || cookie.Host || '';
      const normalized = {
        name: cookie.name || cookie.Name,
        value: String(cookie.value ?? cookie.Value ?? ''),
        domain: domain.startsWith('.') ? domain : domain || '.amocrm.ru',
        path: cookie.path || cookie.Path || '/',
        httpOnly: Boolean(cookie.httpOnly || cookie.HttpOnly),
        secure: cookie.secure !== undefined ? Boolean(cookie.secure) : true,
      };
      const expires = cookie.expires ?? cookie.expirationDate ?? cookie.ExpirationDate;
      if (expires && Number(expires) > 0) normalized.expires = Math.floor(Number(expires));
      const sameSite = cookie.sameSite || cookie.SameSite;
      if (sameSite && ['Strict', 'Lax', 'None'].includes(sameSite)) normalized.sameSite = sameSite;
      return normalized;
    })
    .filter((cookie) => cookie.name && cookie.value && cookie.domain);
}

async function savePageSnapshot(page, url, index) {
  const leadId = url.match(/leads\/detail\/(\d+)/)?.[1] || String(index).padStart(5, '0');
  const dir = path.join(dataDir, `${String(index).padStart(5, '0')}-${safeName(leadId)}`);
  ensureDir(dir);

  const text = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
  const html = await page.content().catch(() => '');
  await page.screenshot({ path: path.join(dir, 'page.png'), fullPage: true }).catch(() => null);
  fs.writeFileSync(path.join(dir, 'url.txt'), `${url}\n`);
  fs.writeFileSync(path.join(dir, 'body.txt'), text);
  fs.writeFileSync(path.join(dir, 'page.html'), html);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({
    url,
    leadId,
    savedAt: new Date().toISOString(),
    textChars: text.length,
    title: await page.title().catch(() => ''),
  }, null, 2));

  // Also drop text into manual chat inbox if it looks like it contains useful dialogue.
  if (text.length > 500 && /(wazzup|whatsapp|сообщ|чат|клиент|тур|звон|сделк)/i.test(text)) {
    const inbox = path.join(root, 'private-data', 'manual-chats', 'inbox');
    ensureDir(inbox);
    fs.writeFileSync(path.join(inbox, `browser-${leadId}.txt`), text);
  }

  return { leadId, dir, textChars: text.length };
}

async function main() {
  ensureDir(dataDir);
  ensureDir(profileDir);

  const headed = hasFlag('--headed');
  const login = hasFlag('--login');
  const urlsPath = arg('--urls', defaultUrlsPath);
  const cookiesPath = arg('--cookies', null);
  const startUrl = arg('--url', 'https://tegtour.amocrm.ru/');
  const limit = Number(arg('--limit', '0')) || null;
  const waitMs = Number(arg('--wait-ms', '5000'));

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: !headed,
    viewport: { width: 1440, height: 1000 },
    locale: 'ru-RU',
  });
  const page = context.pages()[0] || await context.newPage();

  const cookies = loadCookies(cookiesPath);
  if (cookies.length) {
    await context.addCookies(cookies);
    console.log(JSON.stringify({ status: 'cookies_loaded', count: cookies.length, cookiesPath }));
  }

  if (login) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(JSON.stringify({ status: 'login_window_opened', profileDir, url: page.url(), headed }, null, 2));
    if (!headed) {
      console.error('Login mode needs --headed on a machine with DISPLAY/noVNC. Headless login is not useful.');
      await context.close();
      process.exit(2);
    }
    console.log('Log in manually, then press Ctrl+C when done. Browser profile will be kept.');
    await new Promise(() => {});
    return;
  }

  const urls = loadUrls(urlsPath).slice(0, limit || undefined);
  if (!urls.length) {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(waitMs);
    const result = await savePageSnapshot(page, startUrl, 1);
    console.log(JSON.stringify({ status: 'single_snapshot', result }, null, 2));
    await context.close();
    return;
  }

  const results = [];
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(waitMs);
      const result = await savePageSnapshot(page, url, i + 1);
      results.push({ url, ok: true, ...result });
      console.log(JSON.stringify(results.at(-1)));
    } catch (error) {
      const failed = { url, ok: false, error: error.message };
      results.push(failed);
      console.log(JSON.stringify(failed));
    }
  }
  fs.writeFileSync(path.join(dataDir, 'scan-results.json'), JSON.stringify(results, null, 2));
  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
