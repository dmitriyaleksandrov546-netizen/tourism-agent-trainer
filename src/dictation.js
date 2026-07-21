const punctuationMap = [
  [/(^|\s)точка(?=\s|$)/gi, '$1.'],
  [/(^|\s)запятая(?=\s|$)/gi, '$1,'],
  [/(^|\s)вопросительный знак(?=\s|$)/gi, '$1?'],
  [/(^|\s)восклицательный знак(?=\s|$)/gi, '$1!'],
  [/(^|\s)двоеточие(?=\s|$)/gi, '$1:'],
  [/(^|\s)тире(?=\s|$)/gi, '$1—']
];

const fillerWords = /(^|\s)(ээ+|эм+|ну типа|как бы|короче|значит)(?=\s|$)/gi;

export function cleanDictationText(text = '') {
  let result = text
    .replace(fillerWords, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of punctuationMap) {
    result = result.replace(pattern, replacement);
  }

  result = result
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])(\S)/g, '$1 $2')
    .replace(/\s+—\s+/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();

  return capitalizeSentences(result);
}

export function capitalizeSentences(text = '') {
  return text.replace(/(^|[.!?]\s+)([а-яёa-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

export function appendDictation(currentText = '', transcript = '') {
  const cleaned = cleanDictationText(transcript);
  if (!cleaned) return currentText;
  if (!currentText.trim()) return cleaned;
  return `${currentText.trim()} ${cleaned}`;
}
