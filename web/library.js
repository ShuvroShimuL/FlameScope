// Only question text and request parameters are saved. Answers always come back through /api/ask.
export const LIBRARY_KEY = 'flamescope.questions.v1';
export const LIBRARY_LIMIT = 50;
const fields = new Set(['q', 'mission', 'material', 'air', 'thickness', 'width', 'airflow', 'place', 'materialName', 'g', 'o2', 'psi']);
const requestKey = params => JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
function cleanParams(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (!entries.length || entries.some(([key, v]) => !fields.has(key) ||
    !(typeof v === 'string' && v.length <= 500 || typeof v === 'number' && Number.isFinite(v)))) return null;
  if ('q' in value && (typeof value.q !== 'string' || !value.q.trim())) return null;
  return Object.fromEntries(entries);
}
function cleanEntry(value) {
  if (!value || typeof value.id !== 'string' || !/^[a-z0-9-]{1,64}$/i.test(value.id) ||
    typeof value.question !== 'string' || !value.question.trim() || value.question.length > 500 ||
    typeof value.savedAt !== 'number' || !Number.isFinite(new Date(value.savedAt).getTime())) return null;
  const params = cleanParams(value.params);
  return params ? { id: value.id, question: value.question.trim(), params, savedAt: value.savedAt } : null;
}

export function createQuestionLibrary(storage, { now = Date.now } = {}) {
  let entries = [], removed = null, durable = !!storage, serial = 0;
  const persist = () => { try { storage.setItem(LIBRARY_KEY, JSON.stringify(entries)); durable = true; } catch { durable = false; } };
  const reload = () => {
    let raw;
    try { raw = storage.getItem(LIBRARY_KEY); } catch { entries = []; durable = false; return; }
    try {
      const values = JSON.parse(raw || '[]'), seen = new Set(), ids = new Set();
      entries = (Array.isArray(values) ? values.slice(0, LIBRARY_LIMIT * 2) : []).map(cleanEntry).filter(entry => {
        if (!entry) return false;
        const key = requestKey(entry.params);
        if (seen.has(key) || ids.has(entry.id)) return false;
        seen.add(key); ids.add(entry.id); return true;
      }).sort((a, b) => b.savedAt - a.savedAt).slice(0, LIBRARY_LIMIT);
    } catch { entries = []; }
  };
  reload();
  return {
    reload,
    get durable() { return durable; },
    get canUndo() { return !!removed; },
    list(search = '') {
      const query = String(search).trim().toLocaleLowerCase();
      return entries.filter(e => e.question.toLocaleLowerCase().includes(query)).map(e => ({ ...e, params: { ...e.params } }));
    },
    record(question, params) {
      const savedAt = now(); let id;
      do { id = `${savedAt}-${serial++}`; } while (entries.some(e => e.id === id));
      const clean = cleanEntry({ id, question, params, savedAt });
      if (!clean) return false;
      const key = requestKey(clean.params), existing = entries.find(e => requestKey(e.params) === key);
      if (existing) clean.id = existing.id;
      entries = [clean, ...entries.filter(e => requestKey(e.params) !== key)].slice(0, LIBRARY_LIMIT);
      persist(); return true;
    },
    remove(id) {
      const entry = entries.find(e => e.id === id);
      if (!entry) return false;
      removed = entry; entries = entries.filter(e => e.id !== id); persist(); return true;
    },
    undo() {
      if (!removed) return false;
      if (!entries.some(e => requestKey(e.params) === requestKey(removed.params)))
        entries = [...entries.slice(0, LIBRARY_LIMIT - 1), removed].sort((a, b) => b.savedAt - a.savedAt);
      removed = null; persist(); return true;
    }
  };
}
