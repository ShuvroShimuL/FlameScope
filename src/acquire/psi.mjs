// NASA Physical Sciences Informatics (PSI): the curated "Experimental table" CSV of an investigation.
// The PSI search page is a JavaScript app. Its open API redirects this download route to the file itself.
// PSI-25 (BASS-II) is public and CC0-1.0, DOI 10.60555/4qc4-de67 (checked 2026-09-24 via /geode-py/ws/repo/investigations/PSI-25).
// We use it to cross-check the O₂ values hand-transcribed into data/bass-table.csv (test/psi.test.mjs).
// Pre-fetch for the demo: node src/acquire/psi.mjs  (then copy cache/psi-25-experimental-table.json to demo_fixtures/)
import { fileURLToPath } from 'node:url';
import { fetchText } from './safe.mjs';

export const PSI_25 = {
  investigation: 'PSI-25', title: 'BASS-II', file: 'PSI-25_Experimental table_BASS-II.csv',
  doi: '10.60555/4qc4-de67', license: 'CC0-1.0', record: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25'
};

// A small RFC 4180 reader: quoted fields, doubled quotes, and commas or line breaks inside quotes.
// Cells are trimmed, and a blank cell becomes null, never 0 or ''.
export function parseCsv(text) {
  const s = String(text).replace(/^﻿/, ''), rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch !== '"') cell += ch;
      else if (s[i + 1] === '"') { cell += '"'; i++; }
      else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(c => c.trim() || null));
}

// Rows keyed by the file's own column names (with runs of spaces collapsed). Values stay as NASA wrote them.
export function tableFrom(text) {
  const [header = [], ...rows] = parseCsv(text);
  const columns = header.map(h => (h ?? '').replace(/\s+/g, ' ').trim());
  return { columns, rows: rows.filter(r => r.some(c => c !== null)).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? null]))) };
}

export async function experimentalTable(study = PSI_25) {
  const { data, source } = await fetchText(`https://psi.nasa.gov/geode-py/ws/studies/${study.investigation}/download`,
    { params: { file: study.file }, name: `${study.investigation.toLowerCase()}-experimental-table` });
  return { ...study, ...tableFrom(data), source };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const table = await experimentalTable();
  console.log({ ...table, rows: `${table.rows.length} rows`, first: table.rows[0] });
}
