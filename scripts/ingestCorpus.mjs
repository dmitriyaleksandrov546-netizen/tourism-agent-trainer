import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const corpusRoot = path.resolve(process.env.CORPUS_ROOT || path.join(repoRoot, '..', 'Tourism-Neuroclient-OBS'));
const outputPath = path.join(repoRoot, 'src', 'corpusData.js');

function read(relativePath) {
  return fs.readFileSync(path.join(corpusRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(corpusRoot, relativePath));
}

function countFiles(relativeDir, matcher = () => true) {
  const absoluteDir = path.join(corpusRoot, relativeDir);
  if (!fs.existsSync(absoluteDir)) return 0;
  return fs.readdirSync(absoluteDir).filter((name) => matcher(name)).length;
}

function parseNumber(text, regexp, fallback = 0) {
  const match = text.match(regexp);
  if (!match) return fallback;
  return Number(String(match[1]).replace(',', '.'));
}

function parseArchetypes(report) {
  const rows = [];
  const tableMatch = report.match(/## Client archetypes from calls\n([\s\S]*?)\n## Silence \/ drop triggers/);
  if (!tableMatch) return rows;

  for (const line of tableMatch[1].split('\n')) {
    if (!line.startsWith('| `')) continue;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    rows.push({
      id: cells[0].replaceAll('`', ''),
      label: archetypeLabel(cells[0].replaceAll('`', '')),
      calls: Number(cells[1]),
      share: parseFloat(cells[2]),
      trigger: cells[3],
      bestPushTiming: cells[4]
    });
  }
  return rows;
}

function parseSilenceTriggers(report) {
  const rows = [];
  const tableMatch = report.match(/## Silence \/ drop triggers\n([\s\S]*?)\n## Outcomes/);
  if (!tableMatch) return rows;

  for (const line of tableMatch[1].split('\n')) {
    if (!line.startsWith('| после') && !line.startsWith('| клиент') && !line.startsWith('| неявно')) continue;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    rows.push({ label: cells[0], calls: Number(cells[1]), share: parseFloat(cells[2]) });
  }
  return rows;
}

function parseBehaviorRules(report) {
  const match = report.match(/## Neuroclient behavior rules\n([\s\S]*?)\n## Implementation notes/);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\. \*\*/.test(line))
    .map((line) => line.replace(/^\d+\. \*\*/, '').replace(/\*\*/g, '').trim());
}

function archetypeLabel(id) {
  const labels = {
    price_sensitive: 'Чувствителен к цене',
    thinking_budget_unclear: 'Думает, бюджет неясен',
    silent_busy_unreachable: 'Занят / пропадает',
    family_age_constraints: 'Семья и возрастные ограничения',
    generic_unclear: 'Нечёткий запрос',
    cold_unclear_first_contact: 'Холодный первый контакт',
    documents_blocker: 'Документы / виза',
    booking_payment: 'Бронь / оплата'
  };
  return labels[id] || id;
}

function buildTrainingMaterials() {
  const files = fs.readdirSync(path.join(corpusRoot, 'Training Materials')).filter((name) => name.endsWith('.md'));
  return {
    total: files.length,
    salesScripts: files.filter((name) => name.startsWith('sales_scripts__')).length,
    selectionMethodology: files.filter((name) => name.startsWith('selection_methodology__')).length,
    countryVietnam: files.filter((name) => name.startsWith('country_vietnam__')).length,
    countryThailand: files.filter((name) => name.startsWith('country_thailand__')).length,
    countryUae: files.filter((name) => name.startsWith('country_uae__')).length
  };
}

function buildSourceRefs() {
  const ref = (sourceType, relativePath, confidence) => ({ sourceType, path: `Tourism-Neuroclient-OBS/${relativePath}`, confidence });
  return {
    familyTurkey: [
      ref('report', 'Reports/Neuroclient Brain - Full Report.md', 'high'),
      ref('training_material', 'Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', 'medium'),
      ref('wazzup_dialog', 'Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', 'medium')
    ],
    egyptPrice: [
      ref('report', 'Reports/Neuroclient Brain - Full Report.md', 'high'),
      ref('training_material', 'Training Materials/sales_scripts__script-objections-tel-2024__bc882c39ea6c5cb8.md', 'high'),
      ref('wazzup_dialog', 'Wazzup Dialogs/Analysis/Neuroclient Behavior Model - Wazzup Update.md', 'medium')
    ],
    uaePremium: [
      ref('wazzup_dialog', 'Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', 'high'),
      ref('training_material', 'Training Materials/country_uae__25-UAE-pamytka__970781855f2e9aa7.md', 'medium'),
      ref('training_material', 'Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', 'medium')
    ]
  };
}

const report = read('Reports/Neuroclient Brain - Full Report.md');
const behaviorUpdate = read('Wazzup Dialogs/Analysis/Neuroclient Behavior Model - Wazzup Update.md');
const manifest = exists('export-manifest.json') ? JSON.parse(read('export-manifest.json')) : {};
const archetypes = parseArchetypes(report);
const silenceTriggers = parseSilenceTriggers(report);
const sourceRefs = buildSourceRefs();

const corpusInsights = {
  source: 'Tourism-Neuroclient-OBS',
  generatedAt: manifest.generated_at || new Date().toISOString(),
  totalCalls: parseNumber(report, /Analyzed calls \| (\d+)/, manifest.calls_exported || 0),
  wazzupDialogs: countFiles('Wazzup Dialogs/Deals', (name) => name.endsWith('.md')),
  audioHours: parseNumber(report, /Audio duration \| ([\d.]+) h/),
  averageScore: parseNumber(report, /Average score \| ([\d.]+)/),
  trainingMaterials: buildTrainingMaterials(),
  mainArchetypes: archetypes.slice(0, 4).map(({ id, label, share, trigger }) => ({ id, label, share, trigger })),
  sourceCoverage: {
    calls: countFiles('Calls', (name) => name.endsWith('.md')),
    wazzupDealFiles: countFiles('Wazzup Dialogs/Deals', (name) => name.endsWith('.md')),
    trainingMaterials: countFiles('Training Materials', (name) => name.endsWith('.md')),
    reports: countFiles('Reports', (name) => name.endsWith('.md')),
    wazzupAnalysisReports: countFiles('Wazzup Dialogs/Analysis', (name) => name.endsWith('.md'))
  },
  wazzupSuccessSignals: [
    { id: 'risk_honesty', label: 'Риски проговорены честно', success: 88.1, lost: 41.1 },
    { id: 'payment_booking', label: 'Бронь/оплата объяснены пошагово', success: 82.1, lost: 28.4 },
    { id: 'sets_next_step', label: 'Есть следующий шаг', success: 74.4, lost: 43.5 },
    { id: 'reviews_fear', label: 'Страх отзывов обработан', success: 51.2, lost: 17.5 },
    { id: 'thinking_objection', label: '“Подумаю” не отпущено в пустоту', success: 45.8, lost: 13.8 }
  ],
  silenceTriggers: silenceTriggers.slice(0, 4).map(({ label, share }) => ({ label, share })),
  rulePacks: [
    { id: 'next_step_deadline', source: 'Training Materials/sales_scripts__framework-nextstep__e886c31cd4d5b8ac.md', rule: 'каждая подборка заканчивается действием, временем и каналом' },
    { id: 'price_fork', source: 'Reports/Neuroclient Brain - Full Report.md', rule: 'цена объясняется вилкой, а не одной сухой стоимостью' },
    { id: 'objection_script', source: 'Training Materials/sales_scripts__script-objections-tel-2024__bc882c39ea6c5cb8.md', rule: 'возражение разбирается через сравнение и следующий шаг' },
    { id: 'selection_checklist', source: 'Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', rule: 'подборка должна показывать плюсы, минусы и кому вариант не подходит' },
    { id: 'reviews_fact_signal_conclusion', source: 'Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', rule: 'отзывы раскладываются как факт / отзывный сигнал / вывод' }
  ],
  behaviorRules: parseBehaviorRules(report)
};

const banner = '// Generated by scripts/ingestCorpus.mjs. Do not edit by hand.\n';
const content = `${banner}export const corpusInsights = ${JSON.stringify(corpusInsights, null, 2)};\n\nexport const sourceRefs = ${JSON.stringify(sourceRefs, null, 2)};\n`;

fs.writeFileSync(outputPath, content);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(JSON.stringify(corpusInsights.sourceCoverage, null, 2));
