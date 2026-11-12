// NASA's FLEX droplet tests (PSI-69), read from NASA's own table in data/evidence/psi-69-flex.csv.
// These are burning fuel droplets, not solids, so they never join the acrylic evidence envelope.
import { readData, readJson } from './files.mjs';
import { tableFrom } from './csv.mjs';

export const flexProvenance = readJson('psi-69-flex.provenance.json');
const table = tableFrom(readData('psi-69-flex.csv'));
const col = start => table.columns.find(c => c.startsWith(start));
// NASA writes an en dash for "no value". Missing stays null, never 0.
const num = v => v === null || v === '–' ? null : Number(v);

// The gas headers lost their subscripts: 'O', 'N' and 'CO' are O₂, N₂ and CO₂ (each row adds up to about 1).
export const flexTests = table.rows.map(r => ({
  test: r[col('FLEX Test #')], fuel: r[col('Fuel')], pressureMmHg: num(r[col('Ambient pressure')]),
  o2: num(r[col('O initial')]), n2: num(r[col('N initial')]), co2: num(r[col('CO initial')]), he: num(r[col('He initial')]),
  dropletMm: num(r[col('Droplet initial diameter')]), end: r[col('Test end')]
}));

export const FLEX_SUMMARY = {
  tests: flexTests.length,
  co2: flexTests.filter(t => t.co2 > 0).length,
  he: flexTests.filter(t => t.he > 0).length,
  fuels: [...new Set(flexTests.map(t => t.fuel))]
};
