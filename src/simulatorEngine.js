export const corpusInsights = {
  source: 'Tourism-Neuroclient-OBS',
  totalCalls: 2359,
  wazzupDialogs: 2356,
  audioHours: 150.2,
  averageScore: 36.7,
  trainingMaterials: {
    total: 28,
    salesScripts: 14,
    selectionMethodology: 3,
    countryVietnam: 3,
    countryThailand: 2,
    countryUae: 1
  },
  mainArchetypes: [
    { id: 'price_sensitive', label: 'Чувствителен к цене', share: 62.2, trigger: 'сухая цена без вилки и альтернатив' },
    { id: 'thinking_budget_unclear', label: 'Думает, бюджет неясен', share: 20.7, trigger: 'агент отпускает “подумаю” без следующего шага' },
    { id: 'silent_busy_unreachable', label: 'Занят / пропадает', share: 10.9, trigger: 'не зафиксировано точное время перезвона' },
    { id: 'family_age_constraints', label: 'Семья и возрастные ограничения', share: 1.9, trigger: 'отель предложен без учёта возраста детей' }
  ],
  wazzupSuccessSignals: [
    { id: 'risk_honesty', label: 'Риски проговорены честно', success: 88.1, lost: 41.1 },
    { id: 'payment_booking', label: 'Бронь/оплата объяснены пошагово', success: 82.1, lost: 28.4 },
    { id: 'sets_next_step', label: 'Есть следующий шаг', success: 74.4, lost: 43.5 },
    { id: 'reviews_fear', label: 'Страх отзывов обработан', success: 51.2, lost: 17.5 },
    { id: 'thinking_objection', label: '“Подумаю” не отпущено в пустоту', success: 45.8, lost: 13.8 }
  ],
  silenceTriggers: [
    { label: 'после поверхностного разговора без вводных', share: 97.5 },
    { label: 'после цены или несовпадения бюджета с реальностью', share: 90.5 },
    { label: 'после отсутствия 2–3 альтернатив', share: 52.9 },
    { label: 'после разговора без конкретного следующего шага', share: 20.0 }
  ],
  rulePacks: [
    { id: 'next_step_deadline', source: 'Training Materials/sales_scripts__framework-nextstep__e886c31cd4d5b8ac.md', rule: 'каждая подборка заканчивается действием, временем и каналом' },
    { id: 'price_fork', source: 'Reports/Neuroclient Brain - Full Report.md', rule: 'цена объясняется вилкой, а не одной сухой стоимостью' },
    { id: 'objection_script', source: 'Training Materials/sales_scripts__script-objections-tel-2024__bc882c39ea6c5cb8.md', rule: 'возражение разбирается через сравнение и следующий шаг' },
    { id: 'selection_checklist', source: 'Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', rule: 'подборка должна показывать плюсы, минусы и кому вариант не подходит' },
    { id: 'reviews_fact_signal_conclusion', source: 'Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', rule: 'отзывы раскладываются как факт / отзывный сигнал / вывод' }
  ],
  behaviorRules: [
    'Do not start with a perfect brief',
    'Reveal progressively',
    'Accept a polite process promise once, then demand a concrete next step',
    'Go silent after vague endings',
    'Treat price as a fork, not a wall',
    'Family/age clients buy safety, not discount'
  ]
};

const sourceRefs = {
  familyTurkey: [
    { sourceType: 'report', path: 'Tourism-Neuroclient-OBS/Reports/Neuroclient Brain - Full Report.md', confidence: 'high' },
    { sourceType: 'training_material', path: 'Tourism-Neuroclient-OBS/Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', confidence: 'medium' },
    { sourceType: 'wazzup_dialog', path: 'Tourism-Neuroclient-OBS/Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', confidence: 'medium' }
  ],
  egyptPrice: [
    { sourceType: 'report', path: 'Tourism-Neuroclient-OBS/Reports/Neuroclient Brain - Full Report.md', confidence: 'high' },
    { sourceType: 'training_material', path: 'Tourism-Neuroclient-OBS/Training Materials/sales_scripts__script-objections-tel-2024__bc882c39ea6c5cb8.md', confidence: 'high' },
    { sourceType: 'wazzup_dialog', path: 'Tourism-Neuroclient-OBS/Wazzup Dialogs/Analysis/Neuroclient Behavior Model - Wazzup Update.md', confidence: 'medium' }
  ],
  uaePremium: [
    { sourceType: 'report', path: 'Tourism-Neuroclient-OBS/Wazzup Dialogs/Русские отчёты/Русский отчёт по 2356 Wazzup amoCRM диалогам.txt', confidence: 'high' },
    { sourceType: 'training_material', path: 'Tourism-Neuroclient-OBS/Training Materials/country_uae__25-UAE-pamytka__970781855f2e9aa7.md', confidence: 'medium' },
    { sourceType: 'training_material', path: 'Tourism-Neuroclient-OBS/Training Materials/selection_methodology__Чек-лист-идеальная-подборка__8d233c5504905b21.md', confidence: 'medium' }
  ]
};

export const scenarios = [
  {
    id: 'turkey-family-hard',
    shortTitle: 'Семья в Турцию',
    shortSubtitle: 'Бюджет ограничен, требования высокие',
    archetype: 'family_age_constraints',
    title: 'Семья 2+2: Турция, бюджет жмёт',
    level: 'Жёсткий клиент',
    direction: 'Турция / семейный отдых',
    clientProfile: {
      name: 'Анна', family: '2 взрослых + 2 ребёнка', children: ['2 года', '11 лет'], budget: 'до 180 000 ₽',
      hiddenNeed: 'безопасный заход в море для младшего и активности для старшего', trigger: 'боится плохих отзывов и переплат'
    },
    startMessage: 'Здравствуйте. Нас четверо: двое взрослых, детям 2 года и 11 лет. Хотим Турцию, 5*, первая линия, песок, аквапарк, хорошее питание и чтобы не было толпы. Бюджет до 180 тысяч. Такое реально?',
    requiredConcepts: ['kidsAges', 'budgetFork', 'riskHonesty', 'alternatives', 'nextStep'],
    hiddenPainConcepts: ['kidsAges', 'safetyForKids', 'reviewsFear'],
    sourceRefs: sourceRefs.familyTurkey
  },
  {
    id: 'egypt-budget-objections',
    shortTitle: 'Египет дешевле у конкурента',
    shortSubtitle: 'Клиент сравнивает цену',
    archetype: 'price_sensitive',
    title: 'Египет: “дёшево, но как премиум”',
    level: 'Возражения по цене',
    direction: 'Египет / бюджет',
    clientProfile: {
      name: 'Игорь', family: 'пара', children: [], budget: 'до 120 000 ₽',
      hiddenNeed: 'хочет тёплое море и нормальный риф, но не понимает компромиссы', trigger: 'нашёл дешевле у конкурента'
    },
    startMessage: 'Мне у другого агента дали Египет дешевле на 15 тысяч. Почему у вас дороже? Там тоже 5 звёзд и всё включено.',
    requiredConcepts: ['compareOffer', 'budgetFork', 'riskHonesty', 'agentValue', 'nextStep'],
    hiddenPainConcepts: ['reefBeach', 'competitorPrice', 'reviewsFear'],
    sourceRefs: sourceRefs.egyptPrice
  },
  {
    id: 'uae-premium-anxious',
    shortTitle: 'ОАЭ без сюрпризов',
    shortSubtitle: 'Клиент боится ошибок',
    archetype: 'thinking_budget_unclear',
    title: 'ОАЭ: премиум-клиент без права на ошибку',
    level: 'Премиум',
    direction: 'ОАЭ / высокий чек',
    clientProfile: {
      name: 'Марина', family: '2 взрослых', children: [], budget: 'до 650 000 ₽',
      hiddenNeed: 'хочет уверенность, быстрые ответы и отсутствие сюрпризов', trigger: 'не терпит общих фраз'
    },
    startMessage: 'Мне нужен отель в Дубае, чтобы без сюрпризов. Я не хочу потом выяснять, что стройка рядом, пляж через дорогу или депозит огромный. Что вы можете гарантировать?',
    requiredConcepts: ['riskHonesty', 'sourceCheck', 'factSignalConclusion', 'nextStep'],
    hiddenPainConcepts: ['surpriseControl', 'depositConstruction', 'noFalseGuarantee'],
    sourceRefs: sourceRefs.uaePremium
  }
];

const conceptMap = {
  kidsAges: { label: 'возраст детей и разные потребности', words: ['2 года', '11 лет', 'младш', 'старш', 'возраст детей', 'детям'] },
  safetyForKids: { label: 'безопасность детей', words: ['безопасн', 'вход в море', 'заход в море', 'пляж', 'аквапарк', 'активност'] },
  budgetFork: { label: 'цена через вилку', words: ['вилка', '2 варианта', '3 варианта', 'дешевле', 'дороже', 'компромисс', 'в бюджет', 'комфортнее', 'безопаснее', 'ловим даты', 'либо'] },
  riskHonesty: { label: 'честные риски и минусы', words: ['риск', 'минус', 'чест', 'предупреж', 'компромисс', 'не обещ', 'отзывы', 'провер'] },
  alternatives: { label: '2–3 альтернативы', words: ['2 варианта', '3 варианта', '2–3', 'два вариант', 'три вариант', 'альтернатив', 'вилка'] },
  nextStep: { label: 'следующий шаг со сроком', words: ['сегодня', 'до 17', 'до 18', 'вечером', 'завтра', 'созвон', 'whatsapp', 'вотсап', 'отправлю', 'пришлю', 'зафикс'] },
  compareOffer: { label: 'сравнение предложения конкурента', words: ['сравним', 'разница', 'конкурент', 'дешевле', 'что входит', 'рейс', 'номер'] },
  agentValue: { label: 'ценность агента', words: ['проверю', 'сверю', 'источник', 'актуальн', 'отзывы', 'сопровожд', 'фиксир'] },
  reefBeach: { label: 'риф/пляж/море', words: ['риф', 'пляж', 'понтон', 'ветер', 'море', 'заход'] },
  competitorPrice: { label: 'страх переплаты', words: ['дешевле', 'переплат', 'цена', 'разница', 'конкурент'] },
  reviewsFear: { label: 'страх плохих отзывов', words: ['отзыв', 'плох', 'страх', 'провер', 'минус'] },
  sourceCheck: { label: 'проверка источников', words: ['источник', 'сайт отеля', 'оператор', 'проверю', 'дата', 'актуальн'] },
  factSignalConclusion: { label: 'факт / отзыв / вывод', words: ['факт', 'отзывный сигнал', 'вывод', 'по отзывам', 'для вас значит'] },
  surpriseControl: { label: 'управление сюрпризами', words: ['сюрприз', 'стройк', 'депозит', 'гарантировать не буду', 'проверю', 'риски'] },
  depositConstruction: { label: 'депозит/стройка/пляж', words: ['депозит', 'стройк', 'пляж', 'дорогу', 'рядом'] },
  noFalseGuarantee: { label: 'без ложных гарантий', words: ['не гарантир', 'гарантировать не буду', 'проверю', 'предупрежу'] }
};

const dangerousPromisePhrases = ['гарантирую', 'точно понравится', 'без проблем', 'идеально', '100%', 'лучший отель'];
const vaguePhrases = ['хороший отель', 'вам понравится', 'посмотрим', 'подберем', 'подберём', 'всё будет', 'нормальный вариант'];
const stuffingWords = ['бюджет', 'риск', 'варианты', 'созвон', 'дети', 'честно', 'проверю', 'отзывы', 'цена', 'бронь'];
const logicLinks = ['потому', 'поэтому', 'если', 'либо', 'значит', 'в вашем случае', 'для вас', 'чтобы', 'так как'];

function normalize(text) { return text.toLowerCase().trim(); }
function hasAny(text, words) { return words.some((word) => text.includes(word)); }
function hasLogic(text) { return hasAny(text, logicLinks); }
function evidenceFor(text, words) { return words.filter((word) => text.includes(word)).slice(0, 3); }
function sentenceCount(text) { return text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean).length; }
function hasConcreteNextStep(text) { return hasAny(text, conceptMap.nextStep.words) && (/\d/.test(text) || hasAny(text, ['сегодня', 'вечером', 'завтра', 'whatsapp', 'вотсап'])); }
function isKeywordStuffing(text) {
  const words = text.replace(/[.,!?;:()«»“”]/g, ' ').split(/\s+/).filter(Boolean);
  const hits = stuffingWords.filter((word) => text.includes(word)).length;
  return hits >= 6 && !hasLogic(text) && words.length <= 22;
}

export function getScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

function scoreConcept(text, conceptKey, scenario) {
  const concept = conceptMap[conceptKey];
  if (!concept) return { conceptKey, label: conceptKey, earned: 0, evidence: [], missing: [conceptKey] };
  const hits = evidenceFor(text, concept.words);
  if (!hits.length) return { conceptKey, label: concept.label, earned: 0, evidence: [], missing: [concept.label] };
  const scenarioRequired = scenario?.requiredConcepts?.includes(conceptKey) || scenario?.hiddenPainConcepts?.includes(conceptKey);
  const logicMultiplier = hasLogic(text) || conceptKey === 'nextStep' ? 1 : 0.55;
  const scenarioMultiplier = scenarioRequired ? 1 : 0.75;
  return { conceptKey, label: concept.label, earned: Math.round(100 * logicMultiplier * scenarioMultiplier), evidence: hits, missing: [] };
}

const dimensionsConfig = [
  { key: 'diagnosis', label: 'Диагностика ситуации', max: 16, concepts: ['kidsAges', 'compareOffer', 'depositConstruction'] },
  { key: 'hiddenPain', label: 'Понимание скрытой боли', max: 16, concepts: ['safetyForKids', 'reviewsFear', 'reefBeach', 'surpriseControl', 'competitorPrice'] },
  { key: 'budgetFork', label: 'Цена через вилку', max: 14, concepts: ['budgetFork', 'alternatives'] },
  { key: 'riskHonesty', label: 'Риски и источники', max: 14, concepts: ['riskHonesty', 'sourceCheck', 'factSignalConclusion'] },
  { key: 'agentValue', label: 'Ценность агента', max: 12, concepts: ['agentValue'] },
  { key: 'nextStep', label: 'Следующий шаг', max: 14, concepts: ['nextStep'] },
  { key: 'humanTone', label: 'Человеческий тон', max: 8, concepts: [] },
  { key: 'structure', label: 'Структура ответа', max: 6, concepts: [] }
];

function buildDimension(text, config, scenario) {
  if (config.key === 'humanTone') {
    const ok = hasAny(text, ['понимаю', 'понял', 'давайте', 'по-честному', 'спокойно', 'коротко']);
    return { ...config, earned: ok ? config.max : 0, status: ok ? 'good' : 'missed', evidence: ok ? ['человеческий тон'] : [], missing: ok ? [] : ['ответ звучит сухо или рекламно'], methodicRule: 'human_tone' };
  }
  if (config.key === 'structure') {
    const ok = sentenceCount(text) >= 2 && hasLogic(text);
    return { ...config, earned: ok ? config.max : 0, status: ok ? 'good' : 'missed', evidence: ok ? ['есть логика ответа'] : [], missing: ok ? [] : ['нет структуры: что понял → риски → варианты → следующий шаг'], methodicRule: 'answer_structure' };
  }
  const scored = config.concepts.map((key) => scoreConcept(text, key, scenario));
  const best = scored.reduce((a, b) => (b.earned > a.earned ? b : a), scored[0]);
  const earned = Math.round((best.earned / 100) * config.max);
  return {
    ...config,
    earned,
    status: earned >= config.max * 0.75 ? 'good' : earned > 0 ? 'partial' : 'missed',
    evidence: best.evidence,
    missing: scored.filter((item) => item.earned === 0).map((item) => item.label).slice(0, 2),
    methodicRule: config.key
  };
}

function buildPenalties(text, scenario) {
  const penalties = [];
  if (isKeywordStuffing(text)) penalties.push({ key: 'keywordStuffing', points: 45, reason: 'слова есть, мышления нет', evidence: stuffingWords.filter((w) => text.includes(w)).slice(0, 6) });
  const dangerous = dangerousPromisePhrases.filter((phrase) => text.includes(phrase));
  if (dangerous.length) penalties.push({ key: 'dangerousPromise', points: scenario?.id === 'uae-premium-anxious' ? 22 : 16, reason: 'опасные обещания без проверки', evidence: dangerous });
  const vague = vaguePhrases.filter((phrase) => text.includes(phrase));
  if (vague.length && !hasLogic(text)) penalties.push({ key: 'emptyAdvertising', points: 16, reason: 'пустая реклама без фактов и рисков', evidence: vague });
  if (scenario?.requiredConcepts?.includes('nextStep') && !hasConcreteNextStep(text)) penalties.push({ key: 'noNextStep', points: 14, reason: 'нет действия + срока/канала', evidence: [] });
  if (!hasLogic(text) && sentenceCount(text) < 2) penalties.push({ key: 'noLogic', points: 10, reason: 'ответ не объясняет причинно-следственную логику', evidence: [] });
  return penalties;
}

function buildCorpusSignals(dimensions, penalties) {
  const signals = [];
  if (dimensions.find((d) => d.key === 'nextStep')?.status !== 'good') signals.push({ ruleId: 'next_step_deadline', label: 'Без точного следующего шага клиент часто уходит в “подумаю”.', source: 'Wazzup + framework-nextstep', severity: 'high' });
  if (dimensions.find((d) => d.key === 'budgetFork')?.status !== 'good') signals.push({ ruleId: 'price_fork', label: 'Корпус показывает: сухая цена без вилки резко повышает риск потери.', source: 'Mango calls + Wazzup report', severity: 'high' });
  if (dimensions.find((d) => d.key === 'riskHonesty')?.status !== 'good') signals.push({ ruleId: 'risk_honesty', label: 'В успешных диалогах риски проговариваются почти вдвое чаще.', source: 'Wazzup success/lost comparison', severity: 'medium' });
  if (penalties.some((p) => p.key === 'dangerousPromise')) signals.push({ ruleId: 'no_false_guarantee', label: 'Методика запрещает обещать то, что агент не проверил источниками.', source: 'selection checklist', severity: 'high' });
  return signals;
}

function buildTopFixes(dimensions, penalties) {
  if (penalties.some((p) => p.key === 'keywordStuffing')) return ['Не набивай ответ словами. Напиши связку: что понял → где компромисс → что проверишь → когда вернёшься.'];
  const fixes = [];
  for (const d of dimensions) {
    if (d.status === 'good') continue;
    if (d.key === 'diagnosis') fixes.push('Добавь 1–2 вопроса по конкретной ситуации клиента.');
    if (d.key === 'hiddenPain') fixes.push('Назови скрытый страх клиента простыми словами.');
    if (d.key === 'budgetFork') fixes.push('Дай вилку: в бюджет с компромиссом / комфортнее дороже / альтернативная дата или отель.');
    if (d.key === 'riskHonesty') fixes.push('Проговори минусы и что именно проверишь по источникам/отзывам.');
    if (d.key === 'nextStep') fixes.push('Зафиксируй действие, срок и канал: например, “сегодня до 18:00 пришлю 3 варианта в WhatsApp”.');
  }
  return fixes.slice(0, 3);
}

export function evaluateAgentReply(text = '', scenarioArg = scenarios[0]) {
  const scenario = typeof scenarioArg === 'string' ? getScenarioById(scenarioArg) : scenarioArg || scenarios[0];
  const normalized = normalize(text);
  const dimensions = dimensionsConfig.map((config) => buildDimension(normalized, config, scenario));
  const penalties = buildPenalties(normalized, scenario);
  const penaltyPoints = penalties.reduce((sum, p) => sum + p.points, 0);
  const baseScore = dimensions.reduce((sum, d) => sum + d.earned, 0);
  const score = Math.max(0, Math.min(100, baseScore - penaltyPoints));
  const missing = [...new Set(dimensions.flatMap((d) => d.missing))].filter(Boolean);
  const corpusSignals = buildCorpusSignals(dimensions, penalties);
  const topFixes = buildTopFixes(dimensions, penalties);
  const verdict = score >= 80 ? 'Хорошо' : score >= 55 ? 'Нужно доработать' : penalties.some((p) => p.key === 'keywordStuffing') ? 'Клиент может пропасть: слова есть, мышления нет' : 'Клиент может пропасть';

  return {
    score,
    verdict,
    dimensions,
    details: dimensions,
    penalties,
    corpusSignals,
    topFixes,
    missing,
    detected: dimensions.filter((d) => d.status === 'good').map((d) => d.key),
    advice: topFixes,
    nextClientMode: score >= 80 ? 'engaged' : score >= 55 ? 'pushback' : 'silence-risk'
  };
}

export function getNextClientReply(scenarioId, agentText = '', turn = 1) {
  const scenario = getScenarioById(scenarioId);
  const result = evaluateAgentReply(agentText, scenario);
  const missedKeys = result.dimensions.filter((d) => d.status !== 'good').map((d) => d.key);

  if (result.score < 40 || result.penalties.some((p) => ['keywordStuffing', 'emptyAdvertising'].includes(p.key))) {
    return 'Вы сейчас общими словами отвечаете. А мне важно понять: в наш бюджет это реально или нет? И плохие отзывы вы проверяли?';
  }
  if (missedKeys.includes('budgetFork')) return 'Хорошо, но вы не сказали по бюджету. Я не хочу потом получить вариант сильно дороже.';
  if (missedKeys.includes('hiddenPain') && scenario.clientProfile.children.length) return 'А детям там точно будет нормально? Младшему 2 года, старшему 11 — это вообще разные потребности.';
  if (missedKeys.includes('riskHonesty')) return 'А какие минусы у этих вариантов? Мне не нужен рекламный текст, я хочу знать, где может быть подвох.';
  if (missedKeys.includes('nextStep')) return 'Допустим. А что дальше конкретно — когда вы пришлёте варианты и как мы не потеряем цену?';
  if (turn >= 3 || result.score >= 80) return 'Ок, звучит уверенно. Пришлите 2–3 варианта с плюсами, минусами и что лучше именно для нас.';
  return 'Допустим. А почему мне бронировать через вас, если я могу сам посмотреть на агрегаторе?';
}

export function createInitialMessages(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  return [{ id: 'client-start', role: 'client', text: scenario.startMessage, time: 'сейчас' }];
}
