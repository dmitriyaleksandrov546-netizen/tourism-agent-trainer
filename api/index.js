import { callConfiguredLlm, getLlmConfig, getPublicLlmStatus } from '../src/llmClient.js';
import { buildNeuroclientPrompt, containsAbuse, createFallbackReply, normalizeClientReply } from '../src/neuroclientPrompt.js';

function sendJson(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(payload));
}

function corsHeaders(req) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  const headers = corsHeaders(req);
  const path = req.url?.split('?')[0] || '';

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
    return res.end();
  }

  if (req.method === 'GET' && path.endsWith('/api/neuroclient/health')) {
    return sendJson(res, 200, { ok: true, ...getPublicLlmStatus() }, headers);
  }

  if (req.method !== 'POST' || !path.endsWith('/api/neuroclient')) {
    return sendJson(res, 404, { ok: false, error: 'not found' }, headers);
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (_error) {
    return sendJson(res, 400, { ok: false, error: 'invalid json' }, headers);
  }

  const { scenarioId, agentText, turn, history } = body || {};
  if (!scenarioId || typeof agentText !== 'string') {
    return sendJson(res, 400, { error: 'scenarioId and agentText are required' }, headers);
  }

  if (containsAbuse(agentText)) {
    return sendJson(res, 200, createFallbackReply(scenarioId, agentText, turn, history), headers);
  }

  const llmConfig = getLlmConfig();
  if (!llmConfig.configured) {
    return sendJson(res, 200, createFallbackReply(scenarioId, agentText, turn, history), headers);
  }

  try {
    const prompt = buildNeuroclientPrompt({ scenarioId, agentText, turn, history });
    const text = await callConfiguredLlm(prompt);
    return sendJson(res, 200, { text: normalizeClientReply(text), source: llmConfig.provider }, headers);
  } catch (error) {
    console.error('[neuroclient-api]', error?.message || error);
    return sendJson(res, 200, { ...createFallbackReply(scenarioId, agentText, turn, history), source: 'fallback-after-llm-error' }, headers);
  }
}
