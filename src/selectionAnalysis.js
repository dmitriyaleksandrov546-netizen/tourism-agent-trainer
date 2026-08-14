import { getScenarioById } from './simulatorEngine.js';

const MAX_SELECTION_CHARS = 12000;
const urlPattern = /^https?:\/\//i;

export function normalizeSelectionInput(input = '') {
  const normalized = String(input).trim();
  if (!normalized) throw new Error('selection content is required');
  return normalized.slice(0, MAX_SELECTION_CHARS);
}

export function isSelectionUrl(input = '') {
  return urlPattern.test(String(input).trim());
}

export function buildSelectionAnalysisPrompt({ scenarioId = 'turkey-family-hard', selectionInput = '', fetchedText = '', fetchError = '' }) {
  const scenario = getScenarioById(scenarioId);
  const normalizedInput = normalizeSelectionInput(selectionInput);
  const realContent = [normalizedInput, fetchedText && `Текст, который удалось открыть по ссылке:\n${String(fetchedText).slice(0, MAX_SELECTION_CHARS)}`]
    .filter(Boolean)
    .join('\n\n');

  return {
    system: [
      'Ты играешь роль реального туриста/клиента в тренажёре турагента.',
      'Ты анализируешь реальную подборку, которую прислал менеджер: ссылку, текст, названия отелей и доступный текст страницы.',
      'КРИТИЧНО: не выдумывай отели, отзывы, звёзды, страну или удобства. Используй только то, что есть во входных данных.',
      'Если ссылка недоступна или данных мало — прямо скажи, что не смог(ла) проверить подборку, и попроси менеджера прислать текст/скрин/названия отелей.',
      'Если данные есть — сравни подборку с критериями клиента: страна, отель, звёзды, удобства, бюджет, пляж/дети/питание, компромиссы.',
      'Отзывы оценивай только если во входных данных есть сигналы Яндекс/Tripadvisor или менеджер их явно указал. Иначе попроси проверить отзывы там.',
      'Верни JSON без markdown: {"qualityScore":number,"criteria":string[],"gaps":string[],"clientReply":string,"managerTask":string,"source":"live-selection-analysis"}'
    ].join('\n'),
    user: [
      `Сценарий: ${scenario.title}`,
      `Критерии клиента: ${scenario.clientProfile.budget}; ${scenario.clientProfile.hiddenNeed}; ${scenario.clientProfile.trigger}`,
      `Семья/контекст: ${scenario.clientProfile.name}, ${scenario.clientProfile.family}`,
      '',
      'Реальная подборка от менеджера:',
      realContent,
      '',
      fetchError ? `Ошибка открытия ссылки: ${fetchError}` : '',
      '',
      'Сформируй реакцию клиента после просмотра этой реальной подборки.'
    ].filter((line) => line !== '').join('\n')
  };
}

export function normalizeSelectionAnalysis(raw = {}) {
  const qualityScore = Number.isFinite(Number(raw.qualityScore)) ? Math.max(0, Math.min(100, Number(raw.qualityScore))) : 45;
  return {
    phase: 'selection-review',
    qualityScore,
    criteria: Array.isArray(raw.criteria) ? raw.criteria.map(String).slice(0, 10) : [],
    gaps: Array.isArray(raw.gaps) ? raw.gaps.map(String).slice(0, 8) : [],
    clientReply: String(raw.clientReply || '').trim().slice(0, 1200),
    managerTask: String(raw.managerTask || 'Разобрать реальную подборку, не имитировать анализ.').trim().slice(0, 500),
    source: raw.source || 'selection-analysis'
  };
}

export function createSelectionAnalysisFallback({ scenarioId = 'turkey-family-hard', selectionInput = '', fetchError = '' }) {
  const scenario = getScenarioById(scenarioId);
  const input = normalizeSelectionInput(selectionInput);
  const looksLikeUrlOnly = isSelectionUrl(input) && input.split(/\s+/).length <= 2;
  if (looksLikeUrlOnly && fetchError) {
    return normalizeSelectionAnalysis({
      qualityScore: 35,
      criteria: [scenario.clientProfile.budget, scenario.clientProfile.hiddenNeed],
      gaps: ['Подборка не проанализирована: ссылка недоступна или нет текста/названий отелей.'],
      clientReply: `Я не смогла открыть подборку по ссылке и реально проверить отели. Пришлите, пожалуйста, текст подборки, скрин или хотя бы названия отелей со звёздами, страной, удобствами и отзывами — тогда я смогу понять, подходит ли это под наш запрос.`,
      managerTask: 'Не засчитывать отправку ссылки как анализ. Нужно прислать доступную подборку или текст вариантов.',
      source: 'selection-analysis-fallback'
    });
  }

  return normalizeSelectionAnalysis({
    qualityScore: 55,
    criteria: [scenario.clientProfile.budget, scenario.clientProfile.hiddenNeed],
    gaps: ['Есть текст подборки, но отзывы/источники и часть критериев нужно проверить вручную.'],
    clientReply: `Я вижу подборку, но по ней пока не хватает проверки отзывов и явного сравнения с нашим запросом. Скажите, какие из этих вариантов реально закрывают бюджет, пляж/детей/питание, и где есть компромисс.`,
    managerTask: 'Разобрать присланный текст подборки по критериям и отдельно проверить отзывы Яндекс/Tripadvisor.',
    source: 'selection-analysis-fallback'
  });
}
