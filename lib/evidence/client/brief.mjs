// Turns one answer from the evidence engine into a Markdown evidence brief.
// Pure and DOM-free: the same answer, rows and date always give the same text, so the tests run the code the
// browser runs. It adds no number and no claim of its own. Every line is copied from the answer, or from the
// source rows the answer cites.

// Text that came from the question (the question itself, and notices and reasons that quote it) is written as plain
// text: line breaks are folded and Markdown's own characters are escaped, so a question can never add a heading, a
// link or a forged section to a brief that says it was computed from NASA rows.
const plain = v => String(v ?? '').replace(/\s+/g, ' ').trim().replace(/[\\`*_{}[\]<>#|~]/g, '\\$&');
const cell = v => plain(v);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`,
  ...rows.map(r => `| ${r.map(cell).join(' | ')} |`)].join('\n');
// Only http(s) links are written as links, so a brief can never carry a script or file URL. Brackets in the
// text and parentheses or spaces in the address are escaped, so neither can end the link early.
const hex = c => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`;
const link = s => !s ? '' : /^https?:\/\//.test(s.url ?? '') ? `[${String(s.label ?? s.name).replace(/[[\]]/g, '\\$&')}](${s.url.replace(/[()\s]/g, hex)})` : String(s.label ?? s.name);

const FROM = { picked: 'you chose it', question: 'your question', default: 'default, not stated', unresolved: 'could not be read' };

/**
 * @param answer   one answer from GET /api/burn/ask
 * @param options  asked: the question as typed; records: the acrylic rows from GET /api/burn/data, used to print
 *                 each matching test's full row; product and date go in the heading line and are not computed here
 */
export function briefMarkdown(answer, { asked, records = [], product = 'FlameScope', date = '', notes = [] } = {}) {
  const a = answer, ev = a.evidence, out = [];
  const question = String(asked || a.question || a.canonical || '').trim() || 'Untitled question';
  out.push(`# Evidence brief: ${plain(question)}`, '');
  out.push(`_${[product, date].filter(Boolean).join(', ')}. Computed from NASA source rows by fixed rules. No AI model wrote any part of this brief, and it is not a safety rating._`, '');
  if (a.canonical && a.canonical !== question) out.push(`Question as read: ${plain(a.canonical)}`, '');

  out.push('## Answer', '', `**${a.verdict.stamp}** · ${a.verdict.count}`, '', plain(a.verdict.headline), '', plain(a.verdict.sub), '');
  if (a.why) out.push(`> **${a.why.lead}** ${a.why.text} (${link(a.why.source)})`, '');

  out.push('## How the question was read', '', table(['Condition', 'Read as', 'From'], a.understood.map(u => [u.field, u.value, FROM[u.from] ?? u.from])), '');
  if (a.notices.length) out.push(...a.notices.map(n => `- ${plain(n)}`), '');
  if (a.unresolved.length) out.push('### What could not be read', '', ...a.unresolved.map(u => `- **${u.label}:** ${plain(u.reason)}`), '');

  out.push('## Condition checks', '', table(['Condition', 'Your cabin', 'NASA’s tests', 'Result', 'Note'],
    a.checks.map(c => [c.label, c.yours, c.tested, c.ok ? c.statusLabel : `${c.statusLabel} (blocks a match)`, c.note ?? ''])), '');

  if (ev?.kind === 'spread') {
    const rows = records.filter(r => ev.ids.includes(r.id));
    out.push(`## Matching tests (${ev.ids.length})`, '');
    out.push(rows.length === ev.ids.length
      ? table(['Test', 'Sheet', 'Width', 'Burning sides', 'Airflow → spread', 'Burned', 'O₂ start → end', 'Source row'],
          rows.map(r => [r.id, `${r.thicknessMm} mm`, `${r.widthMm} mm`, r.burningSides,
            r.spread ? r.velocity.map((v, i) => `${v} cm/s → ${r.spread[i]} mm/s`).join('; ') : `Not tracked at ${r.velocity.join(', ')} cm/s`,
            `${r.burnMin} min`, `${r.oxygenInitial}% → ${r.oxygenFinal}%`, r.sourceLocation]))
      : table(['Test', 'Sheet', 'Airflow', 'Spread'],
          ev.readings.map(p => [p.id, `${p.thicknessMm} mm`, `${p.velocity} cm/s`, p.spread === null ? 'Not tracked' : `${p.spread} mm/s`])), '');
    out.push(`**${ev.finding.lead}** ${ev.finding.text}`, '', ev.caveat, '',
      'A blank spread cell in the report means the spread was not tracked, not zero. Oxygen values are the start and end of each test, not a constant level.', '');
  } else if (ev?.kind === 'outcomes') {
    const nomex = ev.set === 'nomex', at = ev.airflow !== null;
    out.push(`## Matching tests (${ev.tests.length})`, '');
    out.push(table(['Test', ...(nomex ? ['Date'] : ['Study', 'Width']), 'Airflow', 'O₂', 'What happened', ...(at ? [`At ${ev.airflow} cm/s`] : []), 'Source row'],
      ev.tests.map(t => [t.id, ...(nomex ? [t.date] : [t.study, t.width]), t.flowText, t.oxygenText, t.happened, ...(at ? [t.atYourAirflow] : []), t.sourceLocation])), '');
    out.push(`**${ev.finding.lead}** ${ev.finding.text}`, '', ev.caveat, '');
  }
  if (a.related) out.push(`**Also seen in another experiment.** ${a.related.text} (${link(a.related.source)})`, '');

  if (a.closest?.tests.length) {
    out.push('## Closest tests, and what each one recorded', '',
      'These tests recorded some of your conditions, but not all of them together, so none of them counts as a match.', '',
      table(['Test', ...a.closest.tests[0].conditions.map(c => c.label), 'Source row'],
        a.closest.tests.map(t => [t.id, ...t.conditions.map(c => `${c.ok ? 'yes' : 'no'}: ${c.recorded}`),
          t.untied ? `${t.sourceLocation} (the table can’t tie this test’s oxygen to one airflow reading)` : t.sourceLocation])), '');
  }
  if (a.gaps.length) out.push('## What is missing', '', ...a.gaps.map(g => `- **${g.topic}:** ${g.text} (${link(g.source)})`), '');

  out.push('## The rule used', '', a.applicability.policy, '', `What this set of tests covers overall: ${a.envelope.summary} ${a.envelope.pressureNote}`, '');
  out.push('## Sources', '', ...a.sources.map(s => `- ${link(s)}`), '');
  if (notes.length) out.push('## How these rows were obtained and checked', '', ...notes.map(n => `- ${plain(n)}`), '');
  out.push('## Limits', '',
    '- This describes what NASA recorded in the tests listed. It does not rate any material as safe or unsafe.',
    '- All of these tests ran in microgravity aboard the ISS. They do not say what happens in lunar or Martian gravity.',
    '- The rows come from one NASA report, so they are not independent studies.', '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** A safe download name for a brief: "flamescope-brief-will-acrylic-burn-on-the-iss.md". */
export function briefFileName(answer, prefix = 'flamescope-') {
  const slug = String(answer.question || answer.canonical || '').toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'answer';
  return `${prefix}brief-${slug}.md`;
}
