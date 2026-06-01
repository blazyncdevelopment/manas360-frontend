import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'MANAS360_Interactive_Demo_V5.html');
const outPath = path.join(__dirname, '..', 'src', 'pages', 'how-it-works', 'howItWorksData.ts');
const html = fs.readFileSync(htmlPath, 'utf8');

const journeyLabels = {
  home: 'Home',
  discover: 'Not Sure-Discover Myself',
  group: 'Group Therapies-My Topic-Pay Less',
  patient: 'Mental Wellness Seeker',
  provider: 'Provider Journey',
  corporate: 'Corporate Wellness',
  retreat: 'Detox-Tranquility Retreats',
  training: 'Certify-Earn More Journey',
  admin: 'MANAS360-Admin',
  onboarding: 'Anyone Onboarding-Jiffy',
  executive: 'Executive-One on One Goals',
  nri: 'NRI-Janmabhoomi Connection',
  analytics: 'Analytics for Therapists',
  'analytics-patient': 'Analytics for Patients',
  'analytics-corporate': 'Analytics for Corporate',
  'analytics-chw': 'Analytics for CHWs',
  buddy: 'AnytimeBUDDY — 24/7 AI Companion',
  meera: 'Dr. Meera — AI Health Chat',
  pet: 'Digital Pet Companions',
  sound: 'Sound Therapy',
  screening: 'Free Mental Health Screening',
  sixer: 'Hit a Sixer — Refer & Earn',
  clinic: 'MyDigitalClinic',
};

const phaseColorMap = [
  ['#2563EB', 'blue'],
  ['#16A34A', 'green'],
  ['#EA580C', 'orange'],
  ['#002365', 'navy'],
  ['#DB2777', 'pink'],
];

const journeyNext = {
  discover: { id: 'group', label: 'See Group Therapy Journey →' },
  group: { id: 'patient', label: 'See Mental Wellness Seeker →' },
  patient: { id: 'provider', label: 'See Provider View →' },
  provider: { id: 'corporate', label: 'See Corporate View →' },
  corporate: { id: 'retreat', label: 'See Retreat Journey →' },
  retreat: { id: 'training', label: 'See Certify-Earn More →' },
  training: { id: 'admin', label: 'See Admin View →' },
  admin: { id: 'onboarding', label: 'See Onboarding Journey →' },
  onboarding: { id: 'executive', label: 'See Executive Journey →' },
  executive: { id: 'nri', label: 'See NRI Journey →' },
  nri: { id: 'analytics', label: 'See AI-Powered Analytics →' },
  analytics: { id: 'analytics-patient', label: 'See Patient Analytics →' },
  'analytics-patient': { id: 'analytics-corporate', label: 'See Corporate Analytics →' },
  'analytics-corporate': { id: 'analytics-chw', label: 'See CHW Analytics →' },
  'analytics-chw': { id: 'discover', label: 'Explore Free Tools →' },
  buddy: { id: 'pet', label: 'See Digital Pet Journey →' },
  meera: { id: 'buddy', label: 'See AnytimeBuddy Journey →' },
  pet: { id: 'sound', label: 'See Sound Therapy Journey →' },
  sound: { id: 'screening', label: 'See Free Screening Journey →' },
  screening: { id: 'patient', label: 'See Full Patient Journey →' },
  sixer: { id: 'discover', label: 'See Free Explorer Journey →' },
  clinic: { id: 'provider', label: 'See Provider Journey →' },
};

const patientPhases = [
  { variant: 'blue', title: '🔍 Phase 1 — Discovery (Free · No Login)', subtitle: 'The courage gap is real. 70% of people who need help never seek it. This phase removes every barrier.', from: 1, to: 3 },
  { variant: 'green', title: '🔑 Phase 2 — Platform Access (₹1 auth → 6 days free)', subtitle: 'The screening result + Buddy conversation creates the "aha moment." Now they\'re ready to commit — but the 6-day free trial makes it risk-free.', from: 4, to: 6 },
  { variant: 'orange', title: '🧠 Phase 3 — Therapy Arc (₹699–₹999/session · 60/40 split)', subtitle: 'The clinical core. Psychologist first, psychiatrist if needed, group therapy for community. Every session paid separately via PhonePe.', from: 7, to: 10 },
  { variant: 'navy', title: '✨ Phase 4 — Premium Upgrades (The Healing Accelerators)', subtitle: 'Therapy is the foundation. These tools amplify it — between sessions, before bed, during panic, on lonely nights. Therapist prescribes them like medicine.', from: 11, to: 14 },
  { variant: 'pink', title: '🌿 Phase 5 — Transformation (Retreat → Alumni → Give Back)', subtitle: 'From episodic to transformational. The retreat is the crescendo — but the alumni community and give-back loop ensure the change lasts forever.', from: 15, to: 17 },
];

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '<br>');
}

function innerToString(el) {
  if (!el) return '';
  return decodeHtml(
    el
      .replace(/<span class="stat-value">/g, '<strong>')
      .replace(/<\/span>/g, '</strong>')
      .replace(/<\/?span[^>]*>/g, '')
  );
}

function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

function extractMatch(htmlChunk, regex) {
  const m = htmlChunk.match(regex);
  return m ? m[1] : '';
}

function parseAllFlowSteps(sectionHtml) {
  const steps = [];
  const stepRegex =
    /<div class="flow-step">[\s\S]*?<div class="step-number">(\d+)<\/div>[\s\S]*?<div class="step-title">([\s\S]*?)<\/div>[\s\S]*?<div class="step-description">([\s\S]*?)<\/div>[\s\S]*?<span class="step-action">✓\s*([\s\S]*?)<\/span>/g;
  let m;
  while ((m = stepRegex.exec(sectionHtml)) !== null) {
    steps.push({
      number: Number(m[1]),
      title: stripTags(m[2]),
      description: innerToString(m[3]),
      action: stripTags(m[4]),
    });
  }
  return steps;
}

function parseStatText(statTextHtml) {
  let s = statTextHtml.replace(/<span class="stat-value">([\s\S]*?)<\/span>/g, '<strong>$1</strong>');
  s = decodeHtml(s.replace(/<(?!\/?strong\b)[^>]+>/g, ''));
  return s.replace(/\s+/g, ' ').trim();
}

function parseStats(sectionHtml) {
  const stats = [];
  const flowIdx = sectionHtml.indexOf('<div class="journey-flow">');
  const pricingIdx = sectionHtml.indexOf('<div class="pricing-table">');
  const cut =
    flowIdx >= 0 ? flowIdx : pricingIdx >= 0 ? pricingIdx : sectionHtml.indexOf('<div class="tips-box"');
  const headerBlock = cut > 0 ? sectionHtml.slice(0, cut) : sectionHtml.slice(0, 2500);
  const statBlockRegex = /<div class="stat">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = statBlockRegex.exec(headerBlock)) !== null) {
    const block = m[1];
    const icon = extractMatch(block, /<span class="stat-icon">([^<]*)<\/span>/);
    const textIdx = block.indexOf('stat-text">');
    if (!icon || textIdx < 0) continue;
    let statTextHtml = block.slice(textIdx + 'stat-text">'.length);
    const lastClose = statTextHtml.lastIndexOf('</span>');
    if (lastClose >= 0) statTextHtml = statTextHtml.slice(0, lastClose);
    stats.push({ icon, text: parseStatText(statTextHtml) });
  }
  return stats;
}

function parsePricing(sectionHtml) {
  const rows = [];
  const table = extractMatch(
    sectionHtml,
    /<div class="pricing-table">([\s\S]*?)<\/div>\s*\n\s*<\/div>\s*\n\n\s*(?:<div class="journey-flow">|<div class="tips-box">|<div class="nav-buttons">)/
  );
  if (!table) {
    const table2 = extractMatch(sectionHtml, /<div class="pricing-table">([\s\S]*?)<\/div>\s*<\/div>/);
    if (!table2) return rows;
    return parsePricingTable(table2);
  }
  return parsePricingTable(table);
}

function parsePricingTable(table) {
  const rows = [];
  const rowMatches = table.match(/<div class="pricing-row">[\s\S]*?<\/div>\s*(?=<div class="pricing-row">|$)/g) || [];
  for (const rowHtml of rowMatches) {
    const cells = [];
    const itemRegex =
      /<div class="pricing-item">\s*<div class="pricing-label">([\s\S]*?)<\/div>\s*<div class="pricing-value">([\s\S]*?)<\/div>\s*<\/div>/g;
    let im;
    while ((im = itemRegex.exec(rowHtml)) !== null) {
      cells.push({ label: stripTags(im[1]), value: stripTags(im[2]) });
    }
    if (cells.length) rows.push({ cells });
  }
  return rows;
}

function parseNavNext(sectionHtml) {
  const m = sectionHtml.match(
    /<button class="btn btn-outline" onclick="showJourney\('([^']+)'\)">([^<]+)<\/button>\s*<\/div>\s*<\/section>/
  );
  if (!m) return undefined;
  return { id: m[1], label: decodeHtml(m[2].trim()) };
}

function parsePatientBlocks(sectionHtml) {
  const allSteps = parseAllFlowSteps(sectionHtml);
  const blocks = patientPhases.map((phase) => ({
    kind: 'phase',
    variant: phase.variant,
    title: phase.title,
    subtitle: phase.subtitle,
    steps: allSteps.filter((s) => s.number >= phase.from && s.number <= phase.to),
  }));
  const pricing = parsePricing(sectionHtml);
  if (pricing.length) blocks.push({ kind: 'pricing', rows: pricing });
  return blocks;
}

function parseSection(id) {
  const sectionRegex = new RegExp(
    `<section id="${id}-section" class="journey-section">([\\s\\S]*?)</section>`,
    'i'
  );
  const m = html.match(sectionRegex);
  if (!m) throw new Error(`Section not found: ${id}`);
  const sectionHtml = m[1];

  const heading = stripTags(extractMatch(sectionHtml, /<h2>([\s\S]*?)<\/h2>/));
  const description = stripTags(
    extractMatch(sectionHtml, /<div class="journey-header">[\s\S]*?<p>([\s\S]*?)<\/p>/)
  );

  const stats = parseStats(sectionHtml);
  const tipTitle = stripTags(
    extractMatch(sectionHtml, /<div class="tips-box">[\s\S]*?<h4>([\s\S]*?)<\/h4>/)
  );
  const tipTextRaw = extractMatch(
    sectionHtml,
    /<div class="tips-box">[\s\S]*?<h4>[\s\S]*?<\/h4>\s*<p>([\s\S]*?)<\/p>/
  );
  const tipText = innerToString(tipTextRaw);
  let next = parseNavNext(sectionHtml) || journeyNext[id];

  let blocks = [];
  if (id === 'patient') {
    blocks = parsePatientBlocks(sectionHtml);
  } else if (id === 'clinic') {
    blocks = [];
  } else {
    const pricing = parsePricing(sectionHtml);
    if (pricing.length) blocks.push({ kind: 'pricing', rows: pricing });
    const steps = parseAllFlowSteps(sectionHtml);
    if (steps.length) blocks.push({ kind: 'steps', steps });
  }

  const content = { heading, description, stats, blocks, tipTitle, tipText };
  if (next && next.id !== 'home') content.next = next;
  if (id === 'clinic') {
    content.stats = [];
    content.tipTitle = '';
    content.tipText = '';
    content.next = journeyNext.clinic;
  }
  return content;
}

function parseHomeCard(cardHtml, badgeType) {
  const id = extractMatch(cardHtml, /showJourney\('([^']+)'\)/);
  const icon = extractMatch(cardHtml, /<span class="role-icon">([^<]*)<\/span>/);
  const title = stripTags(extractMatch(cardHtml, /<h3>([\s\S]*?)<\/h3>/));
  const description = stripTags(extractMatch(cardHtml, /<p>([\s\S]*?)<\/p>/));
  const cta = stripTags(extractMatch(cardHtml, /<button class="cta">([\s\S]*?)<\/button>/));
  let badge = extractMatch(
    cardHtml,
    /<div class="(?:freebie-badge|feature-badge|analytics-badge)">([\s\S]*?)<\/div>/
  );
  badge = badge ? stripTags(badge) : undefined;
  const homeCard = { id, icon, title, description, cta };
  if (badge) homeCard.badge = badge;
  if (badgeType) homeCard.badgeType = badgeType;
  if (cardHtml.includes('feature-card')) homeCard.featureCard = true;
  return homeCard;
}

function parseHomeSections() {
  const home = extractMatch(html, /<section id="home-section"[\s\S]*?>([\s\S]*?)<\/section>/);
  const gridBlocks = home.split(/<div class="journey-section-grid">/).slice(1);
  const gridMeta = [
    { gridClass: 'freebies-grid', badgeType: 'freebie' },
    { gridClass: 'pathways-grid', badgeType: null },
    { gridClass: 'features-grid', badgeType: 'feature' },
    { gridClass: 'pathways-grid', badgeType: 'analytics' },
  ];

  return gridBlocks.map((block, idx) => {
    const title = stripTags(extractMatch(block, /<div class="section-title">([\s\S]*?)<\/div>/));
    const subtitle = stripTags(extractMatch(block, /<div class="section-subtitle">([\s\S]*?)<\/div>/));
    const { gridClass, badgeType } = gridMeta[idx];
    const cards = [];
    const cardParts = block.split(/<div class="role-card/);
    for (let i = 1; i < cardParts.length; i++) {
      cards.push(parseHomeCard('<div class="role-card' + cardParts[i].split('</div>\n      </div>')[0], badgeType));
    }
    return { title, subtitle, gridClass, cards };
  });
}

function tsString(s) {
  return JSON.stringify(s);
}

function journeyKey(id) {
  return /^[a-z]+$/.test(id) ? id : `'${id}'`;
}

function emitStat(stat) {
  return `{ icon: ${tsString(stat.icon)}, text: ${tsString(stat.text)} }`;
}

function emitStep(step) {
  const num = step.number != null ? `number: ${step.number}, ` : '';
  return `{ ${num}title: ${tsString(step.title)}, description: ${tsString(step.description)}, action: ${tsString(step.action)} }`;
}

function emitPricing(rows) {
  const rowStrs = rows.map((row) => {
    const cells = row.cells
      .map((c) => `{ label: ${tsString(c.label)}, value: ${tsString(c.value)} }`)
      .join(', ');
    return `{ cells: [${cells}] }`;
  });
  return `{ kind: 'pricing' as const, rows: [\n      ${rowStrs.join(',\n      ')}\n    ] }`;
}

function emitBlock(block) {
  if (block.kind === 'pricing') return emitPricing(block.rows);
  if (block.kind === 'phase') {
    return `{ kind: 'phase' as const, variant: '${block.variant}', title: ${tsString(block.title)}, subtitle: ${tsString(block.subtitle)}, steps: [\n${block.steps.map((s) => '      ' + emitStep(s)).join(',\n')}\n    ] }`;
  }
  return `{ kind: 'steps' as const, steps: [\n${block.steps.map((s) => '      ' + emitStep(s)).join(',\n')}\n    ] }`;
}

function emitJourney(id, content) {
  const stats = content.stats.map(emitStat).join(',\n    ');
  const blocks = content.blocks.map((b) => '    ' + emitBlock(b)).join(',\n');
  const nextLine = content.next
    ? `next: { id: ${tsString(content.next.id)}, label: ${tsString(content.next.label)} },`
    : '';

  return `  ${journeyKey(id)}: {
    heading: ${tsString(content.heading)},
    description: ${tsString(content.description)},
    stats: [
    ${stats}
    ],
    blocks: [
${blocks}
    ],
    tipTitle: ${tsString(content.tipTitle)},
    tipText: ${tsString(content.tipText)}${nextLine ? ',\n    ' + nextLine : ''}
  }`;
}

function emitHomeSections(sections) {
  const lines = ['export const homeSections: HomeSection[] = ['];
  for (const sec of sections) {
    lines.push('  {');
    lines.push(`    title: ${tsString(sec.title)},`);
    lines.push(`    subtitle: ${tsString(sec.subtitle)},`);
    lines.push(`    gridClass: '${sec.gridClass}',`);
    lines.push('    cards: [');
    for (const c of sec.cards) {
      const parts = [
        `id: '${c.id}'`,
        `icon: ${tsString(c.icon)}`,
        `title: ${tsString(c.title)}`,
        `description: ${tsString(c.description)}`,
        `cta: ${tsString(c.cta)}`,
      ];
      if (c.badge) parts.push(`badge: ${tsString(c.badge)}`);
      if (c.badgeType) parts.push(`badgeType: '${c.badgeType}'`);
      if (c.featureCard) parts.push('featureCard: true');
      lines.push(`      { ${parts.join(', ')} },`);
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('];');
  return lines.join('\n');
}

const journeyIds = Object.keys(journeyLabels).filter((k) => k !== 'home');
const journeyData = {};
for (const id of journeyIds) {
  journeyData[id] = parseSection(id);
}

const homeSections = parseHomeSections();

const output = `import type {
  HomeSection,
  JourneyContent,
  JourneyId,
} from './howItWorksTypes';

export const journeyLabels: Record<JourneyId, string> = {
${Object.entries(journeyLabels)
  .map(([k, v]) => `  ${journeyKey(k)}: ${tsString(v)},`)
  .join('\n')}
};

${emitHomeSections(homeSections)}

export const journeyData: Record<Exclude<JourneyId, 'home'>, JourneyContent> = {
${journeyIds.map((id) => emitJourney(id, journeyData[id])).join(',\n')}
};

export function getJourney(id: JourneyId): JourneyContent | null {
  if (id === 'home') return null;
  return journeyData[id] ?? null;
}
`;

fs.writeFileSync(outPath, output, 'utf8');
console.log('Wrote', outPath, '- home cards:', homeSections.reduce((n, s) => n + s.cards.length, 0));
