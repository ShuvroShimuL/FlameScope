// Will It Burn? — browser side. It never decides anything scientific itself:
// it sends the question or tapped controls to GET /api/ask and renders the JSON.
const QUESTIONS = [
  'Will acrylic burn on the ISS?',
  'Will it burn on a Moon base at 34% oxygen?',
  'What about Mars transit in exploration air?',
  'Does a 1 mm sheet burn faster than 5 mm?',
  'Will a 1 mm acrylic sheet burn in still air?',
  'Is Nomex safe on a Mars base?'
];
const KEYWORDS = ['ISS', 'Moon base', 'Mars transit', 'Mars base', '34% oxygen', '8.2 psi', '1 mm', '5 mm', 'still air', '10 cm/s', 'acrylic', 'Nomex'];
const THICKNESSES = [1, 2, 3, 4, 5];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const input = $('#q');
let records = [], result = null, version = 0;

async function api(path) {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Request failed.');
  return data;
}
function showError(message) { const e = $('#ask-error'); e.textContent = message; e.hidden = !message; }

// ---------- Talking to the server ----------
function paramsFrom(s) {
  const p = { mission: s.mission.id, material: s.material.id, thickness: s.thickness ?? 'all', airflow: s.airflow ?? 'none' };
  if (s.air.key === 'custom') { p.o2 = s.air.o2; p.psi = s.air.psi; } else p.air = s.air.key;
  return p;
}
async function ask(params, { fromControl = false, animate = true } = {}) {
  const v = ++version;
  $('#result').setAttribute('aria-busy', 'true');
  try {
    const query = new URLSearchParams(Object.entries(params).filter(([, x]) => x !== undefined && x !== null && x !== ''));
    const data = await api('/api/ask?' + query);
    if (v !== version) return; // a newer request already won
    result = data;
    if (fromControl) input.value = data.canonical;
    showError('');
    render(animate);
  } catch (error) {
    if (v !== version) return;
    showError(error instanceof TypeError ? 'Couldn’t reach the local server. Start it with: node server.mjs' : error.message);
  } finally {
    if (v === version) $('#result').removeAttribute('aria-busy');
  }
}
// A tap changes one field and sends every field explicitly, so the question text no longer applies.
function change(patch) {
  const p = { ...paramsFrom(result.scenario), ...patch };
  if ('air' in patch || 'mission' in patch) { delete p.o2; delete p.psi; }
  if ('mission' in patch && !('air' in patch)) delete p.air; // a new mission brings its own default air
  ask(p, { fromControl: true });
}

// ---------- Step 1: input, suggestions, read-back, tiles ----------
$('#questions').innerHTML = QUESTIONS.map(q => `<button type="button" class="sug" data-q="${esc(q)}">${esc(q)}</button>`).join('');
$('#keywords').innerHTML = KEYWORDS.map(k => `<button type="button" class="kw" data-k="${esc(k)}">${esc(k)}</button>`).join('');
$('#questions').addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  input.value = b.dataset.q; ask({ q: b.dataset.q });
});
$('#keywords').addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  const current = input.value.trim().replace(/\?$/, '');
  input.value = (current ? current + ' ' : '') + b.dataset.k;
  input.focus();
});
$('#ask-form').addEventListener('submit', e => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) { showError('Type a question, or tap one of the suggestions below.'); return; }
  ask({ q });
});

function renderRead() {
  $('#read').innerHTML = result.understood.map(u => `<span class="rchip ${u.from}"><b>${esc(u.field)}</b>${esc(u.value)}</span>`).join('');
  $('#notices').innerHTML = result.notices.map(n => `<p class="notice">${esc(n)}</p>`).join('');
}
function renderTiles() {
  $('#tiles').innerHTML = result.missions.map(m => `<button type="button" class="tile" data-m="${m.id}" aria-pressed="${m.selected}">
      <span class="tile-top"><span class="tile-name">${esc(m.name)}</span><span class="tile-g">${esc(m.gText)}</span></span>
      <span class="tile-sub">${esc(m.sub)}</span>
      <span class="tile-home">${esc(m.home)}</span>
      <span class="badge ${m.matches ? 'ok' : 'miss'}">${m.matches ? m.matches + ' tests match' : 'No tests match'}</span>
    </button>`).join('');
}
$('#tiles').addEventListener('click', e => {
  const b = e.target.closest('.tile'); if (!b || !result) return;
  change({ mission: b.dataset.m });
  const top = $('#result').getBoundingClientRect().top;
  if (top > innerHeight * 0.6) $('#result').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
});

// ---------- Verdict and chamber ----------
function renderVerdict(animate) {
  const { verdict, scenario: s, checks } = result;
  const stamp = $('#stamp');
  stamp.className = 'stamp ' + (verdict.state === 'burned' ? 'burn' : 'gap');
  stamp.innerHTML = `${esc(verdict.stamp)}<small>${esc(verdict.count)}</small>`;
  if (animate && !reduced) { void stamp.offsetWidth; stamp.classList.add('in'); }
  $('#headline').textContent = verdict.headline;
  $('#sub').textContent = verdict.sub;
  const why = $('#why');
  why.hidden = !result.why;
  if (result.why) why.innerHTML = `<b>${esc(result.why.lead)}</b> ${esc(result.why.text)} <a href="${esc(result.why.source.url)}" target="_blank" rel="noopener">Source</a>`;

  for (const key of ['earth', 'exploration']) $('#air-' + key).setAttribute('aria-pressed', String(s.air.key === key));
  $('#air-note').textContent = s.air.key === 'custom' ? `Custom air from your question: ${s.air.o2}% O₂ at ${s.air.psi} psi.` : s.mission.note;

  $('#match').innerHTML = `<div class="match-row head"><span></span><span>Your cabin</span><span>BASS-II tests</span><span></span></div>` +
    checks.map(c => `<div class="match-row"><span class="k">${esc(c.label)}</span><span>${esc(c.yours)}</span><span>${esc(c.tested)}</span><span class="pill ${c.ok ? 'ok' : 'miss'}">${c.ok ? '✓ Match' : '✕ Gap'}</span></div>`).join('');
  $('#match-note').textContent = checks.find(c => c.key === 'pressure')?.note || '';

  $('#ov-cam').textContent = 'Chamber view · ' + s.mission.name;
  $('#ov-g').textContent = s.mission.gText;
  $('#ov-gname').textContent = s.mission.gName;
  $('#ov-air').textContent = `${s.air.o2}% O₂ · ${s.air.psi} psi`;
  $('#ov-po2').textContent = `O₂ pressure ${s.air.po2} kPa`;
  $('#ov-msg').hidden = s.mission.g === 0;
  $('#caption').textContent = s.mission.g === 0
    ? 'In orbit nothing rises. Oxygen reaches the flame only by slow diffusion and airflow, so it rounds out, dims and turns blue. Earth’s teardrop flame is shown small for comparison.'
    : `At ${s.mission.id === 'moon' ? '1/6' : '0.38'} of Earth’s gravity some hot gas still rises. How a flame spreads here is barely tested, so the outline is dashed.`;
  flame.set(s.mission.g, s.mission.g === 0);
}
$('#seg').addEventListener('click', e => {
  const b = e.target.closest('button[data-air]'); if (!b || !result || b.dataset.air === result.scenario.air.key) return;
  change({ air: b.dataset.air });
});

// ---------- Step 2: evidence or gaps ----------
function renderPanel2() {
  const panel = $('#panel2');
  if (!result.evidence) {
    $('#s2').textContent = 'What would close this gap?';
    $('#s2-aside').textContent = 'Each card links to its source';
    panel.innerHTML = `<div class="gaps">${result.gaps.map(g => `<div class="gap-card"><span class="t">${esc(g.topic)}</span><p>${esc(g.text)}</p><a href="${esc(g.source.url)}" target="_blank" rel="noopener">${esc(g.source.name)}</a></div>`).join('')}</div>
      <div class="row-actions"><button class="btn alt" type="button" id="nearest">${esc(result.nearest.label)}</button><span class="note">${esc(result.nearest.changes)}</span></div>`;
    $('#nearest').addEventListener('click', () => change(result.nearest.params));
    return;
  }
  const ev = result.evidence, st = ev.stats, t = ev.thickness;
  $('#s2').textContent = 'What’s burning?';
  $('#s2-aside').textContent = 'Tap a thickness';
  const readout = (label, value, sub, ids, go) => `<button type="button" class="ro" data-ids="${ids.join(',')}"><span class="l">${label}</span><span class="v">${value}</span><span class="s">${sub}</span><span class="go">${go}</span></button>`;
  panel.innerHTML = `
    <div class="mat-row">
      <div class="mat"><b>${esc(result.scenario.material.name)}</b><span>NASA’s standard test fuel · more materials as the corpus grows</span></div>
      <div class="chips" role="group" aria-label="Sheet thickness">
        <button type="button" data-t="all" aria-pressed="${t === null}">All</button>
        ${THICKNESSES.map(n => `<button type="button" data-t="${n}" aria-pressed="${t === n}"><i class="sw sw${n}"></i>${n} mm</button>`).join('')}
      </div>
    </div>
    <div class="ev-grid">
      <div><div class="chart-wrap" id="chart"></div><div class="legend" id="legend"></div></div>
      <div class="readouts">
        ${readout('Tests', st.tests, st.notTracked ? `${st.notTracked} with spread not tracked` : 'all with spread tracked', ev.ids, 'Source rows')}
        ${readout('Burned for', `${Math.round(st.burnMin)}–${Math.round(st.burnMax)} <small>min</small>`, 'per test', ev.ids, 'Source rows')}
        ${readout('Fastest spread', `${st.fastest.spread} <small>mm/s</small>`, `${st.fastest.id} · ${st.fastest.thicknessMm} mm · ${st.fastest.velocity} cm/s air`, [st.fastest.id], 'Source row')}
        ${readout('Slowest spread', `${st.slowest.spread} <small>mm/s</small>`, `${st.slowest.id} · ${st.slowest.thicknessMm} mm · ${st.slowest.velocity} cm/s air`, [st.slowest.id], 'Source row')}
      </div>
    </div>
    <p class="finding"><b>${esc(ev.finding.lead)}</b> ${esc(ev.finding.text)}</p>
    <p class="caveat">${esc(ev.caveat)}</p>`;
  panel.querySelector('.chips').addEventListener('click', e => {
    const b = e.target.closest('button[data-t]'); if (!b) return;
    change({ thickness: b.dataset.t });
  });
  panel.querySelectorAll('.ro').forEach(b => b.addEventListener('click', () => openProof(b.dataset.ids.split(','))));
  renderChart(ev);
}

function renderChart(ev) {
  const W = 560, H = 300, L = 50, R = 14, T = 16, B = 44, xMax = 22, yMax = 0.16;
  const x = v => L + v / xMax * (W - L - R), y = s => T + (1 - s / yMax) * (H - T - B);
  const on = new Set(ev.ids);
  let h = '';
  for (const s of [0, 0.04, 0.08, 0.12, 0.16]) h += `<line class="gridl" x1="${L}" x2="${W - R}" y1="${y(s)}" y2="${y(s)}"/><text class="ax" x="${L - 8}" y="${y(s) + 3.5}" text-anchor="end">${s.toFixed(2)}</text>`;
  for (const v of [0, 5, 10, 15, 20]) h += `<text class="ax" x="${x(v)}" y="${H - B + 17}" text-anchor="middle">${v}</text>`;
  h += `<line class="base" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  h += `<text class="ax-t" x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">Airflow against the flame (cm/s)</text>`;
  h += `<text class="ax-t" transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">Flame spread (mm/s)</text>`;
  if (ev.airflow !== null && ev.airflow <= xMax) h += `<line class="guide" x1="${x(ev.airflow)}" x2="${x(ev.airflow)}" y1="${T}" y2="${y(0)}"/><text class="guide-t" x="${x(ev.airflow) + 5}" y="${T + 10}">your airflow</text>`;
  const tracked = records.filter(r => r.spread);
  const order = [...tracked.filter(r => !on.has(r.id)), ...tracked.filter(r => on.has(r.id))];
  const pairs = r => r.velocity.map((v, i) => ({ v, s: r.spread[i] })).sort((a, b) => a.v - b.v);
  for (const r of order) {
    const col = on.has(r.id) ? `var(--t${r.thicknessMm})` : 'var(--mark-muted)';
    const pts = pairs(r);
    if (pts.length > 1) h += `<polyline fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="${on.has(r.id) ? 0.55 : 0.8}" points="${pts.map(p => x(p.v) + ',' + y(p.s)).join(' ')}"/>`;
    for (const p of pts) h += `<circle cx="${x(p.v)}" cy="${y(p.s)}" r="5" fill="${col}" stroke="var(--surface)" stroke-width="2"/>`;
  }
  const f = ev.stats.fastest, fx = x(f.velocity), fy = y(f.spread), end = fx > W - 120;
  h += `<text class="dlabel" x="${fx + (end ? -10 : 10)}" y="${fy + 4}" text-anchor="${end ? 'end' : 'start'}">${f.id} · ${f.spread}</text>`;
  for (const r of order) for (const p of pairs(r)) h += `<circle class="hit" cx="${x(p.v)}" cy="${y(p.s)}" r="11" tabindex="0" role="button" data-id="${r.id}" data-t="${r.thicknessMm}" data-v="${p.v}" data-s="${p.s}" aria-label="${r.id}, ${r.thicknessMm} millimetre sheet, ${p.v} centimetres per second, spread ${p.s} millimetres per second. Opens the source row."/>`;

  const wrap = $('#chart');
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Flame spread against airflow for the BASS-II acrylic sheet tests. Open the source rows for the full table.">${h}</svg><div class="tip" hidden></div>`;
  const tip = wrap.querySelector('.tip');
  const show = el => {
    const r = el.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    tip.innerHTML = `<b>${el.dataset.id}</b> · ${el.dataset.t} mm sheet<br>${el.dataset.v} cm/s air → <b>${el.dataset.s}</b> mm/s<br>Tap for the source row`;
    tip.style.left = Math.min(Math.max(r.left + r.width / 2 - wr.left, 80), wr.width - 80) + 'px';
    tip.style.top = (r.top - wr.top + 6) + 'px';
    tip.hidden = false;
  };
  wrap.querySelectorAll('.hit').forEach(el => {
    el.addEventListener('pointerenter', () => show(el));
    el.addEventListener('focus', () => show(el));
    el.addEventListener('pointerleave', () => { tip.hidden = true; });
    el.addEventListener('blur', () => { tip.hidden = true; });
    el.addEventListener('click', () => openProof([el.dataset.id]));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProof([el.dataset.id]); } });
  });
  $('#legend').innerHTML = ev.thickness === null
    ? `<span>Sheet thickness</span>${THICKNESSES.map(n => `<span><i class="sw sw${n}"></i>${n} mm</span>`).join('')}<span>· lines join readings from one test</span>`
    : `<span><i class="sw sw${ev.thickness}"></i>${ev.thickness} mm sheets</span><span><i class="sw swm"></i>other tests</span><span>· lines join readings from one test</span>`;
}

// ---------- Step 3: proof ----------
function openProof(ids) {
  const body = $('#proof-body');
  if (ids === 'gap') {
    const E = result.envelope;
    $('#proof-title').textContent = 'The sources behind this gap';
    body.innerHTML = `<div class="cite"><b>What the BASS-II tests cover</b><span>Microgravity aboard the ISS, about 14.7 psi, ${E.o2Min}–${E.o2Max}% O₂, ${E.flowMin}–${E.flowMax} cm/s opposed airflow, ${E.thicknesses[0]}–${E.thicknesses.at(-1)} mm acrylic sheets.</span><span>${esc(E.pressureNote)}</span></div>
      ${result.sources.map(s => `<div class="cite"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></div>`).join('')}
      <p class="note">Oxygen and nitrogen partial pressures are calculated from each cabin’s total pressure and oxygen share.</p>`;
  } else {
    const list = ids || records.map(r => r.id);
    const rows = records.filter(r => list.includes(r.id));
    $('#proof-title').textContent = rows.length === 1 ? `Test ${rows[0].id}, as NASA reported it` : `The ${rows.length} rows behind this answer`;
    body.innerHTML = `<div class="cite"><b>NASA/TM-20210011385, Table 5.1, printed p. 57</b><span>BASS-II · acrylic (PMMA) sheets · opposed airflow · microgravity aboard the ISS · NASA PSI-25, DOI 10.60555/4qc4-de67</span><a href="https://ntrs.nasa.gov/citations/20210011385" target="_blank" rel="noopener">Open the report on NASA NTRS</a></div>
      <div class="tbl"><table>
        <thead><tr><th>Test</th><th>Sheet</th><th>Width</th><th>Sides</th><th>Airflow → spread</th><th>Burned</th><th>O₂ start → end</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td><b>${r.id}</b></td><td class="n">${r.thicknessMm} mm</td><td class="n">${r.widthMm} mm</td><td class="n">${r.burningSides}</td>
          <td class="n">${r.spread ? r.velocity.map((v, i) => `${v} cm/s → ${r.spread[i]} mm/s`).join('<br>') : `<span class="nt">Not tracked</span> at ${r.velocity.join(', ')} cm/s`}</td>
          <td class="n">${r.burnMin} min</td><td class="n">${r.oxygenInitial}% → ${r.oxygenFinal}%</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="note">Blank spread cells in the report mean the spread was not tracked, not zero. Oxygen values are the start and end of each test, not a constant level. Transcribed by our team; independent check pending.</p>
      ${rows.length < records.length ? '<div><button class="btn alt" type="button" id="all-rows">Show all 20 rows</button></div>' : ''}`;
    $('#all-rows')?.addEventListener('click', () => openProof(null));
  }
  const dialog = $('#proof');
  if (!dialog.open) dialog.showModal();
  body.scrollTop = 0;
}
$('#open-proof').addEventListener('click', () => openProof(result?.evidence ? result.evidence.ids : 'gap'));
$('#proof').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.closest('[data-close]')) e.currentTarget.close(); });
function renderProofText() {
  const ev = result.evidence;
  $('#proof-text').textContent = ev ? 'Every number, dot and card above opens its row in NASA’s report. Nothing here is generated.' : 'Every gap above links to its NASA or journal source, next to what the BASS-II tests do cover.';
  $('#open-proof').textContent = ev ? `Open the ${ev.ids.length} source rows` : 'Open the sources';
}

// ---------- Chamber flame (an illustration, labelled as one) ----------
const flame = (() => {
  const cv = $('#flame'), ctx = cv.getContext('2d');
  let W = 0, H = 0, g = 0, gT = 0, known = true, raf = 0, visible = true;
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function shape(cx, cy, R, gg, t) {
    const pts = [];
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, up = Math.cos(a);
      let r = R * (1 + 0.03 * Math.sin(3 * a + t * 2.1) + 0.02 * Math.sin(5 * a - t * 3.3) + 0.012 * Math.sin(7 * a + t * 1.7));
      if (up > 0) r *= 1 + gg * 2.5 * Math.pow(up, 2.2) * (1 + 0.07 * Math.sin(t * 6.5 + a * 2)); else r *= 1 - gg * 0.28 * (-up);
      let px = Math.sin(a) * r; const py = -Math.cos(a) * r;
      if (up > 0) { px *= 1 - gg * 0.5 * Math.pow(up, 1.2); px += gg * R * 0.14 * Math.pow(up, 3) * Math.sin(t * 3.1); }
      pts.push([cx + px, cy + py]);
    }
    return pts;
  }
  function trace(pts) { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); }
  function fuel(cx, cy, r) { ctx.save(); ctx.fillStyle = '#20252d'; ctx.strokeStyle = '#48515c'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  function micro(cx, cy, R, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let gr = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.9);
    gr.addColorStop(0, 'rgba(70,100,255,0.22)'); gr.addColorStop(1, 'rgba(70,100,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 26; ctx.shadowColor = 'rgba(80,120,255,0.9)';
    trace(shape(cx, cy, R, 0, t));
    gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.07);
    gr.addColorStop(0, 'rgba(20,30,110,0)'); gr.addColorStop(0.58, 'rgba(40,70,220,0.10)'); gr.addColorStop(0.86, 'rgba(90,130,255,0.62)');
    gr.addColorStop(0.96, 'rgba(175,195,255,0.92)'); gr.addColorStop(1, 'rgba(120,150,255,0)');
    ctx.fillStyle = gr; ctx.fill(); ctx.restore();
    fuel(cx, cy, R * 0.16);
  }
  function earth(cx, cy, R, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(255,140,40,0.85)';
    trace(shape(cx, cy, R, 1, t));
    const gr = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.05, cx, cy - R * 0.6, R * 3.3);
    gr.addColorStop(0, 'rgba(255,250,228,0.97)'); gr.addColorStop(0.2, 'rgba(255,214,110,0.92)'); gr.addColorStop(0.48, 'rgba(255,148,40,0.72)');
    gr.addColorStop(0.8, 'rgba(230,80,10,0.32)'); gr.addColorStop(1, 'rgba(200,50,0,0)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(80,120,255,0.8)'; ctx.fillStyle = 'rgba(80,120,255,0.5)';
    ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.5, R * 0.62, R * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    fuel(cx, cy + R * 0.72, R * 0.16);
  }
  function unknown(cx, cy, R, gg, t) {
    const pts = shape(cx, cy, R, gg, reduced ? 0 : t * 0.6);
    ctx.save();
    ctx.fillStyle = 'rgba(242,193,46,0.05)'; trace(pts); ctx.fill();
    ctx.setLineDash([7, 7]); ctx.lineDashOffset = reduced ? 0 : -t * 14;
    ctx.strokeStyle = 'rgba(242,193,46,0.85)'; ctx.lineWidth = 2; trace(pts); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(242,193,46,0.92)'; ctx.font = `700 ${Math.round(R * 0.9)}px Bahnschrift, "Arial Narrow", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', cx, cy - R * 0.3 - R * gg * 0.9);
    ctx.restore();
    fuel(cx, cy + R * 0.5, R * 0.16);
  }
  function grid() {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); ctx.stroke(); }
    ctx.restore();
  }
  function frame(ms) {
    const t = reduced ? 0 : ms / 1000;
    g += (gT - g) * (reduced ? 1 : 0.08);
    ctx.clearRect(0, 0, W, H); grid();
    const R = Math.min(W, H) * 0.15;
    if (known) {
      micro(W * 0.58, H * 0.5, R, t);
      const rx = W * 0.15, ry = H * 0.56, rr = Math.min(W, H) * 0.042;
      earth(rx, ry, rr, t);
      ctx.save(); ctx.fillStyle = 'rgba(201,210,221,0.6)'; ctx.font = '10px "Cascadia Mono", Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText('EARTH 1 g', rx, ry + rr * 2.2); ctx.restore();
    } else unknown(W * 0.58, H * 0.56, R, g, t);
    if (!reduced && visible) raf = requestAnimationFrame(frame);
  }
  function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  new ResizeObserver(() => { size(); start(); }).observe(cv);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); }).observe(cv);
  return { set(gg, isKnown) { gT = gg; known = isKnown; if (reduced) g = gg; start(); } };
})();

function render(animate) { renderRead(); renderTiles(); renderVerdict(animate); renderPanel2(); renderProofText(); }

// ---------- Boot: load the table once, then answer the first suggestion ----------
(async () => {
  try { records = (await api('/api/data')).records; }
  catch { showError('Couldn’t reach the local server. Start it with: node server.mjs'); return; }
  input.value = QUESTIONS[0];
  await ask({ q: QUESTIONS[0] }, { animate: false });
})();
