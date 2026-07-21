import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNeuroclientPrompt, createFallbackReply, normalizeClientReply } from './src/neuroclientPrompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 5173);

app.use(express.json({ limit: '512kb' }));

app.post('/api/neuroclient', async (req, res) => {
  const { scenarioId, agentText, turn, history } = req.body || {};

  if (!scenarioId || typeof agentText !== 'string') {
    return res.status(400).json({ error: 'scenarioId and agentText are required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.json(createFallbackReply(scenarioId, agentText, turn, history));
  }

  try {
    const prompt = buildNeuroclientPrompt({ scenarioId, agentText, turn, history });
    const text = await callOpenAI(prompt);
    return res.json({ text: normalizeClientReply(text), source: 'openai' });
  } catch (error) {
    console.error('[neuroclient-api]', error?.message || error);
    return res.json({ ...createFallbackReply(scenarioId, agentText, turn, history), source: 'fallback-after-ai-error' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/tourism-agent-trainer', express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Tourism trainer running on http://0.0.0.0:${port}`);
});

async function callOpenAI(prompt) {
  const models = [process.env.OPENAI_MODEL || 'gpt-4.1-mini', 'gpt-4o-mini'];
  let lastError;

  for (const model of [...new Set(models)]) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0.88,
          max_tokens: 260,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ]
        })
      });
      clearTimeout(timeout);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
        continue;
      }

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('OpenAI call failed');
}
