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
        fit: 'сильный детский блок, песчаный пляж',
        risk: 'номера частично уставшие, в сезон очереди в ресторане',
        confidence: 'средняя',
        source: 'карточка агентства · проверено 18.07.2026'
      },
      {
        name: 'Belek Aqua Club 5*',
        fit: 'аквапарк, зелёная территория, питание выше среднего',
        risk: 'обычно выше бюджета, надо ловить даты',
        confidence: 'высокая',
        source: 'оператор + отзывы · проверено 17.07.2026'
      },
      {
        name: 'Alanya Sun Beach 4+',
        fit: 'может пройти по бюджету',
        risk: 'трансфер дольше, вход в море неидеален для 2 лет',
        confidence: 'средняя',
        source: 'отзывы + менеджеры · проверено 16.07.2026'
      }
    ]
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

const rubric = [
  {
    key: 'needs',
    label: 'Выявление потребностей',
    points: 18,
    patterns: ['уточн', 'возраст', 'дет', 'важно', 'критич', 'пляж', 'питани', 'бюджет', 'состав', 'даты']
  },
  {
    key: 'risk',
    label: 'Честность и риски',
    points: 18,
    patterns: ['риск', 'предупреж', 'чест', 'компромисс', 'не обещ', 'может не', 'отзывы', 'провер']
  },
  {
    key: 'value',
    label: 'Ценность агента',
    points: 14,
    patterns: ['сопровожд', 'проверю', 'сравн', 'подбер', 'источник', 'актуальн', 'помогу']
  },
  {
    key: 'alternatives',
    label: 'Альтернативы',
    points: 14,
    patterns: ['вариант', 'альтернатив', '2 отел', '3 отел', 'вилка', 'дороже', 'дешевле']
  },
  {
    key: 'objection',
    label: 'Работа с возражением',
    points: 12,
    patterns: ['понимаю', 'давайте сравним', 'разница', 'не спор', 'соглас', 'посмотрим']
  },
  {
    key: 'nextStep',
    label: 'Следующий шаг',
    points: 14,
    patterns: ['созвон', 'бронь', 'предоплат', 'зафикс', 'отправлю', '10 минут', 'следующий шаг']
  },
  {
    key: 'tone',
    label: 'Тон без канцелярита',
    points: 10,
    patterns: ['давайте', 'сразу', 'спокойно', 'по-честному', 'коротко']
  }
];

export function getScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

const rudePatterns = ['блять', 'бляд', 'сука', 'нахуй', 'хуй', 'пизд', 'еба', 'ёба', 'заеб', 'мудак', 'идиот'];

function hasRudeTone(text = '') {
  const normalized = text.toLowerCase();
  return rudePatterns.some((pattern) => normalized.includes(pattern));
}

export function evaluateAgentReply(text = '', scenarioId = 'turkey-family-hard') {
  const scenario = getScenarioById(scenarioId);
  const normalized = text.toLowerCase();
  const rudeTone = hasRudeTone(text);
  const detected = [];
  const details = rubric.map((item) => {
    const hits = item.patterns.filter((pattern) => normalized.includes(pattern));
    const earned = hits.length ? item.points : 0;
    if (earned) detected.push(item.key);
    return {
      key: item.key,
      label: item.label,
      earned,
      max: item.points,
      hits
    };
  });

  const lengthBonus = normalized.length > 180 ? 8 : normalized.length > 80 ? 4 : 0;
  const dangerousPromisePenalty = ['гарантирую', 'точно понравится', 'без проблем', 'идеально'].some((phrase) => normalized.includes(phrase)) ? 12 : 0;
  const score = rudeTone ? 0 : Math.max(0, Math.min(100, details.reduce((sum, item) => sum + item.earned, 0) + lengthBonus - dangerousPromisePenalty));

  const verdict = rudeTone ? 'Клиент почти потерян: грубость/мат' : score >= 78 ? 'Готово к реальному клиенту' : score >= 52 ? 'Нормально, но нужен дожим' : 'Высокий риск слить заявку';

  const missed = details.filter((item) => item.earned === 0).map((item) => item.label);

  return {
    score,
    verdict,
    detected,
    details,
    missed,
    advice: rudeTone ? ['Остановиться и извиниться. Реальный клиент после такого почти точно уйдёт.', 'Вернуться к спокойному тону: “Извините, давайте по делу. Я проверю источники и риски”.'] : buildAdvice(detected, dangerousPromisePenalty, scenario)
  };
}

function buildAdvice(detected, dangerousPromisePenalty, scenario) {
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
  return advice.length ? advice : ['Хороший ответ: есть уточнения, честность, ценность и следующий шаг. Теперь можно сильнее закрывать на бронь.'];
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
