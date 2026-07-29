import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNeuroclientPrompt, containsAbuse, createFallbackReply, isPoliteProcessReply, normalizeClientReply } from './src/neuroclientPrompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 5173);
const privateDataDir = path.join(__dirname, 'private-data', 'amocrm');

app.use(express.json({ limit: '512kb' }));

app.post('/api/wazzup/webhook', (req, res) => {
  const expectedToken = process.env.WAZZUP_WEBHOOK_TOKEN;
  if (expectedToken && req.query.token !== expectedToken) {
    return res.status(401).json({ ok: false, error: 'invalid webhook token' });
  }

  const body = req.body || {};
  if (body.test === true) {
    return res.json({ ok: true });
  }

  const saved = saveWazzupWebhook({
    receivedAt: new Date().toISOString(),
    authorizationPresent: Boolean(req.get('authorization')),
    body
  });

  return res.json({ ok: true, saved });
});

app.post('/api/neuroclient', async (req, res) => {
  const { scenarioId, agentText, turn, history } = req.body || {};

  if (!scenarioId || typeof agentText !== 'string') {
    return res.status(400).json({ error: 'scenarioId and agentText are required' });
  }

  if (containsAbuse(agentText)) {
    return res.json(createFallbackReply(scenarioId, agentText, turn, history));
  }

  if (isPoliteProcessReply(agentText)) {
    return res.json(createFallbackReply(scenarioId, agentText, turn, history));
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

function saveWazzupWebhook(event) {
  const messages = Array.isArray(event.body?.messages) ? event.body.messages : [];
  const statuses = Array.isArray(event.body?.statuses) ? event.body.statuses : [];
  const date = event.receivedAt.slice(0, 10);
  const dir = path.join(privateDataDir, 'wazzup-webhooks');
  fs.mkdirSync(dir, { recursive: true });

  const rawPath = path.join(dir, `raw-${date}.jsonl`);
  fs.appendFileSync(rawPath, `${JSON.stringify(event)}\n`);

  if (messages.length > 0) {
    const normalizedPath = path.join(dir, `messages-${date}.jsonl`);
    const rows = messages.map((message) => JSON.stringify({
      receivedAt: event.receivedAt,
      messageId: message.messageId,
      channelId: message.channelId,
      chatType: message.chatType,
      chatId: message.chatId,
      dateTime: message.dateTime,
      type: message.type,
      isEcho: message.isEcho,
      authorId: message.authorId,
      authorName: message.authorName,
      contactName: message.contact?.name,
      contactPhone: message.contact?.phone,
      contactUsername: message.contact?.username,
      text: message.text,
      contentUri: message.contentUri,
      status: message.status,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted
    })).join('\n');
    fs.appendFileSync(normalizedPath, `${rows}\n`);
  }

  return { messages: messages.length, statuses: statuses.length };
}

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
