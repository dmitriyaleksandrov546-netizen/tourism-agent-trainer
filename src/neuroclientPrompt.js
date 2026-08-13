import { analyzeSelectionLink, getNextClientReply, getScenarioById } from './simulatorEngine.js';

const abusePatterns = [
  'блять', 'бляд', 'сука', 'нахуй', 'хуй', 'пизд', 'еба', 'ёба', 'заеб', 'мудак', 'идиот'
];

export function containsAbuse(text = '') {
  const normalized = text.toLowerCase();
  return abusePatterns.some((pattern) => normalized.includes(pattern));
}

function countRudeAgentMessages(history = []) {
  return history.filter((message) => message.role === 'agent' && containsAbuse(message.text)).length;
}

export function isPoliteProcessReply(text = '') {
  const normalized = text.toLowerCase();
  const hasProcessPromise = ['подбер', 'посмотр', 'провер', 'пришлю', 'сейчас', 'вариант'].some((word) => normalized.includes(word));
  const hasPoliteTone = ['да', 'конечно', 'хорошо', 'понял', 'поняла', 'давайте', 'ок', 'окей'].some((word) => normalized.includes(word));
  return hasProcessPromise && hasPoliteTone && !containsAbuse(text);
}

function createPoliteProcessAcceptance(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  if (scenario.id === 'turkey-family-hard') {
    return 'Окей, хорошо, подождём. Посмотрите, пожалуйста, что реально проходит по бюджету, и лучше сразу 2–3 варианта: чтобы было понятно, где комфортнее, а где придётся на чём-то уступить.';
  }
  if (scenario.id === 'egypt-budget-objections') {
    return 'Хорошо, давайте посмотрим. Жду сравнение: чем ваш вариант отличается от того, что мне дали дешевле, и есть ли там какой-то подвох.';
  }
  if (scenario.id === 'uae-premium-anxious') {
    return 'Окей, хорошо, посмотрите. Я подожду, только мне потом важно увидеть без рекламных фраз: что проверено, где источник и есть ли риски по депозиту, пляжу или стройке.';
  }
  return 'Окей, хорошо, подожду. Посмотрите варианты и напишите, что реально подходит под мой запрос.';
}

function createSelectionReviewFallback(scenarioId, selectionAnalysis = null) {
  const analysis = selectionAnalysis || analyzeSelectionLink(scenarioId);
  return `${analysis.clientReply} Мне нужен не просто новый список отелей, а понятный вывод: что оставляем, что меняем и почему. Если компромисс оправдан — объясните его коротко, если нет — лучше замените вариант.`;
}

export function createFallbackReply(scenarioId, agentText = '', turn = 1, history = [], options = {}) {
  if (options.phase === 'selection-review') {
    return {
      text: createSelectionReviewFallback(scenarioId, options.selectionAnalysis),
      source: 'local-fallback',
      risk: 'selection-review-needs-manager-decision'
    };
  }

  if (containsAbuse(agentText)) {
    if (countRudeAgentMessages(history) > 0) {
      return {
        text: 'Стоп. Второй раз в таком тоне я общение не продолжаю. Если хотите помочь — напишите спокойно и без мата, иначе я обращусь к другому агенту.',
        source: 'local-fallback',
        risk: 'repeated-abusive-tone'
      };
    }

    return {
      text: 'Стоп, давайте без мата. В таком тоне я общение не продолжаю. Если хотите помочь — переформулируйте спокойно и по делу.',
      source: 'local-fallback',
      risk: 'abusive-tone'
    };
  }

  if (isPoliteProcessReply(agentText)) {
    return {
      text: createPoliteProcessAcceptance(scenarioId),
      source: 'local-fallback',
      risk: null
    };
  }

  return {
    text: getNextClientReply(scenarioId, agentText, turn, history),
    source: 'local-fallback',
    risk: null
  };
}

export function buildNeuroclientPrompt({ scenarioId, agentText, turn = 1, history = [], phase = 'dialogue', selectionAnalysis = null }) {
  const scenario = getScenarioById(scenarioId);
  const analysis = selectionAnalysis || (phase === 'selection-review' ? analyzeSelectionLink(scenarioId) : null);
  const hotelFacts = scenario.hotelContext
    .map((hotel) => `- ${hotel.name}: страна: ${hotel.country || scenario.direction}; звёзды: ${hotel.stars || 'не указано'}; подходит: ${hotel.fit}; риск: ${hotel.risk}; компромисс: ${hotel.compromise || 'не описан'}; Яндекс: ${hotel.yandexReviewSignal || 'нет сигнала'}; Tripadvisor: ${hotel.tripadvisorReviewSignal || 'нет сигнала'}; уверенность: ${hotel.confidence}; источник: ${hotel.source}`)
    .join('\n');
  const conversation = history
    .map((message) => `${message.role === 'agent' ? 'Турагент' : 'Клиент'}: ${message.text}`)
    .join('\n');

  return {
    system: [
      'Ты играешь роль реального туриста/клиента в тренажёре для нового турагента.',
      'На старте ты стандартный клиент: вежливый, нормальный, немного осторожный, но не токсичный и не нетерпеливый.',
      'Ты НЕ ассистент, НЕ преподаватель и НЕ оценщик. Ты живой человек со своими страхами, сомнениями, семьёй, бюджетом и ожиданиями.',
      'Понимай смысл ответа агента, реагируй естественно и продолжай диалог одним сообщением от лица клиента.',
      'Если агент вежливо говорит, что сейчас подберёт варианты, посмотрит или проверит — сначала согласись и подожди: “Окей, хорошо, жду/посмотрите”. Можно мягко добавить один важный ориентир, но не атакуй и не называй это общими фразами.',
      'Если агент впервые грубит, матерится, давит или обесценивает клиента — сразу поставь дистанцию: без мата, в таком тоне не продолжаю. Мат в клиентском общении неприемлем.',
      'Если агент отвечает совсем пусто и не предлагает понятный следующий шаг — мягко уточни, что именно он будет смотреть. Не прессуй на первом нормальном ответе.',
      'Если агент обещает невозможное или гарантирует без источника — спокойно усомнись и попроси честный риск.',
      'Если этап называется selection-review: ты уже открыл(а) ссылку на подборку, сравнил(а) отели с исходным запросом, прочитал(а) отзывы на Яндексе и Tripadvisor и теперь ждёшь от менеджера вывод: что оставить, что заменить, какие компромиссы допустимы и какой следующий шаг.',
      'На этапе selection-review оценивай не факт отправки ссылки, а качество подборки: страна, название отеля, звёзды, удобства, бюджет, отзывы, объяснение компромисса.',
      'Не выдумывай факты об отелях вне переданного контекста. Если факта нет — спрашивай, как агент это проверит.',
      'Пиши по-русски, разговорно, без канцелярита. 1–3 коротких абзаца. Без списков, без оценки балла, без советов агенту.'
    ].join('\n'),
    user: [
      `Сценарий: ${scenario.title}`,
      `Тип клиента: ${scenario.clientProfile.name}, ${scenario.clientProfile.family}`,
      `Бюджет: ${scenario.clientProfile.budget}`,
      `Скрытая настоящая потребность: ${scenario.clientProfile.hiddenNeed}`,
      `Триггер/страх: ${scenario.clientProfile.trigger}`,
      `Ход диалога: ${turn}`,
      `Этап: ${phase}`,
      '',
      'Факты по отелям, которыми можно пользоваться:',
      hotelFacts,
      '',
      'История диалога:',
      conversation || '(пока только старт сценария)',
      '',
      ...(analysis ? [
        'Анализ подборки после ссылки:',
        `Критерии клиента: ${analysis.criteria.join(', ')}`,
        `Оценка качества подборки: ${analysis.qualityScore}/100`,
        `Проблемы: ${analysis.gaps.join(' ') || 'критичных проблем нет'}`,
        `Твоя текущая реакция как клиента: ${analysis.clientReply}`,
        ''
      ] : []),
      `Последний ответ турагента: ${agentText}`,
      '',
      'Ответь только как клиент. Не объясняй правила тренажёра.'
    ].join('\n')
  };
}

export function normalizeClientReply(text = '') {
  return text
    .replace(/^\s*(клиент|нейроклиент|турист)\s*[:—-]\s*/i, '')
    .split(/\n\s*(оценка|разбор|score|совет)\s*[:：]/i)[0]
    .trim()
    .slice(0, 900);
}
