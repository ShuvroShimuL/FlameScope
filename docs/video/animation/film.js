/* Original Canvas motion design. All animation is a pure function of time.
   Shapes illustrate the concept; they do not simulate combustion. */
(() => {
  const F=globalThis.POLARIS_FILM, E=()=>globalThis.POLARIS_EVIDENCE;
  const W=1920,H=1080;
  const C={bg:'#080c12',panel:'#111922',panel2:'#17232e',line:'#2a3946',white:'#f3f1eb',muted:'#a0afbc',orange:'#ff784b',cyan:'#9bd6df',yellow:'#edc36c'};
  let c, T=0, audit=[];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=v=>1-Math.pow(1-clamp(v),3);
  const intro=(t,d=0,duration=.8)=>ease((t-d)/duration);
  const mix=(a,b,p)=>a+(b-a)*p;
  function text(s,x,y,size=40,color=C.white,weight=400,align='left'){
    c.fillStyle=color;c.font=`${weight} ${size}px "Segoe UI",Arial,sans-serif`;c.textAlign=align;c.textBaseline='top';
    const width=c.measureText(String(s)).width;
    const left=align==='center'?x-width/2:align==='right'?x-width:x;
    const m=c.getTransform();const corners=[[left,y],[left+width,y],[left,y+size],[left+width,y+size]].map(([px,py])=>({x:m.a*px+m.c*py+m.e,y:m.b*px+m.d*py+m.f}));
    if(corners.some(p=>p.x<60||p.x>W-60||p.y<20||p.y>H-22))audit.push({text:String(s),x:left,y,width,size,scene:F.scenes.find(s=>T>=s.start&&T<s.end)?.id});
    c.fillText(String(s),x,y);c.textAlign='left';
  }
  function lines(arr,x,y,size=80,color=C.white,weight=600,leading=1.12){arr.forEach((s,i)=>text(s,x,y+i*size*leading,size,color,weight));}
  function rect(x,y,w,h,r=20,fill=C.panel,stroke=null){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
  function line(x1,y1,x2,y2,color=C.line,width=2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function circle(x,y,r,fill,stroke=null,width=2){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function star(x,y,r=30,color=C.orange,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4;const q=i%2?r*.23:r;if(i)c.lineTo(Math.cos(a)*q,Math.sin(a)*q);else c.moveTo(Math.cos(a)*q,Math.sin(a)*q);}c.closePath();c.fillStyle=color;c.fill();c.restore();}
  function label(s,x,y,color=C.orange){text(s,x,y,23,color,600);}
  function pill(s,x,y,{color=C.muted,fill=C.panel2,size=25,pad=20}={}){c.font=`500 ${size}px "Segoe UI"`;const w=c.measureText(s).width+pad*2;rect(x,y,w,size+24,12,fill);text(s,x+pad,y+10,size,color,500);return w;}
  function reveal(t,d,fn,dy=24){const p=intro(t,d);if(p<=0)return;c.save();c.globalAlpha*=p;c.translate(0,(1-p)*dy);fn();c.restore();}
  function arrow(x,y,color=C.orange){line(x,y,x+50,y,color,3);line(x+38,y-12,x+50,y,color,3);line(x+38,y+12,x+50,y,color,3);}
  function check(x,y,color=C.cyan){c.beginPath();c.moveTo(x,y+10);c.lineTo(x+9,y+20);c.lineTo(x+29,y-6);c.lineWidth=4;c.strokeStyle=color;c.lineCap='round';c.stroke();c.lineCap='butt';}
  function ring(x,y,r,t,color=C.line){c.save();c.translate(x,y);c.rotate(t*.055);c.beginPath();c.ellipse(0,0,r,r*.57,.25,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=1.5;c.stroke();c.restore();}
  function orbit(x,y,r,t){ring(x,y,r,t);ring(x,y,r*.78,-t*1.8);ring(x,y,r*.55,t*2.1,C.orange);const a=t*.22;circle(x+Math.cos(a)*r,y+Math.sin(a)*r*.57,8,C.cyan);star(x,y,40+Math.sin(t)*3);}
  function source(s){text(s,98,992,21,C.muted,400);}
  const bassSource='Source: NASA/TM-20210011385 · BASS-II · Table 5.1 · printed p. 57';
  function background(t){
    c.fillStyle=C.bg;c.fillRect(0,0,W,H);
    const g=c.createRadialGradient(1540,400,30,1540,400,850);g.addColorStop(0,'#15232c');g.addColorStop(1,C.bg);c.fillStyle=g;c.fillRect(0,0,W,H);
    for(let i=0;i<48;i++){const x=82+(i*367%1770),y=165+(i*173%760);c.globalAlpha=.2+Math.sin(t*.3+i)*.1;circle(x,y,i%5===0?1.6:.8,C.muted);}c.globalAlpha=1;
    line(96,130,1824,130,'#25313b',1);line(96,958,1824,958,'#25313b',1);
    star(112,79,15);text('POLARIS',143,62,28,C.white,650);
    text('FLAME IN FREEFALL',1824,66,22,C.muted,500,'right');
  }
  function top(scene,index){label(scene.chapter,98,170);text(String(index+1).padStart(2,'0')+' / '+String(F.scenes.length).padStart(2,'0'),1824,174,21,C.muted,500,'right');}
  function browser(x,y,w,h,title='Will It Burn?'){rect(x,y,w,h,26,C.panel,'#344553');line(x,y+76,x+w,y+76,C.line,1);[C.orange,C.yellow,C.cyan].forEach((color,i)=>circle(x+34+i*22,y+37,5,color));text(title,x+118,y+21,27,C.muted,500);pill('CONCEPT',x+w-174,y+16,{size:19,color:C.cyan});}
  function cursor(x,y,t){c.save();c.translate(x,y);c.beginPath();c.moveTo(0,0);c.lineTo(0,32);c.lineTo(9,24);c.lineTo(17,40);c.lineTo(23,37);c.lineTo(15,21);c.lineTo(29,20);c.closePath();c.fillStyle=C.white;c.fill();c.strokeStyle=C.bg;c.lineWidth=2;c.stroke();if(t>0 && t<1)circle(0,0,18+t*35,null,`rgba(255,120,75,${1-t})`,3);c.restore();}
  const draw={
    hook(t){
      reveal(t,0,()=>lines(['Will it','burn?'],112,270,164,C.white,650,1.02));
      reveal(t,1.1,()=>text('One question. The right evidence.',120,716,40,C.muted));
      orbit(1430,522,300,t);circle(1430,522,112,'#d75a34');circle(1430,522,84,'#f08a53');star(1430,522,62,'#ffe1b3',Math.sin(t*.3)*.05);
      reveal(t,3.2,()=>pill('SPACECRAFT CABIN',1240,820,{color:C.cyan}));
      reveal(t,7,()=>{rect(111,814,734,80,12,C.panel2);text('Does this test cover these conditions?',136,833,31,C.orange,500);});
      source('An evidence-first concept by Team Polaris · Abstract motion graphic');
    },
    brand(t){
      orbit(960,404,228,t);star(960,387,91,C.orange,Math.sin(t*.18)*.1);
      reveal(t,.2,()=>text('TEAM POLARIS',960,596,121,C.white,650,'center'));
      reveal(t,1.3,()=>text('Dhaka, Bangladesh',960,761,43,C.muted,400,'center'));
      reveal(t,4.1,()=>text('Direction through evidence.',960,838,32,C.cyan,400,'center'));
      source('NASA Space Apps 2026 · Concept presentation');
    },
    team(t){
      text('Six people. One direction.',98,231,82,C.white,600);
      const focus=Math.min(5,Math.floor(Math.max(0,t-1)/3.8));
      F.team.forEach(([name,role,initials],i)=>{
        const x=98+(i%3)*581,y=396+Math.floor(i/3)*252;
        reveal(t,.25+i*.14,()=>{
          const active=focus===i;
          rect(x,y,558,225,18,active?'#263039':C.panel,active?C.orange:C.line);
          line(x+25,y+27,x+25+Math.max(0,Math.min(508,(t-1-i*3.8)/3.8*508)),y+27,active?C.orange:'#35404a',3);
          circle(x+49,y+79,24,active?C.orange:C.panel2);text(initials,x+49,y+65,20,active?C.bg:C.cyan,600,'center');
          text(name,x+29,y+121,37,C.white,600);text(role,x+29,y+174,25,C.muted,400);
        });
      });source('Team names and roles from the supplied presentation');
    },
    problem(t){
      reveal(t,0,()=>lines(['Finding data','is only','half the job.'],98,276,101,C.white,600,1.08));
      reveal(t,2,()=>lines(['Where does the result apply?'],103,720,35,C.orange,500));
      for(let i=0;i<3;i++)reveal(t,.5+i*.65,()=>{
        c.save();c.translate(1190+i*100,330+i*44);c.rotate((i-1)*.035);
        rect(0,0,360,432,12,i===2?'#e8e8e1':'#243440');
        text(i===2?'TEST RECORD':'NASA REPORT',22,24,24,i===2?C.bg:C.cyan,600);
        for(let k=0;k<6;k++){line(23,90+k*45,330,90+k*45,i===2?'#a3afb2':'#485b68',1);for(let j=1;j<4;j++)line(22+j*77,80,22+j*77,357,i===2?'#bac1c0':'#485b68',1);}
        if(i===2){rect(23,175,307,46,0,'#f2af8c');text('CONDITIONS + OUTCOME',36,188,18,C.bg,600);}
        c.restore();
      });
      reveal(t,9,()=>{rect(1098,833,622,70,12,C.panel2);text('Report → table → applicable evidence',1124,850,28,C.cyan);});
      source('Problem framing: project vision and scope · Report layouts are illustrative');
    },
    conditions(t){
      lines(['Does this test','cover your cabin?'],98,250,89,C.white,600,1.14);
      orbit(468,700,223,t);
      ['Material','Gravity','Oxygen','Pressure','Airflow','Sample dimensions'].forEach((s,i)=>reveal(t,.5+i*1.2,()=>{
        const y=247+i*108;rect(967,y,857,88,15,C.panel,C.line);text(s,995,y+20,34,C.white,500);const active=Math.floor(t/2)%6===i;circle(1776,y+44,9,active?C.orange:C.cyan);line(1410,y+44,1708,y+44,active?C.orange:'#40525e',3);
      }));
      source('Applicability principle: every requested condition must be recorded in the same test row');
    },
    challenge(t){
      reveal(t,0,()=>text('Flame in Freefall',98,260,129,C.white,650));
      reveal(t,1.3,()=>lines(['AI-Powered Fire Safety Insights','from Microgravity Combustion Data'],104,437,59,C.muted,400,1.25));
      ['Summarize','Rank','Interpret'].forEach((s,i)=>reveal(t,6+i*2.2,()=>{
        const x=98+i*580;line(x,682,x+530,682,i===Math.floor((t-6)/3)%3?C.orange:C.line,3);text(s,x,724,63,i===1?C.orange:C.white,600);text(['Make findings readable','Surface recorded patterns','Show context and limits'][i],x,819,28,C.muted);
      }));source('Challenge title retained verbatim from the supplied deck · NASA Space Apps 2026');
    },
    ask(t){
      text('A question is the starting point.',98,238,78,C.white,600);
      reveal(t,.6,()=>{
        browser(188,382,1544,494);label('ASK ABOUT YOUR CABIN',238,501,C.muted);
        const q='Will acrylic burn on the Space Station?';const count=Math.floor(clamp((t-2)/3.1)*q.length);
        text(q.slice(0,count),238,568,57,C.white,500);
        if(t<6&&Math.floor(t*2)%2)line(239+c.measureText(q.slice(0,count)).width,567,239+c.measureText(q.slice(0,count)).width,630,C.orange,3);
        ['Acrylic','Space Station'].forEach((s,i)=>reveal(t,6+i*.5,()=>pill(s,238+i*200,703,{color:C.cyan})));
        reveal(t,8,()=>{rect(1329,696,347,70,12,C.orange);text('Check the evidence',1361,713,29,C.bg,600);});
        if(t>9)cursor(1590,738,t-10);
      });source('Will It Burn? · Front door to FlameScope · Illustrative interface');
    },
    match(t){
      text('Match the whole question.',98,239,86,C.white,600);
      const xs=[98,686,1274];
      ['Read the question','Check each row','Keep the evidence'].forEach((s,i)=>reveal(t,.5+i*2.8,()=>{
        const x=xs[i];rect(x,424,550,382,20,C.panel,C.line);label(['QUESTION','NASA TEST RECORD','SUPPORTED ANSWER'][i],x+30,455);text(s,x+30,516,37,C.white,600);
        const rows=[['Material','Gravity','Every stated condition'],['One row at a time','All conditions together','Missing stays missing'],['Matching tests','Source attached','Gaps explained']][i];
        rows.forEach((r,j)=>{check(x+31,604+j*53,i===2?C.orange:C.cyan);text(r,x+80,596+j*53,28,C.muted);});
      }));
      [0,1].forEach(i=>{const progress=((t*.17+i*.25)%1);circle(648+38*progress+i*588,614,4,C.orange);});
      reveal(t,11,()=>text('Every requested condition. In the same test.',960,858,39,C.cyan,500,'center'));
      source('Matching rule: ADR-012 · Concept flow, not a live processing demonstration');
    },
    answer(t){
      text('A clear answer, with its evidence.',98,236,77,C.white,600);
      reveal(t,.2,()=>{
        browser(98,393,826,452);label('ACRYLIC · SPACE STATION',139,509,C.muted);text(E().station.verdict.stamp,138,562,115,C.orange,650);text('Observed in these NASA tests',145,729,32,C.muted);
      });
      reveal(t,2,()=>{
        text(E().station.testCount+' / '+E().station.testCount,1370,422,159,C.white,600,'center');text('acrylic sheets burned',1370,628,41,C.muted,400,'center');
        E().station.ids.forEach((id,i)=>{const x=1090+(i%10)*58,y=731+Math.floor(i/10)*51;reveal(t,3+i*.12,()=>rect(x,y,43,33,6,C.orange));});
      });
      reveal(t,9,()=>text('The result describes the recorded tests.',98,885,31,C.cyan));source(bassSource);
    },
    gap(t){
      text('Change the cabin. Recheck the match.',98,236,74,C.white,600);
      browser(98,393,926,463);label('ACRYLIC · MOON BASE',138,508,C.muted);
      reveal(t,.6,()=>text(E().moon.verdict.stamp,136,567,112,C.yellow,650));
      reveal(t,3,()=>lines(['Lunar gravity was not recorded','in this BASS-II test set.'],141,731,29,C.muted,400,1.35));
      orbit(1452,586,252,t);circle(1452,586,115,'#263744');circle(1500,570,99,C.bg);star(1323,424,19,C.yellow);
      reveal(t,7,()=>pill('MISSING CONDITION: GRAVITY',1130,848,{color:C.yellow,size:25}));
      source(bassSource+' · Gap computed by the applicability engine');
    },
    source(t){
      text('Keep the source attached.',98,238,91,C.white,600);
      const x=98;const cards=[['REPORT','NASA BASS-II','NASA/TM-20210011385'],['TABLE','Table 5.1','Acrylic sheet tests'],['TEST ROW',E().row.id,'Recorded measurement']];
      cards.forEach(([tag,heading,sub],i)=>reveal(t,.4+i*1.1,()=>{
        const xx=x+i*586;rect(xx,419,550,230,16,C.panel,C.line);label(tag,xx+28,449);text(heading,xx+28,500,i===0?47:59,C.white,600);text(sub,xx+28,584,26,C.muted);
      }));
      reveal(t,5,()=>{
        rect(98,709,1722,174,16,'#1b2c35',C.cyan);
        const values=[['SHEET THICKNESS',E().row.thicknessMm+' mm'],['AIRFLOW',E().row.velocity+' cm/s'],['FLAME SPREAD',E().row.spread+' mm/s']];
        values.forEach(([s,v],i)=>{label(s,130+i*587,738,C.muted);text(v,130+i*587,784,58,i===2?C.orange:C.white,600);});
      });source(bassSource+' · Row '+E().row.id);
    },
    suite(t){
      text('One workspace for evidence.',98,235,85,C.white,600);
      const items=[['ChatBot','Ask with sources attached'],['Analysis tool','Explore recorded variables'],['Comparison tool','See experiments side by side'],['FlameViz','Visualize recorded measurements']];
      items.forEach(([title,sub],i)=>reveal(t,.5+i*.8,()=>{
        const x=98+(i%2)*883,y=400+Math.floor(i/2)*249;const active=Math.floor(t/4)%4===i;
        rect(x,y,845,220,20,active?'#213039':C.panel,active?C.orange:C.line);
        pill('PLANNED',x+30,y+24,{size:19,color:C.orange});
        text(title,x+31,y+82,51,C.white,600);text(sub,x+32,y+157,29,C.muted);
        const ix=x+749,iy=y+114;
        if(i===0){rect(ix-25,iy-22,56,40,8,null,C.cyan);line(ix-12,iy+19,ix-18,iy+30,C.cyan);}
        if(i===1){[0,1,2].forEach(j=>rect(ix-23+j*20,iy+25-(20+j*15),11,20+j*15,3,C.cyan));}
        if(i===2){rect(ix-27,iy-25,24,56,4,null,C.cyan);rect(ix+8,iy-25,24,56,4,null,C.cyan);}
        if(i===3){ring(ix,iy,36,t,C.cyan);star(ix,iy,18,C.orange);}
      }));source('Planned concept modules · Illustrative interface · No predictive simulation is shown');
    },
    trust(t){
      lines(['Evidence computes.', 'AI selects.'],98,256,119,C.white,600,1.2);
      const words=['SOURCE RECORDS','EVIDENCE ENGINE','VERIFIED DISPLAY'];
      words.forEach((s,i)=>reveal(t,.6+i*1.3,()=>{
        const x=98+i*585;rect(x,627,548,135,15,C.panel,C.line);text(s,x+26,677,28,i===1?C.orange:C.cyan,600);
        if(i<2)arrow(x+541,694,C.orange);
      }));
      reveal(t,5,()=>text('AI may select evidence IDs — or abstain.',103,830,40,C.muted));
      reveal(t,10,()=>text('No generated numbers or verdicts.',103,891,29,C.orange,500));source('Design boundary: ADR-013 · Scientific claims and numbers come from the evidence engine');
    },
    close(t){
      orbit(1511,599,229,t);star(1511,588,79,C.orange);
      reveal(t,0,()=>text('Will It Burn?',98,292,145,C.white,650));
      reveal(t,.8,()=>text('by Team Polaris',104,483,50,C.orange,500));
      ['A clear question.','A traceable answer.','An honest gap.'].forEach((s,i)=>reveal(t,1.6+i*1.6,()=>text(s,108,605+i*66,42,C.muted)));
      text('NASA Space Apps 2026',105,874,29,C.cyan,500);source('github.com/ShuvroShimuL/FlameScope · Dhaka, Bangladesh');
    },
    credits(t){
      text('Built around evidence.',98,258,105,C.white,600);
      label('SCIENCE SOURCE',105,451);lines(['NASA/TM-20210011385 · BASS-II','Table 5.1 · ntrs.nasa.gov/citations/20210011385'],105,503,35,C.muted,400,1.5);
      label('CONCEPT & TEAM',105,671);text('Team Polaris · Dhaka, Bangladesh',105,721,40,C.white,500);
      text('Animation and narration drafted with Codex assistance.',105,826,29,C.muted);
      text('Original graphics · Voiceover to be recorded by the team',105,873,29,C.muted);
      star(1663,645,90,C.orange);source('Full source ledger and AI disclosure are included with the project');
    }
  };
  globalThis.drawFilm=(seconds,canvas,options={})=>{
    c=canvas.getContext('2d',{alpha:false});T=clamp(seconds,0,239.999999);audit=[];
    const index=F.scenes.findIndex(s=>T>=s.start&&T<s.end),scene=F.scenes[index];let t=T-scene.start;
    if(options.reduced)t=Math.min(scene.end-scene.start-.01,12);
    c.save();c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);background(T);top(scene,index);
    c.save();const transition=options.reduced?1:intro(t,0,.65);c.globalAlpha=transition;c.translate((1-transition)*32,0);draw[scene.id](t);c.restore();
    if(index===0 && t<.65){c.save();c.globalAlpha=1-transition;draw.hook(.65);c.restore();}
    const p=T/F.duration;line(96,1042,1824,1042,'#1b2833',2);line(96,1042,96+1728*p,1042,C.orange,3);
    c.restore();return audit;
  };
})();
