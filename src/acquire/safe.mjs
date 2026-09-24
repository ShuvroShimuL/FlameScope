// The wrapper every network fetch goes through (Node port of the brief's safe.py).
// Live first, cache second, committed fixture last. Returns { data, source } where
// source is 'live' | 'cache' | 'fixture' — show it in the UI as a badge.
// OFFLINE=1 skips the network entirely. fetchJson parses JSON; fetchText keeps the body
// as text (CSV files, for example), stored in the cache and fixture as a JSON string.
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../../', import.meta.url);
export const CACHE = fileURLToPath(new URL('cache/', ROOT));
export const FIXTURES = fileURLToPath(new URL('demo_fixtures/', ROOT));

export const keyFor = (url, params = {}) =>
  createHash('md5').update(url + JSON.stringify(Object.entries(params).sort())).digest('hex');

export const fetchJson = (url, options) => fetchSafe(url, options, r => r.json());
// Pass `encoding` for files that aren't UTF-8 (some NASA CSVs are Windows-1252).
export const fetchText = (url, { encoding = 'utf-8', ...options } = {}) =>
  fetchSafe(url, options, async r => new TextDecoder(encoding).decode(await r.arrayBuffer()));

async function fetchSafe(url, { params = {}, name = null, timeout = 25000, headers = {} } = {}, read) {
  const key = name || keyFor(url, params);
  const cached = `${CACHE}${key}.json`, fixture = `${FIXTURES}${key}.json`;

  if (process.env.OFFLINE !== '1') {
    try {
      const target = new URL(url);
      for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
      const r = await fetch(target, { headers, signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const data = await read(r);
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(cached, JSON.stringify(data));
      return { data, source: 'live' };
    } catch { /* fall through to cache, then fixture */ }
  }
  if (existsSync(cached)) return { data: JSON.parse(readFileSync(cached, 'utf8')), source: 'cache' };
  if (existsSync(fixture)) return { data: JSON.parse(readFileSync(fixture, 'utf8')), source: 'fixture' };
  throw Error(`No live, cache or fixture data for ${key}`);
}
