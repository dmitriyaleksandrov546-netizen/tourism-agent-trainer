import { corpusInsights, sourceRefs } from './corpusData.js';

export { corpusInsights };

export const scenarios = [
  {
    id: 'turkey-family-warmup',
    shortTitle: 'Турция: входящий лид',
    shortSubtitle: 'Клиент начинает издалека и пока не дал вводные',
    archetype: 'family_age_constraints',
    title: 'Турция: клиент только начинает разговор',
    level: 'Лёгкий старт',
    direction: 'Турция / первичный контакт',
    simulatedToday: {
      iso: '2026-09-20',
      label: '20 сентября 2026',
      marketContext: 'осенний спрос: цены уже отличаются от лета, менеджер должен учитывать сезон и не подбирать как на пик июля',
      selectionTrainingFocus: 'делать подборку с учётом текущей даты диалога, сезонной цены и доступности отелей'
    },
    clientProfile: {
      name: 'Анна', family: 'семья с детьми', children: ['2 года', '11 лет'], budget: 'до 180 000 ₽',
      hiddenNeed: 'понять, можно ли вообще уложиться без плохого пляжа и скуки для старшего', trigger: 'боится, что агент сразу начнёт продавать без вопросов'
    },
    startMessages: [
      'Здравствуйте. Вы туры подбираете?',
      'Добрый день. Можно у вас по Турции спросить?',
      'Здравствуйте, хотим летом отдохнуть семьёй, но пока не понимаю, с чего начать.'
    ],
    startMessage: 'Здравствуйте. Вы туры подбираете?',
    requiredConcepts: ['kidsAges', 'budgetFork', 'riskHonesty', 'nextStep'],
    hiddenPainConcepts: ['kidsAges', 'safetyForKids', 'reviewsFear'],
    sourceRefs: sourceRefs.familyTurkey
  },
  {
    id: 'turkey-family-hard',
    shortTitle: 'Семья в Турцию',
    shortSubtitle: 'Бюджет ограничен, требования высокие',
    archetype: 'family_age_constraints',
    title: 'Семья 2+2: Турция, бюджет жмёт',
    level: 'Базовый',
    direction: 'Турция / семейный отдых',
    simulatedToday: {
      iso: '2027-05-15',
      label: '15 мая 2027',
      marketContext: 'перед летним сезоном: цены на семейную Турцию растут, бюджет 180 000 ₽ нужно проверять по реальной доступности',
      selectionTrainingFocus: 'делать подборку с учётом текущей даты диалога: до летнего пика осталось мало времени, хорошие семейные отели дорожают'
    },
    clientProfile: {
      name: 'Анна', family: '2 взрослых + 2 ребёнка', children: ['2 года', '11 лет'], budget: 'до 180 000 ₽',
      hiddenNeed: 'безопасный заход в море для младшего и активности для старшего', trigger: 'боится плохих отзывов и переплат'
    },
    startMessages: [
      'Нас четверо, хотим Турцию летом. Реально подобрать что-то нормальное, не за космос?',
      'Смотрим Турцию с детьми, но я уже запуталась в отелях и отзывах.',
      'Хотим семейный отдых в Турции. Боюсь ошибиться с пляжем и питанием.'
    ],
    startMessage: 'Нас четверо, хотим Турцию летом. Реально подобрать что-то нормальное, не за космос?',
    requiredConcepts: ['kidsAges', 'budgetFork', 'riskHonesty', 'alternatives', 'nextStep'],
    hiddenPainConcepts: ['kidsAges', 'safetyForKids', 'reviewsFear'],
    sourceRefs: sourceRefs.familyTurkey
  },
  {
    id: 'egypt-budget-objections',
    shortTitle: 'Египет дешевле у конкурента',
    shortSubtitle: 'Клиент сравнивает цену и не верит агенту',
    archetype: 'price_sensitive',
    title: 'Египет: “дёшево, но как премиум”',
    level: 'Средний',
    direction: 'Египет / цена и ценность агента',
    simulatedToday: {
      iso: '2026-12-03',
      label: '3 декабря 2026',
      marketContext: 'зимний спрос на Египет: цена зависит от рейса, рифа, ветра, уровня отеля и близости праздников',
      selectionTrainingFocus: 'сравнивать предложение конкурента с учётом текущего зимнего спроса, а не только по голой цене'
    },
    clientProfile: {
      name: 'Игорь', family: 'пара', children: [], budget: 'до 120 000 ₽',
      hiddenNeed: 'хочет тёплое море и нормальный риф, но не понимает компромиссы', trigger: 'нашёл дешевле у конкурента'
    },
    startMessages: [
      'Мне уже дали Египет дешевле. Почему у вас может быть дороже?',
      'Хочу Египет, но не понимаю, почему цены так отличаются у разных агентств.',
      'Можно Египет недорого, но чтобы без подвохов? У конкурента цена ниже.'
    ],
    startMessage: 'Мне уже дали Египет дешевле. Почему у вас может быть дороже?',
    requiredConcepts: ['compareOffer', 'budgetFork', 'riskHonesty', 'agentValue', 'nextStep'],
    hiddenPainConcepts: ['reefBeach', 'competitorPrice', 'reviewsFear'],
    sourceRefs: sourceRefs.egyptPrice
  },
  {
    id: 'thailand-thinking-silence',
    shortTitle: 'Таиланд: “я подумаю”',
    shortSubtitle: 'Клиент тянет решение и может пропасть',
    archetype: 'thinking_budget_unclear',
    title: 'Таиланд: клиент уходит в “подумаю”',
    level: 'Средний+',
    direction: 'Таиланд / удержание лида',
    simulatedToday: {
      iso: '2027-02-12',
      label: '12 февраля 2027',
      marketContext: 'период планирования весеннего Таиланда: цены и рейсы меняются, ожидание может как помочь, так и ухудшить выбор',
      selectionTrainingFocus: 'объяснять клиенту, почему решение по подборке зависит от текущей даты, динамики перелётов и сезона'
    },
    clientProfile: {
      name: 'Ольга', family: 'пара', children: [], budget: 'до 230 000 ₽',
      hiddenNeed: 'боится переплатить и хочет время сравнить самой', trigger: 'не любит давление и уходит, если нет понятного следующего шага'
    },
    startMessages: [
      'Здравствуйте. Мы думаем про Таиланд, но пока просто смотрим варианты.',
      'Можно узнать по Таиланду? Мы пока не уверены, хотим ли бронировать.',
      'Смотрю Пхукет, но боюсь, что сейчас всё дорого и лучше подождать.'
    ],
    startMessage: 'Здравствуйте. Мы думаем про Таиланд, но пока просто смотрим варианты.',
    requiredConcepts: ['budgetFork', 'riskHonesty', 'agentValue', 'nextStep'],
    hiddenPainConcepts: ['competitorPrice', 'reviewsFear'],
    sourceRefs: sourceRefs.egyptPrice
  },
  {
    id: 'uae-premium-anxious',
    shortTitle: 'ОАЭ без сюрпризов',
    shortSubtitle: 'Премиум-клиент боится ошибок',
    archetype: 'thinking_budget_unclear',
    title: 'ОАЭ: премиум-клиент без права на ошибку',
    level: 'Сложный',
    direction: 'ОАЭ / высокий чек',
    simulatedToday: {
      iso: '2026-04-22',
      label: '22 апреля 2026',
      marketContext: 'раннее планирование премиум-ОАЭ: наличие хороших номеров выше, но всё равно нужны проверки депозитов, стройки и условий отмены',
      selectionTrainingFocus: 'использовать текущую дату как аргумент для раннего бронирования и проверки рисков премиум-отеля'
    },
    clientProfile: {
      name: 'Марина', family: '2 взрослых', children: [], budget: 'до 650 000 ₽',
      hiddenNeed: 'хочет уверенность, быстрые ответы и отсутствие сюрпризов', trigger: 'не терпит общих фраз'
    },
    startMessages: [
      'Добрый день. Нужен хороший отель в Дубае, но я очень не хочу неприятных сюрпризов.',
      'Здравствуйте. Сможете подобрать ОАЭ так, чтобы всё было проверено до оплаты?',
      'Мне нужен Дубай без стройки рядом, скрытых депозитов и пляжа “через дорогу”. Вы такое проверяете?'
    ],
    startMessage: 'Добрый день. Нужен хороший отель в Дубае, но я очень не хочу неприятных сюрпризов.',
    requiredConcepts: ['riskHonesty', 'sourceCheck', 'factSignalConclusion', 'nextStep'],
    hiddenPainConcepts: ['surpriseControl', 'depositConstruction', 'noFalseGuarantee'],
    sourceRefs: sourceRefs.uaePremium
  },
  {
    id: 'last-minute-angry',
    shortTitle: 'Срочный тур и раздражение',
    shortSubtitle: 'Клиент торопится, нервничает и легко срывается',
    archetype: 'silent_busy_unreachable',
    title: 'Срочный вылет: клиент на нервах',
    level: 'Экзамен',
    direction: 'Горящий запрос / кризисная коммуникация',
    simulatedToday: {
      iso: '2027-01-08',
      label: '8 января 2027',
      marketContext: 'послепраздничный высокий спрос: наличие и цены меняются быстро, времени на подбор почти нет',
      selectionTrainingFocus: 'делать срочную подборку отелей по текущей дате: быстро, но без потери проверки отзывов и рисков'
    },
    clientProfile: {
      name: 'Дмитрий', family: '2 взрослых', children: [], budget: 'до 200 000 ₽',
      hiddenNeed: 'хочет быстрое решение, но боится купить плохой отель из-за спешки', trigger: 'раздражается от медленных и общих ответов'
    },
    startMessages: [
      'Нужен тур с вылетом на этой неделе. Только без долгих вопросов, можете быстро?',
      'Здравствуйте. Срочно нужен нормальный вариант, у меня уже нет времени разбираться.',
      'Мне надо улететь в ближайшие дни. Если можете помочь быстро — пишите.'
    ],
    startMessage: 'Нужен тур с вылетом на этой неделе. Только без долгих вопросов, можете быстро?',
    requiredConcepts: ['budgetFork', 'riskHonesty', 'alternatives', 'nextStep'],
    hiddenPainConcepts: ['reviewsFear', 'competitorPrice'],
    sourceRefs: sourceRefs.familyTurkey
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
  noFalseGuarantee: { label: 'без ложных гарантий', words: ['не гарантир', 'гарантировать не буду', 'проверю', 'предупрежу'] },
  selectionQuality: { label: 'качество подборки', words: ['подборк', 'отель', 'звезд', 'звёзд', 'страна', 'критери', 'удобств', 'пляж', 'питани', 'аквапарк', 'трансфер'] },
  reviewSources: { label: 'отзывы и источники', words: ['яндекс', 'tripadvisor', 'трипадвайзер', 'отзыв', 'пишут', 'хвалят', 'ругают', 'источник'] },
  compromiseExplanation: { label: 'объяснение компромисса', words: ['компромисс', 'зато', 'но', 'уступ', 'дешевле', 'дороже', 'важнее', 'замен'] },
  managerDecision: { label: 'решение менеджера после реакции клиента', words: ['заменю', 'корректир', 'уточню', 'оставляем', 'меняем', 'добавлю', 'покажу разницу', 'следующий шаг'] }
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
function questionCount(text = '') { return (text.match(/\?/g) || []).length; }
function clientMessages(history = []) { return history.filter((message) => message.role === 'client'); }
function lastClientText(history = []) { return clientMessages(history).at(-1)?.text || ''; }
function hasClientAlreadyPushed(history = []) {
  return clientMessages(history).some((message) => {
    const text = normalize(message.text || '');
    return questionCount(text) > 0 || hasAny(text, ['общими словами', 'плохие отзывы', 'подвох', 'бюджет', 'когда вы пришлёте', 'почему мне бронировать']);
  });
}
function isShortLowInfoAgentReply(text = '') {
  const normalized = normalize(text);
  return normalized.length <= 120 && hasAny(normalized, ['здравствуйте', 'добрый', 'доброго', 'скоро', 'сейчас', 'пришлю', 'подберу', 'подберём', 'постараюсь', 'посмотрю', 'помогу', 'вернусь', '?']);
}

const qualifyingQuestionMatchers = {
  name: ['как вас', 'как зовут', 'зовут'],
  dates: ['когда', 'дат', 'вылет', 'отдохнуть', 'месяц', 'период'],
  preferences: ['предпочитаете', 'пожелан', 'что важно', 'требован', 'какой отель', 'пляж', 'питание'],
  budget: ['бюджет', 'сумма', 'сколько', 'потратить', 'руб', 'тысяч'],
  kids: ['дет', 'возраст', 'сколько лет']
};

const clientAnswerMatchers = {
  name: ['анна', 'игорь', 'ольга', 'марина', 'дмитрий', 'зовут'],
  dates: ['июн', 'июл', 'август', 'сент', 'октябр', 'ноябр', 'декабр', 'январ', 'феврал', 'март', 'апрел', 'май', 'летом', 'осень', 'зимой', 'весной', 'каникул', 'недел'],
  preferences: ['пляж', 'питани', 'аквапарк', 'анимац', 'первая линия', 'риф', 'море', 'трансфер'],
  budget: ['бюджет', 'тысяч', '000', '₽', 'руб', '180', '120', '230', '650'],
  kids: ['младш', 'старш', 'ребён', 'ребен', 'дет', 'года', 'лет']
};

function askedQualifyingSlots(text = '') {
  const normalized = normalize(text);
  return Object.entries(qualifyingQuestionMatchers)
    .filter(([, words]) => hasAny(normalized, words))
    .map(([slot]) => slot);
}

function answeredQualifyingSlots(history = []) {
  const clientText = normalize(clientMessages(history).map((message) => message.text || '').join(' '));
  return new Set(Object.entries(clientAnswerMatchers)
    .filter(([, words]) => hasAny(clientText, words))
    .map(([slot]) => slot));
}

function pendingAskedQualifyingSlots(history = [], agentText = '') {
  const asked = [...history.filter((message) => message.role === 'agent').map((message) => message.text || ''), agentText]
    .flatMap(askedQualifyingSlots);
  const answered = answeredQualifyingSlots(history);
  return [...new Set(asked.filter((slot) => !answered.has(slot)))];
}

function answerForQualifyingSlot(slot, scenario) {
  const name = scenario.clientProfile.name || 'Анна';
  const children = scenario.clientProfile.children?.length ? scenario.clientProfile.children.join(' и ') : 'детей нет';
  const answers = {
    name: `${name}.`,
    dates: scenario.id.includes('turkey')
      ? 'По датам лучше июль или начало августа, на 7–10 ночей.'
      : 'По датам пока смотрим ближайший удобный период, на 7–10 ночей.',
    preferences: scenario.clientProfile.children?.length
      ? `По отелю важно: нормальный пляж для младшего, питание и чтобы старшему было не скучно.`
      : 'По отелю важно: нормальный пляж, питание и без плохих отзывов.',
    budget: `По бюджету максимум ${scenario.clientProfile.budget}, сильно выше не хочется.`,
    kids: scenario.clientProfile.children?.length ? `Детям ${children}.` : 'Едем без детей.'
  };
  return answers[slot] || '';
}

function buildPendingDetailsReply(history = [], agentText = '', scenario) {
  const pending = pendingAskedQualifyingSlots(history, agentText).filter((slot) => slot !== 'name').slice(0, 2);
  if (!pending.length) return '';
  return pending.map((slot) => answerForQualifyingSlot(slot, scenario)).filter(Boolean).join(' ');
}
function hasConcreteNextStep(text) { return hasAny(text, conceptMap.nextStep.words) && (/\d/.test(text) || hasAny(text, ['сегодня', 'вечером', 'завтра', 'whatsapp', 'вотсап'])); }
function hasPromisedSelection(text) {
  return hasAny(text, ['пришлю', 'отправлю', 'скину', 'подготовлю', 'сравню', 'подберу', 'вариант', 'подборк'])
    && hasAny(text, ['сегодня', 'завтра', 'до ', 'вечером', 'утром', 'через час', 'в течение'])
    && (/\d/.test(text) || hasAny(text, ['сегодня', 'завтра', 'вечером', 'утром']));
}
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

const selectionReviewDimensionsConfig = [
  { key: 'selectionQuality', label: 'Разбор качества подборки', max: 18, concepts: ['selectionQuality'] },
  { key: 'reviewSources', label: 'Отзывы Яндекс / Tripadvisor', max: 16, concepts: ['reviewSources'] },
  { key: 'compromiseExplanation', label: 'Объяснение компромисса', max: 16, concepts: ['compromiseExplanation'] },
  { key: 'managerDecision', label: 'Решение менеджера', max: 16, concepts: ['managerDecision'] },
  { key: 'riskHonesty', label: 'Риски и источники', max: 14, concepts: ['riskHonesty', 'sourceCheck', 'factSignalConclusion'] },
  { key: 'nextStep', label: 'Следующий шаг', max: 12, concepts: ['nextStep'] },
  { key: 'humanTone', label: 'Человеческий тон', max: 8, concepts: [] }
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

function buildPenalties(text, scenario, options = {}) {
  const penalties = [];
  if (isKeywordStuffing(text)) penalties.push({ key: 'keywordStuffing', points: 45, reason: 'слова есть, мышления нет', evidence: stuffingWords.filter((w) => text.includes(w)).slice(0, 6) });
  const dangerous = dangerousPromisePhrases.filter((phrase) => text.includes(phrase));
  if (dangerous.length) penalties.push({ key: 'dangerousPromise', points: scenario?.id === 'uae-premium-anxious' ? 22 : 16, reason: 'опасные обещания без проверки', evidence: dangerous });
  const vague = vaguePhrases.filter((phrase) => text.includes(phrase));
  if (vague.length && !hasLogic(text)) penalties.push({ key: 'emptyAdvertising', points: 16, reason: 'пустая реклама без фактов и рисков', evidence: vague });
  if (scenario?.requiredConcepts?.includes('nextStep') && !hasConcreteNextStep(text)) penalties.push({ key: 'noNextStep', points: 14, reason: 'нет действия + срока/канала', evidence: [] });
  if (options.phase === 'selection-review' && !hasAny(text, conceptMap.selectionQuality.words)) penalties.push({ key: 'noSelectionAnalysis', points: 18, reason: 'менеджер не разобрал качество подборки после ссылки', evidence: [] });
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
  if (penalties.some((p) => p.key === 'noSelectionAnalysis')) return ['Сначала разбери качество подборки: страна, отель, звёзды, удобства и попадание в исходные критерии клиента.'];
  const fixes = [];
  for (const d of dimensions) {
    if (d.status === 'good') continue;
    if (d.key === 'diagnosis') fixes.push('Добавь 1–2 вопроса по конкретной ситуации клиента.');
    if (d.key === 'hiddenPain') fixes.push('Назови скрытый страх клиента простыми словами.');
    if (d.key === 'budgetFork') fixes.push('Дай вилку: в бюджет с компромиссом / комфортнее дороже / альтернативная дата или отель.');
    if (d.key === 'riskHonesty') fixes.push('Проговори минусы и что именно проверишь по источникам/отзывам.');
    if (d.key === 'selectionQuality') fixes.push('Сначала разбери качество подборки по фактам: страна, отель, звёзды, удобства и соответствие запросу.');
    if (d.key === 'reviewSources') fixes.push('Добавь вывод по отзывам на Яндексе и Tripadvisor, а не только описание отеля.');
    if (d.key === 'compromiseExplanation') fixes.push('Объясни компромисс: чего нет, почему это допустимо и что клиент получает взамен.');
    if (d.key === 'managerDecision') fixes.push('Скажи, что менеджер делает дальше: меняет подборку, уточняет детали или ведёт к брони.');
    if (d.key === 'nextStep') fixes.push('Зафиксируй действие, срок и канал: например, “сегодня до 18:00 пришлю 3 варианта в WhatsApp”.');
  }
  return fixes.slice(0, 3);
}

export function analyzeSelectionLink(scenarioId = 'turkey-family-hard') {
  const scenario = getScenarioById(scenarioId);
  const hotelFindings = [
    {
      name: 'Side Family Resort 5*',
      country: 'Турция',
      stars: '5*',
      fit: 'сильный детский блок, песчаный пляж',
      risk: 'номера частично уставшие, в сезон очереди в ресторане',
      compromise: 'проходит ближе к бюджету, но питание и номерной фонд слабее ожиданий',
      yandexReviewSignal: 'хвалят пляж и детскую анимацию, ругают очереди в ресторане',
      tripadvisorReviewSignal: 'отмечают уставшие номера, но семейный формат считают понятным',
      confidence: 'средняя'
    },
    {
      name: 'Belek Aqua Club 5*',
      country: 'Турция',
      stars: '5*',
      fit: 'аквапарк, зелёная территория, питание выше среднего',
      risk: 'обычно выше бюджета, надо ловить даты',
      compromise: 'лучше закрывает запрос детей, но почти точно дороже 180 000 ₽',
      yandexReviewSignal: 'часто хвалят питание и территорию',
      tripadvisorReviewSignal: 'пишут, что детская инфраструктура сильнее среднего',
      confidence: 'высокая'
    },
    {
      name: 'Alanya Sun Beach 4+',
      country: 'Турция',
      stars: '4+',
      fit: 'может пройти по бюджету',
      risk: 'трансфер дольше, вход в море неидеален для 2 лет',
      compromise: 'дешевле, но уступка по звёздам, трансферу и заходу в море для младшего ребёнка',
      yandexReviewSignal: 'часть семей жалуется на долгий трансфер',
      tripadvisorReviewSignal: 'пляж называют нормальным, но не идеальным для малышей',
      confidence: 'средняя'
    }
  ];
  const criteria = ['Турция', '5*', 'первая линия', 'песок', 'аквапарк', 'хорошее питание', 'детям 2 и 11 лет', scenario.clientProfile.budget];
  const mismatchedHotels = hotelFindings.filter((hotel) => hotel.country !== 'Турция' || !hotel.stars.includes('5'));
  const hasCompromises = hotelFindings.some((hotel) => /компромисс|дороже|дешевле|уступ|слабее|неидеален/i.test(`${hotel.risk} ${hotel.compromise}`));
  const gaps = [];
  if (hasCompromises || mismatchedHotels.length) gaps.push('Не все варианты честно закрывают исходные критерии клиента.');
  const qualityScore = Math.max(35, 100 - gaps.length * 18 - mismatchedHotels.length * 8 - (hasCompromises ? 10 : 0));
  const bestHotel = hotelFindings[0];
  const compromiseHotel = hotelFindings.find((hotel) => hotel.name.includes('Alanya')) || bestHotel;
  return {
    phase: 'selection-review',
    qualityScore,
    criteria,
    hotelFindings,
    gaps,
    clientReply: `Я посмотрела подборку по ссылке. По критериям ${criteria.join(', ')} вижу компромисс. ${bestHotel.name}: ${bestHotel.country}, ${bestHotel.stars}, сильная сторона — ${bestHotel.fit}, но по Яндекс отзывам ${bestHotel.yandexReviewSignal}, а на Tripadvisor ${bestHotel.tripadvisorReviewSignal}. ${compromiseHotel.name} выглядит как уступка: ${compromiseHotel.compromise}. Объясните, пожалуйста, почему это нормально для нас, или замените вариант, где слабее питание/детская часть/пляж.`,
    managerTask: 'Разобрать качество подборки, отзывы, компромиссы и решить: корректировать подборку, уточнять детали или вести к брони.'
  };
}

const businessSubstanceWords = [
  'бюджет', 'дет', 'возраст', 'даты', 'когда', 'вылет', 'ноч', 'отель', 'подборк', 'вариант', 'пляж', 'питани', 'отзыв', 'риск', 'компромисс', 'дешевле', 'дороже', 'паспорт', 'документ', 'виза', 'оплат', 'бронь', 'депозит'
];

export function shouldShowEvaluationReview({ messages = [], agentText = '', phase = 'dialogue' } = {}) {
  if (phase === 'selection-review') return true;
  const agentMessages = messages.filter((message) => message.role === 'agent');
  const clientText = messages.filter((message) => message.role === 'client').map((message) => message.text).join(' ').toLowerCase();
  const normalizedAgent = normalize(agentText);
  const combined = `${clientText} ${normalizedAgent}`;
  const hasSubstance = hasAny(combined, businessSubstanceWords);
  const hasManagerWork = hasAny(normalizedAgent, ['уточню', 'проверю', 'пришлю', 'подберу', 'сравню', 'вариант', 'бюджет', 'даты', 'отзывы', 'риск']);
  return agentMessages.length >= 2 && hasSubstance && hasManagerWork;
}

export function evaluateAgentReply(text = '', scenarioArg = scenarios[0], options = {}) {
  const scenario = typeof scenarioArg === 'string' ? getScenarioById(scenarioArg) : scenarioArg || scenarios[0];
  const normalized = normalize(text);
  const dimensionConfig = options.phase === 'selection-review' ? selectionReviewDimensionsConfig : dimensionsConfig;
  const dimensions = dimensionConfig.map((config) => buildDimension(normalized, config, scenario));
  const penalties = buildPenalties(normalized, scenario, options);
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

export function getNextClientReply(scenarioId, agentText = '', turn = 1, history = []) {
  const scenario = getScenarioById(scenarioId);
  const result = evaluateAgentReply(agentText, scenario);
  const normalized = normalize(agentText);
  const missedKeys = result.dimensions.filter((d) => d.status !== 'good').map((d) => d.key);
  const alreadyPushed = hasClientAlreadyPushed(history);
  const previousClient = normalize(lastClientText(history));

  if (hasPromisedSelection(normalized) && !result.penalties.some((p) => ['keywordStuffing', 'emptyAdvertising', 'dangerousPromise'].includes(p.key))) {
    return 'Хорошо, тогда жду подборку в обещанный срок. Если что-то не проходит по бюджету или есть риск — напишите сразу, пожалуйста.';
  }

  const pendingDetailsReply = buildPendingDetailsReply(history, agentText, scenario);
  if (pendingDetailsReply) return pendingDetailsReply;

  if (isShortLowInfoAgentReply(agentText)) {
    if (alreadyPushed) return 'Ок, жду. Лучше меньше вариантов, но с понятными плюсами и минусами.';
    return 'Хорошо, подождём. Напишите, когда будет что-то конкретное по вариантам.';
  }

  if (alreadyPushed && turn >= 2) {
    if (missedKeys.includes('nextStep')) return 'Ладно, поняла. Тогда напишите, когда сможете вернуться с конкретикой.';
    if (result.score < 55) return 'Я пока не очень понимаю, но давайте посмотрим, что вы пришлёте.';
    return 'Ок, звучит уже понятнее. Жду варианты.';
  }

  if (result.score < 40 || result.penalties.some((p) => ['keywordStuffing', 'emptyAdvertising'].includes(p.key))) {
    return previousClient.includes('бюджет')
      ? 'Пока всё равно звучит общо. Я тогда подожду конкретные варианты.'
      : 'Вы сейчас общими словами отвечаете. Мне важно понять: в наш бюджет это реально или нет?';
  }
  if (missedKeys.includes('budgetFork')) return 'Хорошо, но вы не сказали по бюджету. Я не хочу потом получить вариант сильно дороже.';
  if (missedKeys.includes('hiddenPain') && scenario.clientProfile.children.length) return 'А детям там точно будет нормально? Младшему 2 года, старшему 11 — это вообще разные потребности.';
  if (missedKeys.includes('riskHonesty')) return 'А какие минусы у этих вариантов? Мне не нужен рекламный текст, я хочу знать, где может быть подвох.';
  if (missedKeys.includes('nextStep')) return 'Допустим. А что дальше конкретно — когда вы пришлёте варианты?';
  if (turn >= 3 || result.score >= 80) return 'Ок, звучит уверенно. Жду 2–3 варианта с плюсами, минусами и что лучше именно для нас.';
  return 'Допустим. А чем вы тогда поможете лучше, чем если я сам посмотрю варианты?';
}

export function createInitialMessages(scenarioId, variantIndex = 0) {
  const scenario = getScenarioById(scenarioId);
  const starts = scenario.startMessages?.length ? scenario.startMessages : [scenario.startMessage];
  const text = starts[Math.abs(variantIndex) % starts.length];
  return [{ id: 'client-start', role: 'client', text, time: 'сейчас' }];
}
