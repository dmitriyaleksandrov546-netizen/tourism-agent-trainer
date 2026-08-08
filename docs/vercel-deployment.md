# Vercel deployment

This repo is the single production app for T-TRAINER: frontend, `/api/neuroclient`, generated corpus snapshot, and deployment config.

Production domain:

```text
ttrainer.ru
www.ttrainer.ru
```

## Vercel project

Import repository:

```text
dmitriyaleksandrov546-netizen/tourism-agent-trainer
```

Production branch:

```text
main
```

Vercel should use `vercel.json`:

```text
Build Command: npm ci && npm run build
Output Directory: dist
API entrypoint: api/index.js
```

## Environment variables

Required for live AI replies:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
OPENAI_API_KEY=<new OpenAI key>
ALLOWED_ORIGINS=https://ttrainer.ru,https://www.ttrainer.ru
```

Temporary debugging value if CORS blocks first deployment:

```bash
ALLOWED_ORIGINS=*
```

## DNS

In SprintHost DNS:

```text
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

## Smoke checks

After deploy:

```text
https://ttrainer.ru/
https://ttrainer.ru/api/neuroclient/health
```

Expected health with provider key configured:

```json
{
  "ok": true,
  "provider": "openai",
  "configured": true,
  "model": "gpt-4.1-mini",
  "mode": "openai"
}
```

If `configured` is `false`, the site is up but the AI provider key is missing/invalid, and the simulator uses corpus-based local fallback replies.
