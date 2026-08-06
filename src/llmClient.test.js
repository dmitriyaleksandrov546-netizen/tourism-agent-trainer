import { afterEach, describe, expect, it, vi } from 'vitest';
import { callConfiguredLlm, getLlmConfig, getPublicLlmStatus } from './llmClient.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('llmClient', () => {
  it('defaults to OpenAI-compatible config without exposing the key publicly', () => {
    const env = { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-test' };

    expect(getLlmConfig(env)).toMatchObject({
      provider: 'openai',
      configured: true,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-test',
      endpoint: 'https://api.openai.com/v1/chat/completions'
    });
    expect(getPublicLlmStatus(env)).toEqual({
      provider: 'openai',
      configured: true,
      model: 'gpt-test',
      mode: 'openai'
    });
    expect(getPublicLlmStatus(env)).not.toHaveProperty('apiKey');
  });

  it('supports OpenRouter and generic OpenAI-compatible providers', () => {
    expect(getLlmConfig({ OPENROUTER_API_KEY: 'or-key' })).toMatchObject({
      provider: 'openrouter',
      configured: true,
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4.1-mini'
    });

    expect(getLlmConfig({
      LLM_PROVIDER: 'custom',
      LLM_API_BASE: 'https://llm.example.com/v1/',
      LLM_API_KEY: 'custom-key',
      LLM_MODEL: 'custom-model'
    })).toMatchObject({
      provider: 'custom',
      configured: true,
      baseUrl: 'https://llm.example.com/v1',
      model: 'custom-model',
      endpoint: 'https://llm.example.com/v1/chat/completions'
    });
  });

  it('calls configured provider through the chat completions contract', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Клиент: Хорошо, жду.' } }] })
    }));
    globalThis.fetch = fetchMock;

    const text = await callConfiguredLlm(
      { system: 'system prompt', user: 'user prompt' },
      { LLM_PROVIDER: 'custom', LLM_API_BASE: 'https://llm.example.com/v1', LLM_API_KEY: 'custom-key', LLM_MODEL: 'model-x' }
    );

    expect(text).toBe('Клиент: Хорошо, жду.');
    expect(fetchMock).toHaveBeenCalledWith('https://llm.example.com/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer custom-key' })
    }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('model-x');
    expect(body.messages).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'user prompt' }
    ]);
  });

  it('throws a clear error when provider is not configured', async () => {
    await expect(callConfiguredLlm({ system: 's', user: 'u' }, { LLM_PROVIDER: 'custom' })).rejects.toThrow('LLM provider is not configured');
  });
});
