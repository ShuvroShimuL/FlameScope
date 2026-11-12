// The one place the evidence engine touches the disk. Every other module in lib/evidence/ is pure:
// text in, values out. The files are committed source rows in data/evidence/ (hand-transcribed NASA
// tables, or NASA's own PSI files) and their provenance records. They are read once, when a module
// first loads, and never written.
//
// Paths are resolved from the project root, not from this file, because a bundler moves this file
// but not the data. next.config.mjs lists data/evidence/** in outputFileTracingIncludes so a hosted
// build ships the same bytes.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'evidence');

/** The text of one committed file in data/evidence/. The name is a fixed file name, never user input. */
export function readData(name) {
  if (!/^[a-z0-9][a-z0-9.-]*\.(?:csv|json)$/.test(name)) throw Error(`Not an evidence file name: ${name}`);
  return readFileSync(path.join(DIR, name), 'utf8');
}

export const readJson = name => JSON.parse(readData(name));
