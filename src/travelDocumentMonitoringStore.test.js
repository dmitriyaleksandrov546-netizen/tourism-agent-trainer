import { describe, expect, it } from 'vitest';
import { checkTravelDocumentSourcesWithSnapshotStore } from './travelDocumentMonitoring.js';

describe('travelDocumentMonitoring snapshot store integration', () => {
  it('uses saved server snapshots for scheduled daily diff and persists the new baseline', async () => {
    const calls = [];
    const saved = [];
    const snapshotStore = {
      async loadSnapshots(country) {
        calls.push(['load', country]);
        return [{ id: 'turkey-mfa-visa', fingerprint: 'old', excerpt: 'Old visa rule' }];
      },
      async saveSnapshots(country, snapshots, report) {
        saved.push({ country, snapshots, status: report.status });
      }
    };

    const report = await checkTravelDocumentSourcesWithSnapshotStore({
      country: 'Турция',
      snapshotStore,
      checkedAt: '2026-08-17T05:00:00.000Z',
      fetchText: async (url) => url.includes('mfa.gov.tr') ? '<h1>New visa rule</h1>' : '<p>Embassy baseline</p>'
    });

    expect(calls).toEqual([['load', 'Турция']]);
    expect(report.status).toBe('changes-detected');
    expect(report.changes[0].before).toContain('Old visa rule');
    expect(report.persistence).toEqual({ provider: 'server-snapshot-store', saved: true });
    expect(saved).toHaveLength(1);
    expect(saved[0].country).toBe('Турция');
    expect(saved[0].snapshots.length).toBeGreaterThanOrEqual(2);
    expect(saved[0].status).toBe('changes-detected');
  });

  it('lets explicit client snapshots override the server store for manual checks', async () => {
    const snapshotStore = {
      async loadSnapshots() {
        throw new Error('store should not be loaded when explicit snapshots are provided');
      },
      async saveSnapshots() {}
    };

    const report = await checkTravelDocumentSourcesWithSnapshotStore({
      country: 'Турция',
      previousSnapshots: [{ id: 'turkey-mfa-visa', fingerprint: 'manual-old', excerpt: 'Manual old text' }],
      snapshotStore,
      checkedAt: '2026-08-17T05:00:00.000Z',
      fetchText: async () => '<h1>Manual new text</h1>'
    });

    expect(report.status).toBe('changes-detected');
    expect(report.changes[0].before).toContain('Manual old text');
  });

  it('falls back to one-off monitoring when the server snapshot table is not ready', async () => {
    const snapshotStore = {
      async loadSnapshots() {
        throw new Error('Could not find the table travel_document_snapshots');
      },
      async saveSnapshots() {
        throw new Error('save should not be required when load failed');
      }
    };

    const report = await checkTravelDocumentSourcesWithSnapshotStore({
      country: 'Турция',
      snapshotStore,
      checkedAt: '2026-08-17T05:00:00.000Z',
      fetchText: async () => '<h1>Baseline text</h1>'
    });

    expect(report.ok).toBe(true);
    expect(report.status).toBe('baseline-created');
    expect(report.persistence).toEqual({
      provider: 'server-snapshot-store',
      saved: false,
      error: 'Could not find the table travel_document_snapshots'
    });
  });

});
