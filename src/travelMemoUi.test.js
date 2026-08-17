import { describe, expect, it } from 'vitest';
import { buildFreshSourcesTooltip, buildIntegratedMemoRows, formatClientContext } from './travelMemoUi.js';

describe('travel memo UI helpers', () => {
  it('moves source list into info tooltip instead of monitoring explanation copy', () => {
    const tooltip = buildFreshSourcesTooltip({
      sourceNotes: ['МИД/консульский источник Турции', 'Посольство/консульство Турции'],
      sourcePolicy: 'Мониторинг нужен не вместо памятки, а чтобы подсветить изменения.'
    });

    expect(tooltip).toContain('МИД/консульский источник Турции');
    expect(tooltip).toContain('Посольство/консульство Турции');
    expect(tooltip).not.toContain('Мониторинг нужен не вместо памятки');
  });

  it('combines ready memo rows with right-side checkboxes', () => {
    const rows = buildIntegratedMemoRows({
      country: 'Египет',
      readyItems: [
        { label: 'Виза', text: 'для граждан РФ обычно нужна' },
        { label: 'Загранпаспорт', text: 'проверить срок действия минимум 6 месяцев' },
        { label: 'Не нужно', text: 'не чекать как действие' }
      ],
      checks: [{ id: 'old-1', text: 'Виза: определить режим въезда.' }]
    });

    expect(rows).toEqual([
      { id: 'memo-Египет-виза', label: 'Виза', text: 'для граждан РФ обычно нужна', checkable: true },
      { id: 'memo-Египет-загранпаспорт', label: 'Загранпаспорт', text: 'проверить срок действия минимум 6 месяцев', checkable: true },
      { id: 'memo-Египет-не-нужно', label: 'Не нужно', text: 'не чекать как действие', checkable: false }
    ]);
  });

  it('capitalizes compact client context line', () => {
    expect(formatClientContext('пара · до 120 000 ₽')).toBe('Пара · до 120 000 ₽');
    expect(formatClientContext('2 взрослых + 2 ребёнка · дети: 2 года')).toBe('2 взрослых + 2 ребёнка · дети: 2 года');
  });
});
