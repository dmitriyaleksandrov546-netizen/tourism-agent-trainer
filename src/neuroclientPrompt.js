import { getNextClientReply, getScenarioById } from './simulatorEngine.js';

const abusePatterns = ['блять', 'бляд', 'сука', 'нахуй', 'хуй', 'пизд', 'еба', 'ёба', 'заеб', 'мудак', 'идиот'];

export function containsAbuse(text = '') {
  const normalized = text.toLowerCase();
  return abusePatterns.some((pattern) => normalized.includes(pattern));
}

function countRudeAgentMessages(history = []) {
  return history.filter((message) => message.role === 'agent' && containsAbuse(message.text)).length;
}

export function createFallbackReply(scenarioId, agentText = '', turn = 1, history = []) {
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

  return {
    text: getNextClientReply(scenarioId, agentText, turn, history),
    source: 'local-fallback',
    risk: null
  };
}

export function buildNeuroclientPrompt({ scenarioId, agentText, turn = 1, history = [] }) {
  const scenario = getScenarioById(scenarioId);
  const sourceRefs = scenario.sourceRefs
    .map((ref) => `- ${ref.sourceType}: ${ref.path}; confidence: ${ref.confidence}`)
    .join('\n');
  const conversation = history
    .map((message) => `${message.role === 'agent' ? 'Турагент' : 'Клиент'}: ${message.text}`)
    .join('\n');

  return {
    system: [
      'Ты играешь роль реального туриста/клиента в тренажёре для нового турагента.',
      'Ты НЕ ассистент, НЕ преподаватель и НЕ оценщик. Ты живой человек со страхами, бюджетом и ожиданиями.',
      'Реагируй на смысл ответа агента, историю диалога и сценарий. Не повторяй предыдущую фразу клиента.',
      'Если агент отвечает общими словами — дави на конкретный бюджет, риски, отзывы, источники или следующий шаг.',
      'Если агент честно объясняет компромисс и фиксирует следующий шаг — соглашайся и проси 2–3 варианта.',
      'Если агент грубит или матерится — сразу ставь границу и прекращай нормальный тон.',
      'Не выдумывай факты об отелях. Если факта нет — спрашивай, как агент это проверит.',
      'Пиши по-русски, разговорно, 1–3 коротких абзаца. Без списков, без оценки балла, без советов агенту.'
    ].join('\n'),
    user: [
      `Сценарий: ${scenario.title}`,
      `Тип клиента: ${scenario.clientProfile.name}, ${scenario.clientProfile.family}`,
      `Бюджет: ${scenario.clientProfile.budget}`,
      `Скрытая настоящая потребность: ${scenario.clientProfile.hiddenNeed}`,
      `Триггер/страх: ${scenario.clientProfile.trigger}`,
      `Ход диалога: ${turn}`,
      '',
      'Источники методики/корпуса:',
      sourceRefs,
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
