const providerDefaults = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    apiKeyEnv: 'OPENAI_API_KEY'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4.1-mini',
    apiKeyEnv: 'OPENROUTER_API_KEY'
  },
  custom: {
    baseUrl: '',
    model: 'gpt-4.1-mini',
    apiKeyEnv: 'LLM_API_KEY'
  }
};

function readEnv(env, key) {
  return env[key]?.trim?.() || '';
}

function normalizeBaseUrl(baseUrl = '') {
  return baseUrl.replace(/\/+$/, '');
}

export function getLlmConfig(env = process.env) {
  const provider = (readEnv(env, 'LLM_PROVIDER') || (readEnv(env, 'OPENROUTER_API_KEY') ? 'openrouter' : 'openai')).toLowerCase();
  const defaults = providerDefaults[provider] || providerDefaults.custom;
  const apiKey = readEnv(env, 'LLM_API_KEY') || readEnv(env, defaults.apiKeyEnv);
  const baseUrl = normalizeBaseUrl(readEnv(env, 'LLM_API_BASE') || defaults.baseUrl);
  const model = readEnv(env, 'LLM_MODEL') || readEnv(env, 'OPENAI_MODEL') || defaults.model;

  return {
    provider,
    configured: Boolean(apiKey && baseUrl && model),
    apiKey,
    baseUrl,
    model,
    endpoint: `${baseUrl}/chat/completions`
  };
}

export function getPublicLlmStatus(env = process.env) {
  const config = getLlmConfig(env);
  return {
    provider: config.provider,
    configured: config.configured,
    model: config.model,
    mode: config.configured ? config.provider : 'local-fallback'
  };
}

export async function callConfiguredLlm(prompt, env = process.env) {
  const config = getLlmConfig(env);
  if (!config.configured) throw new Error('LLM provider is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(readEnv(env, 'LLM_TIMEOUT_MS') || 25000));

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.provider === 'openrouter' && readEnv(env, 'OPENROUTER_SITE_URL') ? { 'HTTP-Referer': readEnv(env, 'OPENROUTER_SITE_URL') } : {}),
        ...(config.provider === 'openrouter' && readEnv(env, 'OPENROUTER_APP_NAME') ? { 'X-Title': readEnv(env, 'OPENROUTER_APP_NAME') } : {})
      },
      body: JSON.stringify({
        model: config.model,
        temperature: Number(readEnv(env, 'LLM_TEMPERATURE') || 0.88),
        max_tokens: Number(readEnv(env, 'LLM_MAX_TOKENS') || 260),
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || `${config.provider} HTTP ${response.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
}
