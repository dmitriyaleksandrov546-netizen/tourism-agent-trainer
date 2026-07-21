import { getNextClientReply, getScenarioById } from './simulatorEngine.js';

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

function extractMentionedConcerns(text = '') {
  const normalized = text.toLowerCase();
  const concerns = [
    ['депозит', 'депозит'],
    ['пляж', 'пляж'],
    ['стройк', 'стройку рядом'],
    ['питани', 'питание'],
    ['трансфер', 'трансфер'],
    ['бюджет', 'бюджет'],
    ['цен', 'цену'],
    ['отзыв', 'отзывы'],
    ['дет', 'детей'],
    ['номер', 'номер'],
    ['источник', 'источники проверки']
  ];
  return concerns.filter(([needle]) => normalized.includes(needle)).map(([, label]) => label);
}

export function createFallbackReply(scenarioId, agentText = '', turn = 1, history = []) {
  if (containsAbuse(agentText)) {
    if (countRudeAgentMessages(history) > 0) {
      return {
        text: 'Слушайте, второй раз такой тон — мне это неприятно. Если мы дальше без мата и по делу, я готова продолжить. Если нет, я лучше пойду к другому агенту.',
        source: 'local-fallback',
        risk: 'repeated-abusive-tone'
      };
    }

    const concerns = extractMentionedConcerns(agentText);
    const concretePart = concerns.length
      ? `Я услышала про ${concerns.slice(0, 3).join(', ')}. Тогда скажите конкретно: что вы проверите, по каким источникам и где там может быть риск?`
      : 'Но по сути вопроса я пока не поняла конкретику. Что именно вы проверите и какой риск для меня как клиента?';

    return {
      text: `Ок, только давайте без мата — я всё-таки клиент, а не коллега в курилке. ${concretePart}`,
      source: 'local-fallback',
      risk: 'abusive-tone'
    };
  }

  return {
    text: getNextClientReply(scenarioId, agentText, turn, history),
    source: 'local-fallback',
    risk: null
  };
}

export function buildNeuroclientPrompt({ scenarioId, agentText, turn = 1, history = [] }) {
  const scenario = getScenarioById(scenarioId);
  const hotelFacts = scenario.hotelContext
    .map((hotel) => `- ${hotel.name}: подходит: ${hotel.fit}; риск: ${hotel.risk}; уверенность: ${hotel.confidence}; источник: ${hotel.source}`)
    .join('\n');
  const conversation = history
    .map((message) => `${message.role === 'agent' ? 'Турагент' : 'Клиент'}: ${message.text}`)
    .join('\n');

  return {
    system: [
      'Ты играешь роль реального туриста/клиента в тренажёре для нового турагента.',
      'Ты НЕ ассистент, НЕ преподаватель и НЕ оценщик. Ты живой человек со своими страхами, раздражением, сомнениями, семьёй, бюджетом и ожиданиями.',
      'Понимай смысл ответа агента, реагируй естественно и продолжай диалог одним сообщением от лица клиента.',
      'Если агент впервые грубит, матерится, давит или обесценивает клиента — сначала поставь мягкую границу, но всё равно пойми полезную часть его ответа и продолжи по сути. Не обрубай диалог сразу.',
      'Останавливай разговор/угрожай уйти только если грубость повторяется или агент полностью игнорирует просьбу общаться нормально.',
      'Если агент отвечает общими фразами — требуй конкретику: даты, бюджет, риски, источники, что именно проверено.',
      'Если агент обещает невозможное или гарантирует без источника — усомнись и попроси честный риск.',
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
      '',
      'Факты по отелям, которыми можно пользоваться:',
      hotelFacts,
      '',
      'История диалога:',
      conversation || '(пока только старт сценария)',
      '',
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
