import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// web/theme.js runs in a stand-in page: a root element, toggle buttons, storage and the system setting.
const source = readFileSync(new URL('../web/theme.js', import.meta.url), 'utf8');
function page({ stored = null, systemDark = false, storage = true } = {}) {
  const listeners = {}, mediaListeners = [], data = new Map(stored ? [['theme', stored]] : []);
  const button = { hidden: true, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, closest: sel => sel === '[data-theme-toggle]' ? button : null };
  const media = { matches: systemDark, addEventListener: (_, fn) => mediaListeners.push(fn) };
  const localStorage = storage
    ? { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
    : { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const document = { documentElement: { dataset: {} }, querySelectorAll: () => [button], addEventListener: (type, fn) => { listeners[type] = fn; } };
  runInNewContext(source, { document, localStorage, matchMedia: () => media });
  return {
    button, data, root: document.documentElement,
    load() { listeners.DOMContentLoaded(); },
    click(target = button) { listeners.click({ target }); },
    systemChange(dark) { media.matches = dark; mediaListeners.forEach(fn => fn()); }
  };
}

test('with nothing saved, the theme follows the system, including a later change', () => {
  const p = page({ systemDark: true });
  assert.equal(p.root.dataset.theme, 'dark', 'set before the page paints');
  p.systemChange(false); assert.equal(p.root.dataset.theme, 'light');
});

test('a saved choice wins over the system and survives a system change', () => {
  const p = page({ stored: 'light', systemDark: true });
  assert.equal(p.root.dataset.theme, 'light');
  p.systemChange(true); assert.equal(p.root.dataset.theme, 'light');
});

test('the toggle appears once the script runs, flips the theme, saves it and reports its state', () => {
  const p = page();
  assert.equal(p.button.hidden, true);
  p.load(); assert.equal(p.button.hidden, false); assert.equal(p.button.attrs['aria-pressed'], 'false');
  p.click(); assert.equal(p.root.dataset.theme, 'dark'); assert.equal(p.data.get('theme'), 'dark'); assert.equal(p.button.attrs['aria-pressed'], 'true');
  p.click(); assert.equal(p.root.dataset.theme, 'light');
  p.click({ closest: () => null }); assert.equal(p.root.dataset.theme, 'light', 'a click elsewhere changes nothing');
});

test('blocked storage and a junk saved value never break the page', () => {
  const blocked = page({ storage: false, systemDark: true });
  assert.equal(blocked.root.dataset.theme, 'dark');
  blocked.click(); assert.equal(blocked.root.dataset.theme, 'light', 'the toggle still works, just unsaved');
  assert.equal(page({ stored: 'purple' }).root.dataset.theme, 'light');
});

test('both pages load theme.js before their stylesheet and carry one toggle', () => {
  for (const file of ['../web/index.html', '../web/research/index.html']) {
    const html = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.ok(html.indexOf('<script src="/theme.js"></script>') < html.indexOf('rel="stylesheet"'), file);
    assert.equal(html.match(/data-theme-toggle/g).length, 1, file);
    assert.match(html, /data-theme-toggle aria-pressed="false" aria-label="Dark mode"[^>]*hidden>/, file);
  }
});

// WCAG AA: 4.5:1 for body text. Both palettes of the research page are checked on the pairs it actually uses.
const tokens = block => Object.fromEntries([...block.matchAll(/--([\w-]+):(#[0-9a-f]{3,8})\b/gi)].map(m => [m[1], m[2]]));
const lum = hex => {
  const h = hex.slice(1), full = h.length <= 4 ? [...h.slice(0, 3)].map(c => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('the research page has matching light and dark palettes, and its text pairs pass WCAG AA', () => {
  const css = readFileSync(new URL('../web/research/style.css', import.meta.url), 'utf8');
  const light = tokens(css.match(/^:root\{([^}]*)\}/m)[1]), dark = tokens(css.match(/^:root\[data-theme="dark"\]\{([^}]*)\}/m)[1]);
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort(), 'every token has both values');
  assert.equal(css.match(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1], css.match(/^:root\[data-theme="dark"\]\{([^}]*)\}/m)[1]);
  const rules = css.split('\n').slice(4).join('\n');
  assert.doesNotMatch(rules, /#[0-9a-f]{3,8}\b/i, 'colours live only in the token blocks');
  const pairs = [['text', 'bg'], ['muted', 'bg'], ['muted', 'panel'], ['accent', 'bg'], ['accent', 'panel'], ['on-accent', 'accent'], ['green', 'panel'],
    ['body-text', 'bg'], ['tag-text', 'tag-bg'], ['warn-text', 'warn-bg'], ['status-text', 'status-bg'], ['text', 'field']];
  for (const [name, palette] of [['light', light], ['dark', dark]])
    for (const [fg, bg] of pairs) assert.ok(ratio(palette[fg], palette[bg]) >= 4.5, `${name}: ${fg} on ${bg} is ${ratio(palette[fg], palette[bg]).toFixed(2)}:1`);
});
