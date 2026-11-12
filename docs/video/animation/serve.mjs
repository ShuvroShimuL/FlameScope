// Optional local rehearsal server. Serves only docs/video, on loopback.
import {createServer} from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
export function createVideoServer(){return createServer(async(req,res)=>{
 try {
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/animation/'}).end();return;}
  const filename=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!filename.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
  const info=await stat(filename);if(!info.isFile()){res.writeHead(404).end();return;}
  const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.md':'text/plain; charset=utf-8','.srt':'text/plain; charset=utf-8'}[extname(filename)]||'application/octet-stream';
  const headers={'Content-Type':type,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; media-src 'self'; script-src 'self'; style-src 'self'"};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;status=206;}
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(filename,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(404).end();}
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.POLARIS_PORT||4174);
 createVideoServer().listen(port,'127.0.0.1',()=>console.log(`Polaris preview: http://127.0.0.1:${port}/animation/`));
}
