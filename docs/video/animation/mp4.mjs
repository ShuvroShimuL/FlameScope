// Minimal single-track AVC muxer for the browser's WebCodecs output.
// One constant-rate video track, no B-frames, no audio. No npm dependencies.
const u16=n=>{const b=Buffer.alloc(2);b.writeUInt16BE(n);return b;};
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n);return b;};
const join=(...xs)=>Buffer.concat(xs);
const zero=n=>Buffer.alloc(n);
const box=(type,...body)=>{const data=join(...body);return join(u32(data.length+8),Buffer.from(type),data);};
const full=(type,flags,...body)=>box(type,u32(flags),...body);
const matrix=join(...[0x10000,0,0,0,0x10000,0,0,0,0x40000000].map(u32));
export function muxAvc({samples,description,width,height,fps}){
  if(!samples.length || !description?.length)throw new Error('No encoded samples or AVC decoder configuration.');
  for(let i=1;i<samples.length;i++)if(samples[i].timestamp<=samples[i-1].timestamp)throw new Error('Encoder reordered frames; this muxer requires realtime encoding without B-frames.');
  const duration=Math.round(samples.length/fps*1000),ftyp=box('ftyp',Buffer.from('isom'),u32(512),Buffer.from('isomiso2avc1mp41'));
  const mvhd=full('mvhd',0,u32(0),u32(0),u32(1000),u32(duration),u32(0x10000),u16(0x100),zero(10),matrix,zero(24),u32(2));
  const tkhd=full('tkhd',7,u32(0),u32(0),u32(1),u32(0),u32(duration),zero(8),u16(0),u16(0),u16(0),u16(0),matrix,u32(width*65536),u32(height*65536));
  const mdhd=full('mdhd',0,u32(0),u32(0),u32(fps),u32(samples.length),u16(0x55c4),u16(0));
  const hdlr=full('hdlr',0,u32(0),Buffer.from('vide'),zero(12),Buffer.from('Polaris video\0'));
  const compressor=zero(32),name=Buffer.from('Polaris concept film');compressor[0]=name.length;name.copy(compressor,1);
  const avc1=box('avc1',zero(6),u16(1),zero(16),u16(width),u16(height),u32(0x480000),u32(0x480000),u32(0),u16(1),compressor,u16(24),u16(65535),box('avcC',Buffer.from(description)));
  const stsd=full('stsd',0,u32(1),avc1);
  const stts=full('stts',0,u32(1),u32(samples.length),u32(1));
  const stsc=full('stsc',0,u32(1),u32(1),u32(samples.length),u32(1));
  const stsz=full('stsz',0,u32(0),u32(samples.length),...samples.map(s=>u32(s.data.length)));
  const keys=samples.flatMap((s,i)=>s.key?[u32(i+1)]:[]);
  const stss=full('stss',0,u32(keys.length),...keys);
  const dinf=box('dinf',full('dref',0,u32(1),full('url ',1)));
  const makeMoov=offset=>box('moov',mvhd,box('trak',tkhd,box('mdia',mdhd,hdlr,box('minf',full('vmhd',1,zero(8)),dinf,box('stbl',stsd,stts,stsc,stsz,full('stco',0,u32(1),u32(offset)),stss)))));
  const moov=makeMoov(ftyp.length+makeMoov(0).length+8);
  return join(ftyp,moov,box('mdat',...samples.map(s=>s.data)));
}
