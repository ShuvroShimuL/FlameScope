import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { records, provenance, search, makeBrief, comparison } from '../compute/evidence.mjs';
import { ask, InputError } from '../compute/scenario.mjs';
import { aiAvailable, selectEvidence } from '../agents/evidence-selector.mjs';

const root=fileURLToPath(new URL('../../web/',import.meta.url));
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
export function createServer() { return http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET' && url.pathname==='/api/data') return send(res,200,{records,provenance,aiAvailable:aiAvailable() && process.env.OFFLINE!=='1'});
    if(req.method==='GET' && url.pathname==='/api/search') return send(res,200,search(Object.fromEntries(url.searchParams)));
    if(req.method==='GET' && url.pathname==='/api/ask') {
      try { return send(res,200,ask(Object.fromEntries(url.searchParams))); }
      catch(error){ if(error instanceof InputError) return send(res,400,{error:error.message}); throw error; }
    }
    if(req.method==='GET' && url.pathname==='/api/compare') {
      const ids=(url.searchParams.get('ids') || '').split(',');
      const items=records.filter(r=>ids.includes(r.id));
      if(items.length<2 || items.length>3) return send(res,400,{error:'Select two or three distinct tests.'});
      return send(res,200,{records:items,...comparison(items)});
    }
    if(req.method==='POST' && url.pathname==='/api/brief') {
      if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) return send(res,403,{error:'Cross-origin request refused.'});
      let body=''; for await(const chunk of req){body+=chunk; if(body.length>20000)return send(res,413,{error:'Request too large.'});}
      let input;try{input=JSON.parse(body);}catch{return send(res,400,{error:'Invalid JSON.'});}
      if(typeof input.question!=='string' || input.question.length>2000 || !Array.isArray(input.ids) || input.ids.length>20 || input.ids.some(id=>typeof id!=='string' || !records.some(r=>r.id===id))) return send(res,400,{error:'Provide a question and valid test IDs.'});
      const items=records.filter(r=>input.ids.includes(r.id));
      let brief=makeBrief(input.question,items);
      if(input.ai && aiAvailable() && !brief.abstained && process.env.OFFLINE!=='1') {
        try {
          const selected=await selectEvidence(input.question,items);
          brief=makeBrief(input.question,items,'AI-selected evidence · verified wording',selected.ids);
        }catch{brief.notice='AI selection unavailable. Showing the offline evidence brief; no generated scientific claims were accepted.';}
      } else if(input.ai) brief.notice=process.env.OFFLINE==='1'?'Offline mode. This brief uses deterministic evidence templates.':'AI is not configured. This brief uses deterministic evidence templates.';
      return send(res,200,brief);
    }
    if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
    if(url.pathname==='/burn'){res.writeHead(301,{Location:'/burn/'});return res.end();}
    const path=resolve(root,'.'+decodeURIComponent(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
    if(!path.startsWith(root))return send(res,403,{error:'Forbidden.'});
    const contents=await readFile(path);
    res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(contents);
  }catch(error){send(res,error.code==='ENOENT'?404:500,{error:error.code==='ENOENT'?'Not found.':'Unable to process request.'});}
});}
if(process.argv[1]===fileURLToPath(import.meta.url))createServer().listen(Number(process.env.PORT || 3000),'127.0.0.1',()=>{const base=`http://127.0.0.1:${process.env.PORT || 3000}`;console.log(`FlameScope:    ${base}/\nWill It Burn?: ${base}/burn/`);});
