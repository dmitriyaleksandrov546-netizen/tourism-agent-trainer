export const scenarios = [
  {
    id: 'turkey-family-hard',
    title: 'Семья 2+2: Турция, бюджет жмёт',
    level: 'Жёсткий клиент',
    direction: 'Турция / семейный отдых',
    duration: '12–15 мин',
    clientProfile: {
      name: 'Анна',
      family: '2 взрослых + 2 ребёнка',
      children: ['2 года', '11 лет'],
      budget: 'до 180 000 ₽',
      hiddenNeed: 'безопасный заход в море для младшего и активности для старшего',
      trigger: 'боится плохих отзывов и переплат'
    },
    startMessage:
      'Здравствуйте. Нас четверо: двое взрослых, детям 2 года и 11 лет. Хотим Турцию, 5*, первая линия, песок, аквапарк, хорошее питание и чтобы не было толпы. Бюджет до 180 тысяч. Такое реально?',
    objectives: [
      'Выявить настоящие критерии семьи',
      'Объяснить компромисс бюджета без конфликта',
      'Не обещать невозможное',
      'Закрыть на созвон или подборку'
    ],
    hotelContext: [
      {
        name: 'Side Family Resort 5*',
        country: 'Турция',
        stars: '5*',
        fit: 'сильный детский блок, песчаный пляж',
        risk: 'номера частично уставшие, в сезон очереди в ресторане',
        compromise: 'проходит ближе к бюджету, но питание и номерной фонд слабее ожиданий',
        yandexReviewSignal: 'хвалят пляж и детскую анимацию, ругают очереди в ресторане',
        tripadvisorReviewSignal: 'отмечают уставшие номера, но семейный формат считают понятным',
        confidence: 'средняя',
        source: 'карточка агентства · проверено 18.07.2026'
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
        confidence: 'высокая',
        source: 'оператор + отзывы · проверено 17.07.2026'
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
        confidence: 'средняя',
        source: 'отзывы + менеджеры · проверено 16.07.2026'
      }
    ],
    selectionCriteria: ['Турция', '5*', 'первая линия', 'песок', 'аквапарк', 'хорошее питание', 'детям 2 и 11 лет', 'до 180 000 ₽']
  },
  {
    id: 'egypt-budget-objections',
    title: 'Египет: “дёшево, но как премиум”',
    level: 'Возражения по цене',
    direction: 'Египет / бюджет',
    duration: '8–10 мин',
    clientProfile: {
      name: 'Игорь',
      family: 'пара',
      children: [],
      budget: 'до 120 000 ₽',
      hiddenNeed: 'хочет тёплое море и нормальный риф, но не понимает компромиссы',
      trigger: 'нашёл дешевле у конкурента'
    },
    startMessage:
      'Мне у другого агента дали Египет дешевле на 15 тысяч. Почему у вас дороже? Там тоже 5 звёзд и всё включено.',
    objectives: ['Проверить реальную разницу', 'Показать ценность сопровождения', 'Сохранить маржу', 'Предложить честные альтернативы'],
    hotelContext: [
      {
        name: 'Sharm Reef Bay 5*',
        fit: 'хороший риф, нормальная цена',
        risk: 'ветер зимой, пляж с понтона',
        confidence: 'высокая',
        source: 'оператор · проверено 19.07.2026'
      }
    ]
  },
  {
    id: 'uae-premium-anxious',
    title: 'ОАЭ: премиум-клиент без права на ошибку',
    level: 'Премиум',
    direction: 'ОАЭ / высокий чек',
    duration: '15 мин',
    clientProfile: {
      name: 'Марина',
      family: '2 взрослых',
      children: [],
      budget: 'до 650 000 ₽',
      hiddenNeed: 'хочет уверенность, быстрые ответы и отсутствие сюрпризов',
      trigger: 'не терпит общих фраз'
    },
    startMessage:
      'Мне нужен отель в Дубае, чтобы без сюрпризов. Я не хочу потом выяснять, что стройка рядом, пляж через дорогу или депозит огромный. Что вы можете гарантировать?',
    objectives: ['Не давать ложных гарантий', 'Уточнить критичные риски', 'Показать источники', 'Закрыть на подбор с проверкой фактов'],
    hotelContext: [
      {
        name: 'Jumeirah Calm Bay 5*',
        fit: 'сервис, пляж, премиальная аудитория',
        risk: 'депозит и высокий чек на рестораны',
        confidence: 'средняя',
        source: 'сайт отеля · проверено 15.07.2026'
      }
    ]
  }
];

const conceptRules = {
  needs: {
    label: 'Выявление потребностей',
    points: 18,
    patterns: ['уточн', 'возраст', 'дет', 'важно', 'критич', 'пляж', 'питани', 'бюджет', 'состав', 'даты', 'район', 'депозит']
  },
  risk: {
    label: 'Честность и риски',
    points: 18,
    patterns: ['риск', 'минус', 'предупреж', 'чест', 'компромисс', 'не обещ', 'может не', 'отзывы', 'провер', 'подвох']
  },
  value: {
    label: 'Ценность агента',
    points: 14,
    patterns: ['сопровожд', 'проверю', 'сверю', 'сравн', 'источник', 'актуальн', 'оператор', 'помогу']
  },
  alternatives: {
    label: 'Альтернативы',
    points: 14,
    patterns: ['вариант', 'альтернатив', '2 отел', '3 отел', '2–3', 'вилка', 'дороже', 'дешевле', 'комфортнее']
  },
  objection: {
    label: 'Работа с возражением',
    points: 12,
    patterns: ['понимаю', 'давайте сравним', 'разница', 'не спор', 'соглас', 'посмотрим', 'по-честному']
  },
  nextStep: {
    label: 'Следующий шаг',
    points: 14,
    patterns: ['созвон', 'бронь', 'предоплат', 'зафикс', 'отправлю', 'пришлю', 'сегодня', 'вечером', 'завтра', 'до 17', 'до 18', '10 минут', 'whatsapp', 'вотсап']
  },
  tone: {
    label: 'Тон без канцелярита',
    points: 10,
    patterns: ['понимаю', 'давайте', 'сразу', 'спокойно', 'по-честному', 'коротко', 'ок', 'хорошо']
  },
  selectionQuality: {
    label: 'Разбор качества подборки',
    points: 16,
    patterns: ['подборк', 'отель', 'звезд', 'звёзд', 'страна', 'критери', 'удобств', 'пляж', 'питани', 'аквапарк', 'трансфер']
  },
  reviewSources: {
    label: 'Отзывы и источники',
    points: 14,
    patterns: ['яндекс', 'tripadvisor', 'трипадвайзер', 'отзыв', 'пишут', 'хвалят', 'ругают', 'источник']
  },
  compromiseExplanation: {
    label: 'Объяснение компромисса',
    points: 14,
    patterns: ['компромисс', 'зато', 'но', 'уступ', 'дешевле', 'дороже', 'важнее', 'замен']
  },
  managerDecision: {
    label: 'Решение менеджера после реакции клиента',
    points: 14,
    patterns: ['заменю', 'корректир', 'уточню', 'оставляем', 'меняем', 'добавлю', 'покажу разницу', 'следующий шаг']
  }
};

const scenarioRequiredSignals = {
  'turkey-family-hard': {
    needs: ['2 года', '11 лет', 'младш', 'старш', 'дет'],
    risk: ['вход в море', 'пляж', 'отзывы', 'компромисс'],
    alternatives: ['180', 'бюджет', 'вилка', 'вариант']
  },
  'egypt-budget-objections': {
    objection: ['дешевле', 'разница', 'сравн', 'конкурент'],
    risk: ['риф', 'пляж', 'понтон', 'ветер', 'номер', 'рейс'],
    value: ['проверю', 'сверю', 'источник', 'оператор']
  },
  'uae-premium-anxious': {
    needs: ['дубай', 'район', 'пляж', 'депозит'],
    risk: ['стройк', 'депозит', 'пляж через дорогу', 'не обещ', 'провер'],
    value: ['источник', 'сайт отеля', 'актуальн', 'провер']
  }
};

export function getScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

const rudePatterns = ['блять', 'бляд', 'сука', 'нахуй', 'хуй', 'пизд', 'еба', 'ёба', 'заеб', 'мудак', 'идиот'];
const dangerousPromisePatterns = ['гарантирую', 'точно понравится', 'без проблем', 'идеально', '100%', 'лучший отель'];
const logicMarkers = ['потому', 'поэтому', 'если', 'либо', 'значит', 'в вашем случае', 'для вас', 'чтобы', 'так как'];
const stuffingPatterns = ['бюджет', 'риск', 'варианты', 'созвон', 'дети', 'честно', 'проверю', 'отзывы', 'цена', 'бронь'];

function hasRudeTone(text = '') {
  const normalized = text.toLowerCase();
  return rudePatterns.some((pattern) => normalized.includes(pattern));
}

function countWords(text = '') {
  return text.replace(/[.,!?;:()«»“”]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function hasAny(text = '', patterns = []) {
  return patterns.some((pattern) => text.includes(pattern));
}

function isKeywordStuffing(normalized = '') {
  const hits = stuffingPatterns.filter((pattern) => normalized.includes(pattern)).length;
  return hits >= 6 && !hasAny(normalized, logicMarkers) && countWords(normalized) <= 24;
}

function activeRuleKeys(options = {}) {
  const base = ['needs', 'risk', 'value', 'alternatives', 'objection', 'nextStep', 'tone'];
  const selection = ['selectionQuality', 'reviewSources', 'compromiseExplanation', 'managerDecision'];
  return options.phase === 'selection-review' ? selection.concat(['risk', 'nextStep', 'tone']) : base;
}

function scoreRule(normalized, key, scenario) {
  const rule = conceptRules[key];
  const hits = rule.patterns.filter((pattern) => normalized.includes(pattern));
  const scenarioHits = (scenarioRequiredSignals[scenario.id]?.[key] || []).filter((pattern) => normalized.includes(pattern));
  const hasLogic = hasAny(normalized, logicMarkers) || key === 'nextStep' || key === 'tone';
  let multiplier = hits.length ? 0.7 : 0;
  if (['selectionQuality', 'reviewSources', 'compromiseExplanation', 'managerDecision'].includes(key) && hits.length >= 2 && hasLogic) multiplier = 1;
  if (key === 'nextStep' && hits.length) multiplier = 1;
  if (scenarioHits.length) multiplier = 1;
  if (hits.length && !hasLogic) multiplier *= 0.6;

  const earned = Math.round(rule.points * multiplier);
  return {
    key,
    label: rule.label,
    earned,
    max: rule.points,
    hits: [...new Set([...hits, ...scenarioHits])].slice(0, 4),
    status: earned >= rule.points * 0.75 ? 'good' : earned > 0 ? 'partial' : 'missed'
  };
}

export function evaluateAgentReply(text = '', scenarioId = 'turkey-family-hard', options = {}) {
  const scenario = getScenarioById(scenarioId);
  const normalized = text.toLowerCase();
  const rudeTone = hasRudeTone(text);
  const details = activeRuleKeys(options).map((key) => scoreRule(normalized, key, scenario));
  const detected = details.filter((item) => item.status === 'good').map((item) => item.key);
  const dangerousPromisePenalty = dangerousPromisePatterns.some((phrase) => normalized.includes(phrase)) ? (scenario.id === 'uae-premium-anxious' ? 22 : 16) : 0;
  const stuffingPenalty = isKeywordStuffing(normalized) ? 45 : 0;
  const noConcreteNextStepPenalty = !detected.includes('nextStep') ? 8 : 0;
  const selectionPhasePenalty = options.phase === 'selection-review' && !detected.includes('selectionQuality') ? 18 : 0;
  const rawScore = details.reduce((sum, item) => sum + item.earned, 0);
  const maxScore = details.reduce((sum, item) => sum + item.max, 0) || 100;
  const normalizedScore = Math.round((rawScore / maxScore) * 100);
  const score = rudeTone ? 0 : Math.max(0, Math.min(100, normalizedScore - dangerousPromisePenalty - stuffingPenalty - noConcreteNextStepPenalty - selectionPhasePenalty));
  const verdict = rudeTone
    ? 'Клиент почти потерян: грубость/мат'
    : stuffingPenalty
      ? 'Высокий риск слить заявку: слова есть, мышления нет'
      : score >= 78 ? 'Готово к реальному клиенту' : score >= 52 ? 'Нормально, но нужен дожим' : 'Высокий риск слить заявку';
  const missed = details.filter((item) => item.status !== 'good').map((item) => item.label);

  return {
    score,
    verdict,
    detected,
    details,
    missed,
    advice: rudeTone
      ? ['Остановиться и извиниться. Реальный клиент после такого почти точно уйдёт.', 'Вернуться к спокойному тону: “Извините, давайте по делу. Я проверю источники и риски”.']
      : buildAdvice(detected, dangerousPromisePenalty, stuffingPenalty, scenario, options)
  };
}

function buildAdvice(detected, dangerousPromisePenalty, stuffingPenalty, scenario, options = {}) {
  if (stuffingPenalty) return ['Не набивай ответ словами. Напиши связку: что понял → где компромисс → что проверишь → когда вернёшься.'];
  if (options.phase === 'selection-review') {
    const advice = [];
    if (!detected.includes('selectionQuality')) advice.push('Сначала разбери качество подборки: страна, отель, звёзды, удобства и попадание в исходные критерии клиента.');
    if (!detected.includes('reviewSources')) advice.push('Добавь вывод по отзывам на Яндексе и Tripadvisor, а не только рекламное описание отеля.');
    if (!detected.includes('compromiseExplanation')) advice.push('Объясни компромисс: чего нет, почему это допустимо и что клиент получает взамен.');
    if (!detected.includes('managerDecision')) advice.push('Скажи, что менеджер делает дальше: меняет подборку, уточняет детали или ведёт к брони/документам.');
    if (!detected.includes('nextStep')) advice.push('Закрой на конкретный срок следующего действия: сегодня до 18:00, звонок, корректировка или бронь.');
    return advice.length ? advice.slice(0, 4) : ['Хороший следующий шаг: ты разобрал подборку, отзывы, компромисс и дал понятное действие менеджера.'];
  }
  const advice = [];
  if (!detected.includes('needs')) {
    if (scenario.clientProfile.children.length) {
      advice.push('Сначала добери вводные: дети, бюджет, даты, пляж, питание, что критично, что можно уступить.');
    } else if (scenario.id === 'uae-premium-anxious') {
      advice.push('Сначала добери премиум-вводные: район, пляж, стройка рядом, депозит, питание, трансфер, что критично без сюрпризов.');
    } else {
      advice.push('Сначала добери вводные: даты, бюджет, что критично, что уже сравнивали, где клиент боится ошибиться.');
    }
  }
  if (!detected.includes('risk')) advice.push('Добавь честное предупреждение по рискам, иначе клиент получит завышенные ожидания.');
  if (!detected.includes('alternatives')) advice.push('Дай вилку из 2–3 вариантов: “в бюджет”, “комфортнее”, “безопаснее”.');
  if (!detected.includes('nextStep')) advice.push('Закрывай на конкретный следующий шаг: созвон, подборку, бронь, фиксацию цены.');
  if (dangerousPromisePenalty) advice.push('Не давай гарантий в стиле “точно понравится” — лучше “проверю по источникам и предупрежу о рисках”.');
  return advice.length ? advice.slice(0, 4) : ['Хороший ответ: есть уточнения, честность, ценность и следующий шаг. Теперь можно сильнее закрывать на бронь.'];
}

export function analyzeSelectionLink(scenarioId = 'turkey-family-hard') {
  const scenario = getScenarioById(scenarioId);
  const hotelFindings = scenario.hotelContext.map((hotel) => ({
    name: hotel.name,
    country: hotel.country || scenario.direction.split('/')[0].trim(),
    stars: hotel.stars || (hotel.name.match(/\d\+?\*/) || ['не указано'])[0],
    fit: hotel.fit,
    risk: hotel.risk,
    compromise: hotel.compromise || 'компромисс не объяснён',
    yandexReviewSignal: hotel.yandexReviewSignal || 'нет отдельного сигнала из Яндекса',
    tripadvisorReviewSignal: hotel.tripadvisorReviewSignal || 'нет отдельного сигнала из Tripadvisor',
    confidence: hotel.confidence
  }));
  const hasCompromises = hotelFindings.some((hotel) => /компромисс|дороже|дешевле|уступ|слабее|неидеален/i.test(`${hotel.risk} ${hotel.compromise}`));
  const hasReviewSignals = hotelFindings.every((hotel) => hotel.yandexReviewSignal && hotel.tripadvisorReviewSignal);
  const mismatchedHotels = hotelFindings.filter((hotel) => hotel.country !== 'Турция' || !hotel.stars.includes('5'));
  const gaps = [];
  if (hasCompromises || mismatchedHotels.length) gaps.push('Не все варианты честно закрывают исходные критерии клиента.');
  if (!hasReviewSignals) gaps.push('Не хватает проверки отзывов на Яндексе и Tripadvisor.');
  const qualityScore = Math.max(35, 100 - gaps.length * 18 - mismatchedHotels.length * 8 - (hasCompromises ? 10 : 0));
  const bestHotel = hotelFindings[0];
  const compromiseHotel = hotelFindings.find((hotel) => hotel.name.includes('Alanya')) || hotelFindings.find((hotel) => hotel.compromise !== 'компромисс не объяснён');

  return {
    phase: 'selection-review',
    qualityScore,
    criteria: scenario.selectionCriteria || [],
    hotelFindings,
    gaps,
    clientReply: `Я посмотрела подборку по ссылке. По критериям ${scenario.selectionCriteria?.join(', ') || scenario.direction} вижу не просто “подходит/не подходит”, а компромисс. ${bestHotel.name}: ${bestHotel.country}, ${bestHotel.stars}, сильная сторона — ${bestHotel.fit}, но по Яндекс отзывам ${bestHotel.yandexReviewSignal}, а на Tripadvisor ${bestHotel.tripadvisorReviewSignal}. ${compromiseHotel?.name || bestHotel.name} выглядит как уступка: ${compromiseHotel?.compromise || bestHotel.compromise}. Объясните, пожалуйста, почему это нормально для нас, или замените вариант, где слабее питание/детская часть/пляж.`,
    managerTask: 'Менеджер должен разобрать качество подборки, отзывы, компромиссы и решить: корректировать подборку, уточнять детали или вести к брони.'
  };
}

const scenarioResponseDecks = {
  'turkey-family-hard': {
    weak: [
      'Пока не поняла, что именно вы будете подбирать. Мне важно сразу понять: в бюджет 180 тысяч это реально или мы ищем компромисс? И отзывы вы проверяли?',
      'Окей, а по детям вы учтёте разницу? Младшему 2 года важен заход в море и еда, старшему 11 — чтобы не было скучно.',
      'Тогда покажите честно: что проходит в бюджет, где риск, и за что нужно доплатить. Без “примерно нормально”.'
    ],
    budget: 'Хорошо. Только не хочется потом увидеть подборку на 250 тысяч. Скажите честно: в 180 реально или надо менять требования?',
    children: 'А детям там точно будет нормально? Младшему 2 года и старшему 11 нужны вообще разные вещи.',
    risk: 'А минусы какие? Я не хочу рекламный текст — лучше сразу знать, где может быть подвох по пляжу, питанию или отзывам.',
    value: 'Допустим. А почему лучше через вас, а не самой открыть агрегатор и выбрать по отзывам?',
    close: 'Ок, звучит понятнее. Пришлите 2–3 варианта: что в бюджет, что комфортнее и какие минусы у каждого.'
  },
  'egypt-budget-objections': {
    weak: [
      'Я пока не поняла разницу. Если у другого дешевле на 15 тысяч, что именно там может быть хуже?',
      'Вы говорите “проверю”, но что именно: отель, номер, рейс, багаж, риф, пляж и финальную цену?',
      'Мне нужен простой вывод: почему у вас дороже и стоит ли оно этих денег. Иначе логично выбрать дешевле.'
    ],
    budget: 'Вы всё ещё не разобрали цену. Покажите, где разница: даты, рейс, номер, страховка, багаж, трансфер.',
    risk: 'А минусы дешёвого варианта какие? Мне важно не купить “5 звёзд”, а потом получить понтон, ветер и слабое питание.',
    value: 'Почему мне платить вам дороже? Что вы проверите такого, чего я не увижу на агрегаторе?',
    close: 'Ладно, пришлите сравнение в 3 строки: дешевле, безопаснее, оптимально по цене/качеству.'
  },
  'uae-premium-anxious': {
    weak: [
      'Пока слишком общо. Мне важны конкретно стройка рядом, депозит, пляж через дорогу и что можно проверить до оплаты.',
      'Что именно вы проверите по источникам? Мне нужны даты актуальности, не “обычно всё хорошо”.',
      'Если вы не можете сказать, где риски, я не готова платить такой чек. Дайте прозрачную проверку по каждому отелю.'
    ],
    budget: 'Цена не главный вопрос. Главный вопрос — какие обязательные депозиты и расходы на месте всплывут после оплаты?',
    risk: 'Без рисков это звучит как реклама. Проверьте стройку, пляж, депозит, питание и отмену — и скажите, где слабое место.',
    value: 'Мне нужна не подборка красивых отелей, а ваша проверка перед оплатой. Что конкретно вы берёте на себя?',
    close: 'Ок. Дайте 2 варианта: самый безопасный и самый красивый, но с честными рисками и источниками проверки.'
  }
};

const dialogueConcepts = {
  budget: ['бюджет', 'цен', 'дороже', 'дешевле', 'вилк', 'компромисс', '180', '200', '250', 'стоим'],
  children: ['дет', 'младш', 'старш', 'возраст', '2 года', '11 лет', 'семь'],
  risk: ['риск', 'минус', 'подвох', 'отзыв', 'провер', 'не обещ', 'чест', 'источник'],
  value: ['сопровожд', 'через вас', 'агрегатор', 'проверю', 'сверю', 'актуальн', 'оператор', 'источник'],
  alternatives: ['вариант', 'альтернатив', '2', '3', 'вилка', 'подборк'],
  nextStep: ['сегодня', 'вечером', 'завтра', 'до 17', 'до 18', 'пришлю', 'отправлю', 'созвон', 'whatsapp', 'вотсап']
};

function textHasConcept(text = '', key) {
  const normalized = text.toLowerCase();
  return dialogueConcepts[key].some((word) => normalized.includes(word));
}

function collectDialogueState(agentText = '', history = []) {
  const agentTexts = [
    ...history.filter((message) => message.role === 'agent').map((message) => message.text),
    agentText
  ].join('\n').toLowerCase();

  return Object.fromEntries(Object.keys(dialogueConcepts).map((key) => [key, textHasConcept(agentTexts, key)]));
}

function pickFreshReply(candidates, history = []) {
  const usedClientTexts = new Set(history.filter((message) => message.role === 'client').map((message) => message.text));
  return candidates.find((candidate) => !usedClientTexts.has(candidate)) || candidates[candidates.length - 1];
}

function pickByDialogueGap(scenario, deck, state, history) {
  const candidates = [];
  if (!state.budget) candidates.push(deck.budget);
  if (scenario.clientProfile.children.length && !state.children) candidates.push(deck.children);
  if (!state.risk) candidates.push(deck.risk);
  if (!state.value) candidates.push(deck.value);
  if (state.budget && state.risk && state.alternatives && state.nextStep) candidates.push(deck.close);
  candidates.push(...deck.weak);
  return pickFreshReply(candidates.filter(Boolean), history);
}

export function getNextClientReply(scenarioId, agentText = '', turn = 1, history = []) {
  const scenario = getScenarioById(scenarioId);
  const deck = scenarioResponseDecks[scenario.id] || scenarioResponseDecks['turkey-family-hard'];
  const evalResult = evaluateAgentReply(agentText, scenario.id);
  const state = collectDialogueState(agentText, history);

  if (evalResult.score < 40) {
    return pickFreshReply(deck.weak.slice(Math.max(0, turn - 2)), history);
  }

  return pickByDialogueGap(scenario, deck, state, history);
}

export function createInitialMessages(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  return [
    {
      id: 'client-start',
      role: 'client',
      text: scenario.startMessage,
      time: 'сейчас'
    }
  ];
}
