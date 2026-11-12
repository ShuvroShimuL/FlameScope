/* Playback is a clock over deterministic frames; export never depends on RAF. */
const film = globalThis.POLARIS_FILM;
const canvas = document.querySelector('#film');
const playButton = document.querySelector('#play');
const seek = document.querySelector('#seek');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let time = 0, playing = false, previous = 0;
const format = n => `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function show(t) {
  time = Math.max(0,Math.min(film.duration,t));
  globalThis.drawFilm(time,canvas,{reduced});
  seek.value = time;
  document.querySelector('#time').textContent = `${format(time)} / 4:00`;
  const scene = film.scenes.find(s=>time>=s.start && time<s.end) || film.scenes.at(-1);
  document.querySelector('#scene-title').textContent = `${format(scene.start)}–${format(scene.end)} · ${scene.title}`;
  document.querySelector('#narration').textContent = scene.voice || 'Hold this end card. No narration.';
}
function toggle() {
  if (time>=film.duration) show(0);
  playing=!playing; previous=performance.now(); playButton.textContent=playing?'Pause':'Play';
  playButton.setAttribute('aria-label',playing?'Pause animation':'Play animation');
}
function jump(direction) {
  const index=film.scenes.findIndex(s=>time>=s.start && time<s.end);
  show(film.scenes[Math.max(0,Math.min(film.scenes.length-1,index+direction))].start);
}
playButton.addEventListener('click',toggle);
seek.addEventListener('input',()=>show(Number(seek.value)));
document.querySelector('#back').addEventListener('click',()=>jump(-1));
document.querySelector('#next').addEventListener('click',()=>jump(1));
document.querySelector('#fullscreen').addEventListener('click',()=>canvas.requestFullscreen());
document.addEventListener('keydown',event=>{
  if(event.target.matches('input,button'))return;
  if(event.code==='Space'){event.preventDefault();toggle();}
  if(event.code==='ArrowRight'){event.preventDefault();jump(1);}
  if(event.code==='ArrowLeft'){event.preventDefault();jump(-1);}
});
let touchX=null;
canvas.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
canvas.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)jump(dx<0?1:-1);},{passive:true});
let lastWheel=0;
canvas.addEventListener('wheel',e=>{e.preventDefault();if(performance.now()-lastWheel>450){jump(e.deltaY>0?1:-1);lastWheel=performance.now();}},{passive:false});
function tick(now){if(playing){show(time+(now-previous)/1000);if(time>=film.duration){playing=false;playButton.textContent='Play';}}previous=now;requestAnimationFrame(tick);}
show(0);requestAnimationFrame(tick);
