const nonCheckableLabels = new Set(['не нужно', 'нужно подготовить', 'проверить отдельно']);

function normalizeIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildFreshSourcesTooltip(checklist = {}) {
  return Array.isArray(checklist.sourceNotes)
    ? checklist.sourceNotes.filter(Boolean).join('\n')
    : '';
}

export function buildIntegratedMemoRows(checklist = {}) {
  const country = checklist.country || 'страна';
  return (checklist.readyItems || []).map((item) => {
    const label = item.label || '';
    return {
      id: `memo-${country}-${normalizeIdPart(label)}`,
      label,
      text: item.text || '',
      checkable: !nonCheckableLabels.has(label.trim().toLowerCase())
    };
  });
}

export function formatClientContext(value = '') {
  return String(value).replace(/^\p{Ll}/u, (letter) => letter.toLocaleUpperCase('ru-RU'));
}
