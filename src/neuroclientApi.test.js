import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestNeuroclientReply } from './neuroclientApi.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...import.meta.env };

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  Object.keys(import.meta.env).forEach((key) => {
    if (!(key in originalEnv)) delete import.meta.env[key];
  });
  Object.assign(import.meta.env, originalEnv);
});

describe('requestNeuroclientReply', () => {
  it('uses the configured backend url instead of hardcoded same-origin api', async () => {
    import.meta.env.VITE_NEUROCLIENT_API_URL = 'https://trainer-api.example.com/api/neuroclient';
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ text: 'Хорошо, жду варианты.', source: 'openai' })
    }));
    globalThis.fetch = fetchMock;

    const reply = await requestNeuroclientReply({
      scenarioId: 'turkey-family-hard',
      agentText: 'Сейчас проверю варианты.',
      turn: 1,
      history: []
    });

    expect(fetchMock).toHaveBeenCalledWith('https://trainer-api.example.com/api/neuroclient', expect.objectContaining({ method: 'POST' }));
    expect(reply.source).toBe('openai');
  });

  it('falls back locally when backend is unavailable', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('network down'); });

    const reply = await requestNeuroclientReply({
      scenarioId: 'turkey-family-hard',
      agentText: 'Подберу вариант.',
      turn: 1,
      history: []
    });

    expect(reply.text).toBeTruthy();
    expect(reply.source).toBe('client-local-fallback');
    expect(reply.error).toContain('network down');
  });
});
