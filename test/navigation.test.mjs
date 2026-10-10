import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../web/navigation.js', import.meta.url), 'utf8');
function page({ saved = null, mobile = false, blocked = false } = {}) {
  const listeners = {}, media = { matches: mobile, addEventListener: (type, fn) => { media[type] = fn; } };
  const node = () => ({ attrs: {}, listeners: {}, hidden: true, open: false, focusCount: 0,
    addEventListener(type, fn) { this.listeners[type] = fn; }, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    focus() { this.focusCount++; }, closest() { return null; } });
  const root = { dataset: {} }, toggle = node(), sidebar = node(), drawer = node(), anchor = node(), header = node(), brand = node(), mark = node();
  header.append = el => { el.parentNode = header; }; header.append(toggle);
  brand.insertBefore = (el, before) => { assert.equal(before, mark); el.parentNode = brand; };
  const parent = { insertBefore(el, before) { assert.equal(before, anchor); el.parentNode = parent; } };
  sidebar.parentNode = parent; sidebar.nextElementSibling = anchor; sidebar.querySelectorAll = () => [];
  drawer.append = el => { el.parentNode = drawer; };
  drawer.showModal = () => { drawer.open = true; };
  drawer.close = () => { drawer.open = false; drawer.listeners.close(); };
  drawer.getBoundingClientRect = () => ({ left: 0, top: 0, right: 300, bottom: 844 });
  const nodes = { '#sidebar-toggle': toggle, '#workspace-sidebar': sidebar, '#sidebar-drawer': drawer, '#workspace-header': header, '.toolbar .brand': brand, '.brand-mark': mark };
  const values = new Map(saved ? [['flamescope.sidebar', saved]] : []);
  const localStorage = { getItem(key) { if (blocked) throw Error('blocked'); return values.get(key); }, setItem(key, value) { if (blocked) throw Error('blocked'); values.set(key, value); } };
  runInNewContext(source, { document: { documentElement: root, querySelector: s => nodes[s], addEventListener: (type, fn) => { listeners[type] = fn; } }, localStorage, matchMedia: () => media });
  return { root, toggle, sidebar, drawer, parent, header, brand, values,
    load() { listeners.DOMContentLoaded(); }, click() { toggle.listeners.click(); },
    resize(isMobile) { media.matches = isMobile; media.change(); },
    navigate() { drawer.listeners.click({ target: { closest: s => s === 'a, [data-open-question]' ? {} : null } }); }
  };
}

test('FR-23: desktop collapse applies before paint, persists, and reports its expanded state', () => {
  const p = page({ saved: 'collapsed' });
  assert.equal(p.root.dataset.sidebar, 'collapsed');
  p.load(); assert.equal(p.toggle.hidden, false); assert.equal(p.toggle.attrs['aria-expanded'], 'false');
  assert.equal(p.toggle.parentNode, p.header, 'desktop toggle stays beside Workspace, including when collapsed');
  assert.equal(p.toggle.attrs['aria-label'], 'Expand sidebar');
  p.click(); assert.equal(p.root.dataset.sidebar, 'expanded'); assert.equal(p.values.get('flamescope.sidebar'), 'expanded');
  assert.equal(p.toggle.attrs['aria-expanded'], 'true');
  p.click(); assert.equal(p.values.get('flamescope.sidebar'), 'collapsed');
});

test('FR-23: the mobile drawer moves the same navigation, closes for links, and preserves desktop preference', () => {
  const p = page({ mobile: true, saved: 'collapsed' }); p.load();
  assert.equal(p.toggle.parentNode, p.brand, 'phones can open the drawer from the toolbar');
  assert.equal(p.toggle.attrs['aria-label'], 'Open sidebar'); p.click();
  assert.equal(p.drawer.open, true); assert.equal(p.sidebar.parentNode, p.drawer);
  assert.equal(p.toggle.attrs['aria-expanded'], 'true');
  p.navigate(); assert.equal(p.drawer.open, false); assert.equal(p.sidebar.parentNode, p.parent);
  assert.equal(p.toggle.focusCount, 0, 'section navigation can focus the heading');
  assert.equal(p.values.get('flamescope.sidebar'), 'collapsed');
  p.click(); p.drawer.close();
  assert.equal(p.sidebar.parentNode, p.parent); assert.equal(p.toggle.focusCount, 1, 'Escape/native dialog close returns focus');
  assert.equal(p.toggle.attrs['aria-expanded'], 'false');
});

test('FR-23: crossing the desktop breakpoint restores the sidebar without changing saved state', () => {
  const p = page({ mobile: true }); p.load(); p.click(); p.resize(false);
  assert.equal(p.toggle.parentNode, p.header);
  assert.equal(p.drawer.open, false); assert.equal(p.sidebar.parentNode, p.parent);
  assert.equal(p.toggle.attrs['aria-expanded'], 'true'); assert.equal(p.root.dataset.sidebar, 'expanded');
  p.resize(true); assert.equal(p.toggle.parentNode, p.brand);
});

test('FR-23: storage denial never prevents toggling', () => {
  const p = page({ blocked: true }); p.load(); p.click();
  assert.equal(p.root.dataset.sidebar, 'collapsed'); assert.equal(p.toggle.attrs['aria-expanded'], 'false');
});
