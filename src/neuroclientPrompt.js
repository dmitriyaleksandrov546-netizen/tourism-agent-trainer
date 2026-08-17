import { getNextClientReply, getScenarioById } from './simulatorEngine.js';

const abusePatterns = ['блять', 'бляд', 'сука', 'нахуй', 'хуй', 'пизд', 'еба', 'ёба', 'заеб', 'мудак', 'идиот'];

export function containsAbuse(text = '') {
  const normalized = text.toLowerCase();
  return abusePatterns.some((pattern) => normalized.includes(pattern));
}

function countRudeAgentMessages(history = []) {
  return history.filter((message) => message.role === 'agent' && containsAbuse(message.text)).length;
}

function createSelectionReviewFallback(_scenarioId, selectionAnalysis = null) {
  if (!selectionAnalysis?.clientReply) {
    return 'Я пока не видела саму подборку. Пришлите ссылку, текст или названия отелей — без этого я не могу честно оценить страну, звёзды, удобства, отзывы и компромиссы.';
  }
  return `${selectionAnalysis.clientReply} Мне нужен не просто новый список отелей, а понятный вывод: что оставляем, что меняем и почему. Если компромисс оправдан — объясните его коротко, если нет — лучше замените вариант.`;
}

export function createFallbackReply(scenarioId, agentText = '', turn = 1, history = [], options = {}) {
  if (options.phase === 'selection-review') {
    return { text: createSelectionReviewFallback(scenarioId, options.selectionAnalysis), source: 'local-fallback', risk: 'selection-review-needs-manager-decision' };
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

  return {
    text: getNextClientReply(scenarioId, agentText, turn, history),
    source: 'local-fallback',
    risk: null
  };
}

export function buildNeuroclientPrompt({ scenarioId, agentText, turn = 1, history = [], phase = 'dialogue', selectionAnalysis = null }) {
  const scenario = getScenarioById(scenarioId);
  const analysis = selectionAnalysis || null;
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
      'Если агент отвечает общими словами и не берёт обязательство — мягко дави на конкретный бюджет, риски, отзывы, источники или следующий шаг.',
      'Если агент честно объясняет компромисс и фиксирует следующий шаг — соглашайся.',
      'КРИТИЧНО: если агент написал, что пришлёт подборку/варианты/сравнение в конкретный срок или сегодня, НЕ кошмарь его новыми вопросами в этот же момент. Ответь коротко: “Хорошо, жду до <срок>. Если что-то не проходит по бюджету/рискам — напишите сразу”.',
      'Не требуй конкретные отели, отзывы и источники сразу после того, как агент пообещал их проверить и прислать. До истечения обещанного срока нормальный клиент ждёт.',
      'Повторно доёбываться можно только если по истории видно, что агент уже сорвал обещанный срок или прислал подборку без обещанных деталей.',
      'Если агент грубит или матерится — сразу ставь границу и прекращай нормальный тон.',
      'Если этап selection-review: ты уже открыл(а) ссылку на подборку, сравнил(а) отели с исходным запросом, прочитал(а) отзывы на Яндексе и Tripadvisor и теперь ждёшь от менеджера вывод: что оставить, что заменить, какие компромиссы допустимы и какой следующий шаг.',
      'На этапе selection-review оценивай не факт отправки ссылки, а качество подборки: страна, название отеля, звёзды, удобства, бюджет, отзывы и объяснение компромисса.',
      'Не выдумывай факты об отелях. Если факта нет — спрашивай, как агент это проверит.',
      'Пиши по-русски, разговорно, 1–3 коротких абзаца. Без списков, без оценки балла, без советов агенту.'
    ].join('\n'),
    user: [
      `Сценарий: ${scenario.title}`,
      `Тип клиента: ${scenario.clientProfile.name}, ${scenario.clientProfile.family}`,
      `Бюджет: ${scenario.clientProfile.budget}`,
      scenario.simulatedToday ? `Текущая дата в сценарии: ${scenario.simulatedToday.label}` : '',
      scenario.simulatedToday ? `Рыночный контекст на эту дату: ${scenario.simulatedToday.marketContext}` : '',
      scenario.simulatedToday ? `Задача для подбора по текущей дате: ${scenario.simulatedToday.selectionTrainingFocus}` : '',
      `Скрытая настоящая потребность: ${scenario.clientProfile.hiddenNeed}`,
      `Триггер/страх: ${scenario.clientProfile.trigger}`,
      `Ход диалога: ${turn}`,
      `Этап: ${phase}`,
      '',
      'Источники методики/корпуса:',
      sourceRefs,
      '',
      'История диалога:',
      conversation || '(пока только старт сценария)',
      '',
      ...(analysis ? [
        'Анализ подборки после ссылки:',
        `Критерии клиента: ${analysis.criteria.join(', ')}`,
        `Оценка качества подборки: ${analysis.qualityScore}/100`,
        `Проблемы: ${analysis.gaps.join(' ') || 'критичных проблем нет'}`,
        `Текущая реакция клиента: ${analysis.clientReply}`,
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
