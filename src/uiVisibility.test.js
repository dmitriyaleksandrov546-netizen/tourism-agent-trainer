import { describe, expect, it } from 'vitest';
import { shouldRenderAnswerReview } from './uiVisibility.js';

describe('UI visibility flags', () => {
  it('keeps answer review panel hidden while the feature is paused', () => {
    expect(shouldRenderAnswerReview({ score: 80 })).toBe(false);
    expect(shouldRenderAnswerReview(null)).toBe(false);
  });
});
