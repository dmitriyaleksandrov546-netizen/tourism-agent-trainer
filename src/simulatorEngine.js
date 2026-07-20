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

export function evaluateAgentReply(text = '') {
  const normalized = text.toLowerCase();
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
  const score = Math.max(0, Math.min(100, details.reduce((sum, item) => sum + item.earned, 0) + lengthBonus - dangerousPromisePenalty));

  const verdict = score >= 78 ? 'Готово к реальному клиенту' : score >= 52 ? 'Нормально, но нужен дожим' : 'Высокий риск слить заявку';

  const missed = details.filter((item) => item.earned === 0).map((item) => item.label);

  return {
    score,
    verdict,
    detected,
    details,
    missed,
    advice: buildAdvice(detected, dangerousPromisePenalty)
  };
}

function buildAdvice(detected, dangerousPromisePenalty) {
  const advice = [];
  if (!detected.includes('needs')) advice.push('Сначала добери вводные: дети, бюджет, даты, пляж, питание, что критично, что можно уступить.');
  if (!detected.includes('risk')) advice.push('Добавь честное предупреждение по рискам, иначе клиент получит завышенные ожидания.');
  if (!detected.includes('alternatives')) advice.push('Дай вилку из 2–3 вариантов: “в бюджет”, “комфортнее”, “безопаснее”.');
  if (!detected.includes('nextStep')) advice.push('Закрывай на конкретный следующий шаг: созвон, подборку, бронь, фиксацию цены.');
  if (dangerousPromisePenalty) advice.push('Не давай гарантий в стиле “точно понравится” — лучше “проверю по источникам и предупрежу о рисках”.');
  return advice.length ? advice : ['Хороший ответ: есть уточнения, честность, ценность и следующий шаг. Теперь можно сильнее закрывать на бронь.'];
}

export function getNextClientReply(scenarioId, agentText = '', turn = 1) {
  const scenario = getScenarioById(scenarioId);
  const evalResult = evaluateAgentReply(agentText);
  const lower = agentText.toLowerCase();

  if (evalResult.score < 40) {
    return 'Вы сейчас общими словами отвечаете. А мне важно понять: в наш бюджет это реально или нет? И плохие отзывы вы проверяли?';
  }

  if (!lower.includes('бюджет') && !lower.includes('цен')) {
    return 'Хорошо, но вы не сказали по бюджету. Я не хочу потом получить вариант на 250 тысяч вместо 180.';
  }

  if (!lower.includes('дет') && scenario.clientProfile.children.length) {
    return 'А детям там точно будет нормально? Младшему 2 года, старшему 11 — это вообще разные потребности.';
  }

  if (!evalResult.detected.includes('risk')) {
    return 'А какие минусы у этих вариантов? Мне не нужен рекламный текст, я хочу знать, где может быть подвох.';
  }

  if (turn >= 3 || evalResult.score >= 78) {
    return 'Ок, звучит уверенно. Пришлите 2–3 варианта с плюсами, минусами и что лучше именно для нашей семьи.';
  }

  return 'Допустим. А почему мне бронировать через вас, если я могу сам посмотреть на агрегаторе?';
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
