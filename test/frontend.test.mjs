import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Execute the actual frontend handlers with a minimal DOM and controllable network.
// No duplicate implementation of request ordering or invalidation rules.
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const handlers=source.slice(0,source.lastIndexOf('\ntry{'));
function setup(){
  const nodes=new Map(),pending=[];
  const node=key=>{if(!nodes.has(key))nodes.set(key,{value:'PMMA flame spread',textContent:'',innerHTML:'',dataset:{},addEventListener(type,fn){this[type]=fn;},setAttribute(){},removeAttribute(){},classList:{toggle(){}},focus(){}});return nodes.get(key);};
  const context=vm.createContext({document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},location:{hash:'#ask'},history:{pushState(){}},URLSearchParams,
    FormData:class{get(name){return name==='question'?node('#question').value:'';}*[Symbol.iterator](){yield ['question',node('#question').value];}},
    fetch:(url,options)=>new Promise((resolve,reject)=>pending.push({url,options,resolve:data=>resolve({ok:true,json:async()=>data}),reject}))});
  vm.runInContext(handlers,context);
  return {node,pending,run:code=>vm.runInContext(code,context)};
}
test('question edits immediately invalidate export and block briefs until refreshed search',async()=>{
  const h=setup();h.run("searchReady=true;brief={claims:[]};results=[{id:'M7'}];");
  h.node('#question').value='M1 flame spread';h.node('#question').input();
  assert.equal(h.run('brief'),null);assert.equal(h.run('searchReady'),false);
  h.run("setStep('brief',{focus:false})");assert.equal(h.run('step'),'ask');assert.equal(h.pending.length,0);
  const search=h.run('runSearch()');h.pending[0].resolve({records:[]});await search;
  assert.equal(h.run('searchReady'),true);
});
test('a late brief cannot restore export after a question edit',async()=>{
  const h=setup();h.run("searchReady=true;results=[{id:'M7'}];");
  const request=h.run('generate()');h.node('#question').input();
  h.pending[0].resolve({claims:[],abstained:true,reason:'old',mode:'Offline evidence brief'});await request;
  assert.equal(h.run('brief'),null);assert.equal(h.run('writing'),false);
});
test('pending comparison cannot overwrite the one-test empty state',async()=>{
  const h=setup();h.run("selected=new Set(['M7','M8']);");const old=h.run('renderComparison()');
  h.run("selected.delete('M8');renderComparison();");
  h.pending[0].resolve({records:[{id:'M7'},{id:'M8'}],issues:[],status:'Old comparison'});await old;
  assert.match(h.node('#comparison').innerHTML,/Pick one more test/);
  assert.doesNotMatch(h.node('#comparison').innerHTML,/Old comparison/);
});
test('new comparison wins when requests resolve out of order',async()=>{
  const h=setup();h.run("selected=new Set(['M7','M8']);");const old=h.run('renderComparison()');
  h.run("selected=new Set(['M1','M2']);");const current=h.run('renderComparison()');
  h.pending[1].resolve({records:[{id:'M1'},{id:'M2'}],issues:[],status:'Current'});await current;
  h.pending[0].resolve({records:[{id:'M7'},{id:'M8'}],issues:[],status:'Old'});await old;
  assert.match(h.node('#comparison').innerHTML,/Current/);assert.doesNotMatch(h.node('#comparison').innerHTML,/M7/);
});
test('AI brief attributes non-leading records without claiming first results',()=>{
  const h=setup();h.run("results=Array.from({length:20},()=>({}));brief={claims:[{id:'M18',text:'Published',conditions:'Conditions',source:'https://ntrs.nasa.gov',location:'Table'}],mode:'AI-selected evidence · verified wording',gaps:[]};renderBrief();");
  assert.match(h.node('#brief-basis').textContent,/1 of 20 matching search results: M18/);
  assert.match(h.node('#brief-basis').textContent,/AI selected/);assert.doesNotMatch(h.node('#brief-basis').textContent,/first/);
});
