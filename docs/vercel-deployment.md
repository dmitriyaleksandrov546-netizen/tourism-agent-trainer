# Vercel deployment

Use Vercel when the trainer needs one public URL with both the static React frontend and `/api/*` backend routes.

## Project settings

Import repository:

```text
dmitriyaleksandrov546-netizen/tourism-agent-trainer
```

Branch for the current neuroclient fix:

```text
ai/fix-neuroclient-dialogue
```

Vercel should detect the project from `vercel.json`:

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
ALLOWED_ORIGINS=*
```

For production, replace `ALLOWED_ORIGINS=*` with the final Vercel/custom domain after the first successful deploy.

## Smoke checks

After deploy, check:

```text
https://<vercel-url>/
https://<vercel-url>/api/neuroclient/health
```

Expected health with a configured key:

```json
{
  "ok": true,
  "provider": "openai",
  "configured": true,
  "model": "gpt-4.1-mini",
  "mode": "openai"
}
```

If `configured` is `false`, the site is up but the AI provider key is missing or invalid, and the simulator will use local fallback replies.
