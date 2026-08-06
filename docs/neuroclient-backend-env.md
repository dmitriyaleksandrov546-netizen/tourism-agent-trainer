# Neuroclient backend env

The frontend must never receive provider API keys. Put secrets only on the backend host that runs `server.js`.

## OpenAI-compatible default

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=<set in hosting secret storage>
LLM_MODEL=gpt-4.1-mini
ALLOWED_ORIGINS=https://dmitriyaleksandrov546-netizen.github.io
PORT=5173
```

## OpenRouter

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=<set in hosting secret storage>
LLM_MODEL=openai/gpt-4.1-mini
OPENROUTER_SITE_URL=https://dmitriyaleksandrov546-netizen.github.io/tourism-agent-trainer/
OPENROUTER_APP_NAME=T-TRAINER
ALLOWED_ORIGINS=https://dmitriyaleksandrov546-netizen.github.io
PORT=5173
```

## Custom OpenAI-compatible provider

```bash
LLM_PROVIDER=custom
LLM_API_BASE=https://provider.example.com/v1
LLM_API_KEY=<set in hosting secret storage>
LLM_MODEL=<model-name>
ALLOWED_ORIGINS=https://dmitriyaleksandrov546-netizen.github.io
PORT=5173
```

## Frontend build env

Set this only at frontend build time. It is public and must contain only the backend URL, never API keys.

```bash
VITE_NEUROCLIENT_API_URL=https://<backend-domain>/api/neuroclient
```

## Health check

```bash
curl https://<backend-domain>/api/neuroclient/health
```

Expected configured response:

```json
{
  "ok": true,
  "provider": "openai",
  "configured": true,
  "model": "gpt-4.1-mini",
  "mode": "openai"
}
```

If `configured` is `false`, the trainer will use local fallback instead of the live neuroclient.
