// Uses the desktop's existing Playwright installation and installed Chrome.
// Example: node docs/video/animation/render.mjs --preview
// Set POLARIS_PLAYWRIGHT and POLARIS_CHROME to override external tool paths.
import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { muxAvc } from './mp4.mjs';
import './prepare.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const require=createRequire(process.env.POLARIS_PLAYWRIGHT || 'C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.POLARIS_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(pathToFileURL(root+'index.html').href);
 await page.waitForFunction(()=>typeof globalThis.drawFilm==='function' && globalThis.POLARIS_EVIDENCE);
 await page.evaluate(()=>document.fonts.ready);
 const audit=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
   const warnings=[];
   for(let t=0;t<240;t+=.5)warnings.push(...drawFilm(t,canvas).map(w=>({...w,time:t})));
   return [...new Map(warnings.map(w=>[w.scene+'|'+w.text,w])).values()];
 });
 if(audit.length)throw new Error('Text outside safe frame: '+JSON.stringify(audit));
 await mkdir(root+'previews',{recursive:true});
 for(const [i,scene] of globalThis.POLARIS_FILM.scenes.entries()){
   const t=Math.min(scene.end-.5,scene.start+Math.max(7,(scene.end-scene.start)*.66));
   const data=await page.evaluate(t=>{const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;drawFilm(t,canvas);return canvas.toDataURL('image/png').split(',')[1];},t);
   await writeFile(root+`previews/${String(i+1).padStart(2,'0')}-${scene.id}.png`,Buffer.from(data,'base64'));
 }
 if(process.argv.includes('--preview')){console.log('Preview: all 15 scenes rendered; safe-frame audit passed.');}
 else {
   const samples=[];let description;
   await page.exposeFunction('receiveFrames',packet=>{
     if(packet.description)description=Buffer.from(packet.description,'base64');
     for(const sample of packet.samples)samples.push({...sample,data:Buffer.from(sample.data,'base64')});
     if(samples.length%600===0)console.log(`Encoded ${samples.length}/7200 frames (${Math.round(samples.length/72)}%).`);
   });
   const result=await page.evaluate(async()=>{
     const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
     const base64=bytes=>{let str='';for(let i=0;i<bytes.length;i+=32768)str+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(str);};
     let packet={samples:[]},error=null;
     const encoder=new VideoEncoder({output:(chunk,meta)=>{
       const bytes=new Uint8Array(chunk.byteLength);chunk.copyTo(bytes);
       if(meta.decoderConfig?.description)packet.description=base64(new Uint8Array(meta.decoderConfig.description));
       packet.samples.push({data:base64(bytes),timestamp:chunk.timestamp,key:chunk.type==='key'});
     },error:e=>{error=e.message;}});
     const config={codec:'avc1.640028',width:1920,height:1080,bitrate:8000000,framerate:30,latencyMode:'realtime',avc:{format:'avc'}};
     if(!(await VideoEncoder.isConfigSupported(config)).supported)throw new Error('H.264 WebCodecs configuration is unavailable.');
     encoder.configure(config);
     for(let frame=0;frame<7200;frame++){
       drawFilm(frame/30,canvas);
       const videoFrame=new VideoFrame(canvas,{timestamp:Math.round(frame*1000000/30),duration:Math.round(1000000/30)});
       encoder.encode(videoFrame,{keyFrame:frame%60===0});videoFrame.close();
       if(frame%60===59){await encoder.flush();if(error)throw new Error(error);await window.receiveFrames(packet);packet={samples:[]};}
     }
     await encoder.flush();if(packet.samples.length)await window.receiveFrames(packet);encoder.close();
     return {width:1920,height:1080,fps:30,frames:7200,duration:240};
   });
   if(samples.length!==7200)throw new Error('Encoder returned an unexpected frame count.');
   const bytes=muxAvc({samples,description,...result});
   const target=resolve(root,'../Polaris-240s-concept.mp4');await writeFile(target,bytes);
   await writeFile(root+'render-report.json',JSON.stringify({...result,bytes:bytes.length,codec:'H.264/AVC',audioTracks:0,safeFrameWarnings:audit,browserErrors:errors},null,2)+'\n');
   console.log(`Saved ${target} (${(bytes.length/1048576).toFixed(1)} MiB).`);
 }
 if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
} finally {await browser.close();}
