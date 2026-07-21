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
      'Вы сейчас общими словами отвечаете. А мне важно понять: в наш бюджет это реально или нет? И плохие отзывы вы проверяли?',
      'Что именно вы проверили по детям? Младшему 2 года: мне важны заход в море, еда, сон и чтобы старшему 11 лет не было скучно.',
      'Я не хочу “примерно подойдёт”. Назовите 2 варианта: что в бюджет, где риск, и за что придётся доплатить.'
    ],
    budget: 'Хорошо, но вы не сказали по бюджету. Я не хочу потом получить вариант на 250 тысяч вместо 180.',
    children: 'А детям там точно будет нормально? Младшему 2 года, старшему 11 — это вообще разные потребности.',
    risk: 'А какие минусы у этих вариантов? Мне не нужен рекламный текст, я хочу знать, где может быть подвох.',
    value: 'Допустим. А почему мне бронировать через вас, если я могу сам посмотреть на агрегаторе?',
    close: 'Ок, звучит уверенно. Пришлите 2–3 варианта с плюсами, минусами и что лучше именно для нашей семьи.'
  },
  'egypt-budget-objections': {
    weak: [
      'Вы сейчас не сравнили по делу. Если у другого дешевле на 15 тысяч, что именно там хуже: отель, номер, перелёт, страховка или условия оплаты?',
      'Вы говорите, что проверяли — что именно? Название отеля, тип номера, риф, пляж, ветер зимой и финальную цену с доплатами?',
      'Мне нужен простой вывод: почему у вас дороже и стоит ли оно этих денег. Иначе я уйду туда, где дешевле.'
    ],
    budget: 'Вы всё ещё не разобрали цену. Покажите, где разница: даты, рейс, номер, страховка, багаж, трансфер.',
    risk: 'А минусы дешёвого варианта какие? Мне важно не купить “5 звёзд”, а потом получить понтон, ветер и слабое питание.',
    value: 'Почему мне платить вам дороже? Что вы сделаете такого, чего не сделает агрегатор?',
    close: 'Ладно, пришлите сравнение в 3 строки: дешевле, безопаснее, оптимально по цене/качеству.'
  },
  'uae-premium-anxious': {
    weak: [
      'Слишком общо. Я спрашивала конкретно: стройка рядом, депозит, пляж через дорогу, трансфер и что можно проверить до оплаты.',
      'Что именно вы проверите по источникам? Мне нужны даты актуальности, не “обычно всё хорошо”.',
      'Если вы не можете сказать, где риски, я не готова платить такой чек. Дайте прозрачную проверку по каждому отелю.'
    ],
    budget: 'Цена не главный вопрос. Главный вопрос — какие обязательные депозиты и расходы на месте всплывут после оплаты?',
    risk: 'Без рисков это звучит как реклама. Проверьте стройку, пляж, депозит, питание и отмену — и скажите, где слабое место.',
    value: 'Мне нужна не подборка красивых отелей, а ваша проверка перед оплатой. Что конкретно вы берёте на себя?',
    close: 'Ок. Дайте 2 варианта: самый безопасный и самый красивый, но с честными рисками и источниками проверки.'
  }
};

function pickFreshReply(candidates, history = []) {
  const usedClientTexts = new Set(history.filter((message) => message.role === 'client').map((message) => message.text));
  return candidates.find((candidate) => !usedClientTexts.has(candidate)) || candidates[candidates.length - 1];
}

export function getNextClientReply(scenarioId, agentText = '', turn = 1, history = []) {
  const scenario = getScenarioById(scenarioId);
  const deck = scenarioResponseDecks[scenario.id] || scenarioResponseDecks['turkey-family-hard'];
  const evalResult = evaluateAgentReply(agentText);
  const lower = agentText.toLowerCase();

  if (evalResult.score < 40) {
    return pickFreshReply(deck.weak.slice(Math.max(0, turn - 2)), history);
  }

  if (!lower.includes('бюджет') && !lower.includes('цен') && !lower.includes('дороже') && !lower.includes('дешевле')) {
    return deck.budget || deck.weak[0];
  }

  if (!lower.includes('дет') && scenario.clientProfile.children.length) {
    return deck.children || deck.weak[1];
  }

  if (!evalResult.detected.includes('risk')) {
    return deck.risk;
  }

  if (!evalResult.detected.includes('value')) {
    return deck.value;
  }

  if (turn >= 3 || evalResult.score >= 78) {
    return deck.close;
  }

  return deck.value;
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
