import { describe, expect, it } from 'vitest';
import {
  buildMonitoringReport,
  compareSourceSnapshots,
  normalizeSourceText,
  getTravelDocumentSources
} from './travelDocumentMonitoring.js';

describe('travelDocumentMonitoring', () => {
  it('normalizes noisy official source text before hashing and diffing', () => {
    expect(normalizeSourceText('<h1>Visa</h1>\n\n Updated: today   <script>x()</script>')).toBe('Visa Updated: today');
  });

  it('detects changed, unchanged and new official source snapshots', () => {
    const current = [
      { id: 'embassy', title: 'Посольство', url: 'https://example.com/visa', status: 'ok', fingerprint: 'aaa', excerpt: 'new visa text' },
      { id: 'operator', title: 'Оператор', url: 'https://example.com/memo', status: 'ok', fingerprint: 'bbb', excerpt: 'same memo' },
      { id: 'airline', title: 'Авиакомпания', url: 'https://example.com/air', status: 'ok', fingerprint: 'ccc', excerpt: 'new source' }
    ];
    const previous = [
      { id: 'embassy', fingerprint: 'old', excerpt: 'old visa text' },
      { id: 'operator', fingerprint: 'bbb', excerpt: 'same memo' }
    ];

    const compared = compareSourceSnapshots(current, previous);

    expect(compared.find((item) => item.id === 'embassy').changeStatus).toBe('changed');
    expect(compared.find((item) => item.id === 'operator').changeStatus).toBe('unchanged');
    expect(compared.find((item) => item.id === 'airline').changeStatus).toBe('new');
  });

  it('builds a manager-facing daily monitoring report and updated checklist', () => {
    const report = buildMonitoringReport({
      country: 'Турция',
      checkedAt: '2026-08-16T09:00:00.000Z',
      sources: [
        { id: 'mfa', title: 'МИД Турции', url: 'https://example.com', status: 'ok', fingerprint: '1', excerpt: 'Passport valid visa-free stay' }
      ],
      previousSnapshots: [{ id: 'mfa', fingerprint: '0', excerpt: 'Old passport rule' }]
    });

    expect(report.country).toBe('Турция');
    expect(report.status).toBe('changes-detected');
    expect(report.managerSummary).toContain('Найдены изменения');
    expect(report.checklist.some((item) => item.includes('официальный источник'))).toBe(true);
    expect(report.changes[0].before).toContain('Old passport rule');
  });

  it('keeps configured official source profiles per country', () => {
    const turkey = getTravelDocumentSources('Турция');

    expect(turkey.length).toBeGreaterThanOrEqual(2);
    expect(turkey.map((source) => source.type)).toContain('official');
    expect(turkey.every((source) => source.url.startsWith('https://'))).toBe(true);
  });
});
