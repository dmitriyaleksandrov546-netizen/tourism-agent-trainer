export const corpusInsights = {
  source: 'Tourism-Neuroclient-OBS / Reports/Neuroclient Brain - Full Report.md',
  totalCalls: 2359,
  audioHours: 150.2,
  averageScore: 36.7,
  mainArchetypes: [
    { id: 'price_sensitive', label: 'Чувствителен к цене', share: 62.2, trigger: 'сухая цена без вилки и альтернатив' },
    { id: 'thinking_budget_unclear', label: 'Думает, бюджет неясен', share: 20.7, trigger: 'агент отпускает “подумаю” без следующего шага' },
    { id: 'silent_busy_unreachable', label: 'Занят / пропадает', share: 10.9, trigger: 'не зафиксировано точное время перезвона' },
    { id: 'family_age_constraints', label: 'Семья и возрастные ограничения', share: 1.9, trigger: 'отель предложен без учёта возраста детей' }
  ],
  silenceTriggers: [
    { label: 'после поверхностного разговора без вводных', share: 97.5 },
    { label: 'после цены или несовпадения бюджета с реальностью', share: 90.5 },
    { label: 'после отсутствия 2–3 альтернатив', share: 52.9 },
    { label: 'после разговора без конкретного следующего шага', share: 20.0 }
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

export const scenarios = [
  {
    id: 'turkey-family-hard',
    archetype: 'family_age_constraints',
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
    archetype: 'price_sensitive',
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
    archetype: 'thinking_budget_unclear',
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
    key: 'diagnosis',
    label: 'Диагностика, а не угадывание',
    points: 20,
    patterns: ['уточн', 'возраст', 'дет', 'важно', 'критич', 'пляж', 'питани', 'бюджет', 'состав', 'даты', 'что для вас']
  },
  {
    key: 'riskHonesty',
    label: 'Честность по рискам',
    points: 18,
    patterns: ['риск', 'предупреж', 'чест', 'компромисс', 'не обещ', 'может не', 'отзывы', 'провер', 'минус']
  },
  {
    key: 'contextReading',
    label: 'Понимание скрытой боли',
    points: 16,
    patterns: ['младш', 'старш', 'безопасн', 'активност', 'переплат', 'без толпы', 'вход в море', 'сюрприз', 'депозит', 'риф', 'конкурент']
  },
  {
    key: 'alternatives',
    label: 'Вилка альтернатив',
    points: 14,
    patterns: ['вариант', 'альтернатив', '2 отел', '3 отел', 'вилка', 'дороже', 'дешевле', 'комфортнее', 'безопаснее']
  },
  {
    key: 'processValue',
    label: 'Ценность агента',
    points: 12,
    patterns: ['сопровожд', 'проверю', 'сравн', 'подбер', 'источник', 'актуальн', 'помогу', 'свеж']
  },
  {
    key: 'nextStep',
    label: 'Конкретный следующий шаг',
    points: 14,
    patterns: ['созвон', 'бронь', 'предоплат', 'зафикс', 'отправлю', '10 минут', 'следующий шаг', 'сегодня', 'вечером']
  },
  {
    key: 'humanTone',
    label: 'Человеческий тон',
    points: 6,
    patterns: ['понимаю', 'давайте', 'сразу', 'спокойно', 'по-честному', 'коротко', 'понял']
  }
];

const dangerousPromisePhrases = ['гарантирую', 'точно понравится', 'без проблем', 'идеально', '100%', 'лучший отель'];
const vaguePhrases = ['хороший отель', 'вам понравится', 'посмотрим', 'подберем', 'подберём', 'всё будет', 'нормальный вариант'];
const fillerOnlyWords = ['бюджет', 'риск', 'варианты', 'созвон', 'дети', 'честно', 'проверю', 'отзывы', 'цена', 'бронь'];

function uniqueHits(text, patterns) {
  return patterns.filter((pattern) => text.includes(pattern));
}

function countSentences(text) {
  return text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean).length;
}

function isKeywordStuffing(normalized) {
  const words = normalized.replace(/[.,!?;:()«»“”]/g, ' ').split(/\s+/).filter(Boolean);
  const fillerHits = fillerOnlyWords.filter((word) => normalized.includes(word)).length;
  const hasConnectiveLogic = ['потому', 'поэтому', 'если', 'либо', 'значит', 'для вас', 'в вашем случае'].some((p) => normalized.includes(p));
  return words.length <= 14 && fillerHits >= 6 && !hasConnectiveLogic;
}

function detectsRealContext(normalized) {
  return ['младш', 'старш', 'безопасн', 'вход в море', 'без толпы', 'переплат', 'риф', 'депозит', 'стройк', 'конкурент'].some((p) => normalized.includes(p));
}

function hasConcreteNextStep(normalized) {
  const hasAction = ['созвон', 'отправлю', 'зафикс', 'бронь', 'перезвон', 'сегодня', 'вечером', '10 минут'].some((p) => normalized.includes(p));
  const hasSpecificity = /\d/.test(normalized) || ['сегодня', 'вечером', 'после', 'до ', 'завтра'].some((p) => normalized.includes(p));
  return hasAction && hasSpecificity;
}

export function getScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

export function evaluateAgentReply(text = '') {
  const normalized = text.toLowerCase().trim();
  const keywordStuffingPenalty = isKeywordStuffing(normalized) ? 38 : 0;
  const detected = [];
  const details = rubric.map((item) => {
    const hits = uniqueHits(normalized, item.patterns);
    const earned = keywordStuffingPenalty ? 0 : hits.length ? item.points : 0;
    if (earned) detected.push(item.key);
    return { key: item.key, label: item.label, earned, max: item.points, hits };
  });

  const dangerousPromisePenalty = dangerousPromisePhrases.some((phrase) => normalized.includes(phrase)) ? 14 : 0;
  const vaguePenalty = vaguePhrases.some((phrase) => normalized.includes(phrase)) && !detectsRealContext(normalized) ? 14 : 0;
  const noQuestionPenalty = !/[?]/.test(text) && !normalized.includes('уточн') ? 6 : 0;
  const noConcreteNextStepPenalty = !hasConcreteNextStep(normalized) ? 10 : 0;
  const depthBonus = normalized.length > 220 && countSentences(normalized) >= 3 && detectsRealContext(normalized) ? 8 : normalized.length > 120 ? 4 : 0;

  const rawScore = details.reduce((sum, item) => sum + item.earned, 0) + depthBonus - keywordStuffingPenalty - dangerousPromisePenalty - vaguePenalty - noQuestionPenalty - noConcreteNextStepPenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  const verdict = score >= 78
    ? 'Готово к реальному клиенту'
    : score >= 52
      ? 'Нормально, но нужен дожим'
      : keywordStuffingPenalty
        ? 'слишком поверхностно: слова есть, мышления нет'
        : 'Высокий риск слить заявку';

  const missed = details.filter((item) => item.earned === 0).map((item) => item.label);

  return {
    score,
    verdict,
    detected,
    details,
    missed,
    corpusSignals: buildCorpusSignals(normalized),
    penalties: {
      keywordStuffing: keywordStuffingPenalty,
      dangerousPromise: dangerousPromisePenalty,
      vague: vaguePenalty,
      noQuestion: noQuestionPenalty,
      noConcreteNextStep: noConcreteNextStepPenalty
    },
    advice: buildAdvice(detected, { keywordStuffingPenalty, dangerousPromisePenalty, vaguePenalty, noConcreteNextStepPenalty })
  };
}

function buildCorpusSignals(normalized) {
  const signals = [];
  if (!normalized.includes('бюджет') && !normalized.includes('цен')) signals.push('Корпус: после цены/бюджета без объяснения клиенты часто остывают.');
  if (!['вариант', 'альтернатив', 'вилка'].some((p) => normalized.includes(p))) signals.push('Корпус: отсутствие 2–3 альтернатив — частый триггер молчания.');
  if (!hasConcreteNextStep(normalized)) signals.push('Корпус: без точного следующего шага клиент уходит в “подумаю”.');
  if (!detectsRealContext(normalized)) signals.push('Корпус: реальный клиент раскрывает скрытую боль только после точной диагностики.');
  return signals;
}

function buildAdvice(detected, penalties) {
  const advice = [];
  if (penalties.keywordStuffingPenalty) advice.push('Не набивай ответ ключевыми словами. Нужна логика: что понял → какой компромисс → что проверишь → следующий шаг.');
  if (!detected.includes('diagnosis')) advice.push('Сначала добери вводные: дети, бюджет, даты, пляж, питание, что критично, что можно уступить.');
  if (!detected.includes('contextReading')) advice.push('Покажи, что понял скрытую боль клиента: безопасность детей, страх переплаты, риск плохих отзывов или сюрпризов.');
  if (!detected.includes('riskHonesty')) advice.push('Добавь честное предупреждение по рискам, иначе клиент получит завышенные ожидания.');
  if (!detected.includes('alternatives')) advice.push('Дай вилку из 2–3 вариантов: “в бюджет”, “комфортнее”, “безопаснее”.');
  if (penalties.noConcreteNextStepPenalty) advice.push('Закрывай на конкретный следующий шаг с временем/действием, иначе по корпусу клиент часто замолкает.');
  if (penalties.dangerousPromisePenalty) advice.push('Не давай гарантий в стиле “точно понравится” — лучше “проверю по источникам и предупрежу о рисках”.');
  if (penalties.vaguePenalty) advice.push('“Хороший вариант” без фактов звучит как реклама. Добавь причины, минусы и проверку источников.');
  return advice.length ? advice : ['Хороший ответ: есть диагностика, честность, контекст, альтернатива и следующий шаг.'];
}

export function getNextClientReply(scenarioId, agentText = '', turn = 1) {
  const scenario = getScenarioById(scenarioId);
  const evalResult = evaluateAgentReply(agentText);
  const lower = agentText.toLowerCase();

  if (evalResult.score < 45 || evalResult.penalties.keywordStuffing || evalResult.penalties.vague) {
    return 'Вы сейчас общими словами отвечаете. А мне важно понять: в наш бюджет это реально или нет? И плохие отзывы вы проверяли?';
  }

  if (!lower.includes('бюджет') && !lower.includes('цен')) {
    return 'Хорошо, но вы не сказали по бюджету. Я не хочу потом получить вариант на 250 тысяч вместо 180.';
  }

  if (!detectsRealContext(lower) && scenario.clientProfile.children.length) {
    return 'А детям там точно будет нормально? Младшему 2 года, старшему 11 — это вообще разные потребности.';
  }

  if (!evalResult.detected.includes('riskHonesty')) {
    return 'А какие минусы у этих вариантов? Мне не нужен рекламный текст, я хочу знать, где может быть подвох.';
  }

  if (!hasConcreteNextStep(lower)) {
    return 'Допустим. А что дальше конкретно — когда вы пришлёте варианты и как мы не потеряем цену?';
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
