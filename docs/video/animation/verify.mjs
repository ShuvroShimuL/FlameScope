import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createVideoServer} from './serve.mjs';
import {createServer as createAppServer} from '../../../src/api/server.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const require=createRequire(process.env.POLARIS_PLAYWRIGHT || 'C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
assert.equal(process.env.OFFLINE,'1','Run verification with OFFLINE=1.');
assert.ok(!process.env.OPENAI_API_KEY,'Remove OPENAI_API_KEY before loading the server.');
const server=createVideoServer(),app=createAppServer();
await new Promise(r=>server.listen(0,'127.0.0.1',r));await new Promise(r=>app.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.POLARIS_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const pageErrors=[],external=[];page.on('pageerror',e=>pageErrors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))external.push(r.url());});
const sizes=[[1920,1080],[1280,720],[768,1024],[375,667],[667,375]];const layout=[];
try{
 await page.goto(base+'/animation/');
 for(const [width,height] of sizes){await page.setViewportSize({width,height});const result=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));assert.ok(result.scrollWidth<=width&&result.scrollHeight<=height,JSON.stringify(result));assert.ok(result.canvas.width>0&&result.canvas.height>0);layout.push(result);}
 await page.setViewportSize({width:1920,height:1080});
 await page.locator('#next').click();assert.match(await page.locator('#scene-title').innerText(),/Team Polaris/);
 await page.locator('#back').click();assert.match(await page.locator('#scene-title').innerText(),/The question/);
 await page.locator('#play').click();await page.waitForTimeout(220);await page.locator('#play').click();assert.ok(Number(await page.locator('#seek').inputValue())>0);
 await page.keyboard.press('Tab');
 await page.goto(base+'/Polaris-240s-concept.mp4');
 await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 const metadata=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
 assert.equal(metadata.duration,240);assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);
 for(const t of [8,40,111,145,164,184,216,238]){
  const image=await page.evaluate(async t=>{const v=document.querySelector('video');v.pause();await new Promise((resolve,reject)=>{v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',()=>reject(new Error('Video decode error')),{once:true});v.currentTime=t;});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL('image/png').split(',')[1];},t);
  if(t===145||t===184)await writeFile(root+`previews/decoded-${t}.png`,Buffer.from(image,'base64'));
 }
 await page.goto(`http://127.0.0.1:${app.address().port}/`);
 await page.waitForFunction(()=>document.body.innerText.includes('Will it burn?'));
 assert.equal(external.length,0);assert.equal(pageErrors.length,0);
 const report={metadata,seekChecks:[8,40,111,145,164,184,216,238],layout,playerControls:'pass',offlineAppLoad:'pass',externalRequests:external,pageErrors};
 await writeFile(root+'verification-report.json',JSON.stringify(report,null,2)+'\n');
 console.log('Verified: 240-second 1920x1080 MP4; 8 decoded seek points; 5 viewport sizes; player controls; offline app load; no external requests or script errors.');
}finally{await browser.close();await new Promise(r=>server.close(r));await new Promise(r=>app.close(r));}
