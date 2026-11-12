import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { ask } from '../../lib/evidence/scenario.mjs';

const readScript=async(name,global)=>{
  const context={};runInNewContext(await readFile(new URL(`../../docs/video/animation/${name}`,import.meta.url),'utf8'),context);
  return JSON.parse(JSON.stringify(context[global]));
};
test('prescreening film has a continuous 240-second timeline and the complete deck roster',async()=>{
  const film=await readScript('story.js','POLARIS_FILM');
  assert.equal(film.duration,240);assert.equal(film.fps*film.duration,7200);
  assert.equal(film.scenes[0].start,0);assert.equal(film.scenes.at(-1).end,240);
  for(let i=0;i<film.scenes.length;i++){
    assert.ok(film.scenes[i].end>film.scenes[i].start);
    if(i)assert.equal(film.scenes[i].start,film.scenes[i-1].end);
  }
  const names=['Shamimul Shimul','Soleman Hossain','Iman Ahamad','Sara Rahman','Sihab Mahmud','Faisal Mahmud Abir'];
  assert.deepEqual(film.team.map(person=>person[0]),names);
  const roster=film.scenes.find(scene=>scene.id==='team').voice;
  for(const name of names)assert.ok(roster.includes(name),`${name} is narrated`);
  assert.ok(film.scenes.find(s=>s.id==='challenge').voice.includes('Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data'));
  assert.match(film.scenes.find(s=>s.id==='suite').voice,/planned modules/);
});
test('prescreening figures and verdicts match the current deterministic evidence',async()=>{
  const evidence=await readScript('evidence.js','POLARIS_EVIDENCE');
  const station=ask({q:'Will acrylic burn on the Space Station?'});
  const moon=ask({q:'Will acrylic burn on a Moon base?'});
  assert.deepEqual(evidence.station.verdict,station.verdict);
  assert.deepEqual(evidence.moon.verdict,moon.verdict);
  assert.equal(evidence.station.testCount,station.evidence.stats.tests);
  assert.deepEqual(evidence.station.ids,station.evidence.ids);
  assert.deepEqual(evidence.row,station.evidence.readings.find(r=>r.id==='M16'&&r.velocity===5));
  assert.equal(evidence.row.spread,.144);
  assert.equal(station.evidence.readings.find(r=>r.id==='M20'&&r.velocity===10).spread,.012);
  assert.equal(evidence.source.report,'NASA/TM-20210011385');
  assert.equal(evidence.source.table,'5.1');assert.equal(evidence.source.page,57);
});
