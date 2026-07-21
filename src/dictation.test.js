import { describe, expect, it } from 'vitest';
import { appendDictation, cleanDictationText } from './dictation.js';

describe('dictation cleanup', () => {
  it('removes filler words and converts spoken punctuation', () => {
    expect(cleanDictationText('эээ давайте проверим депозит запятая пляж и стройку вопросительный знак')).toBe('Давайте проверим депозит, пляж и стройку?');
  });

  it('appends cleaned transcript to current draft', () => {
    expect(appendDictation('Проверю отель.', 'короче пришлю варианты точка')).toBe('Проверю отель. Пришлю варианты.');
  });
});
