import { callConfiguredLlm, getLlmConfig, getPublicLlmStatus } from '../src/llmClient.js';
import { buildNeuroclientPrompt, containsAbuse, createFallbackReply, normalizeClientReply } from '../src/neuroclientPrompt.js';
import { buildSelectionAnalysisPrompt, createSelectionAnalysisFallback, isSelectionUrl, normalizeSelectionAnalysis, normalizeSelectionInput } from '../src/selectionAnalysis.js';
import { createDialogLog, deleteDialogLog, getDialogLogStoreStatus, listDialogLogs } from '../src/dialogLogStore.server.js';

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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
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

function parseModelJson(text = '') {
  const cleaned = String(text).trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

async function fetchSelectionText(selectionInput = '') {
  if (!isSelectionUrl(selectionInput)) return { fetchedText: '', fetchError: '' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(selectionInput, {
      signal: controller.signal,
      headers: { 'User-Agent': 'T-TRAINER selection analyzer' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);
    return { fetchedText: text, fetchError: '' };
  } catch (error) {
    return { fetchedText: '', fetchError: error?.message || 'failed to open selection link' };
  } finally {
    clearTimeout(timeout);
  }
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
    return sendJson(res, 200, { ok: true, ...getPublicLlmStatus(), dialogLogs: getDialogLogStoreStatus() }, headers);
  }

  if (path.endsWith('/api/dialog-logs')) {
    if (req.method === 'GET') {
      try {
        return sendJson(res, 200, { ok: true, configured: getDialogLogStoreStatus().configured, records: await listDialogLogs() }, headers);
      } catch (error) {
        const notConfigured = error?.code === 'SUPABASE_NOT_CONFIGURED';
        return sendJson(res, notConfigured ? 200 : 500, { ok: false, configured: false, records: [], error: error?.message || 'dialog log store unavailable' }, headers);
      }
    }

    if (req.method === 'POST') {
      let body;
      try {
        body = await readJsonBody(req);
        const record = await createDialogLog(body?.record || body);
        return sendJson(res, 200, { ok: true, configured: true, record }, headers);
      } catch (error) {
        const notConfigured = error?.code === 'SUPABASE_NOT_CONFIGURED';
        return sendJson(res, notConfigured ? 200 : 500, { ok: false, configured: false, error: error?.message || 'failed to save dialog log' }, headers);
      }
    }

    if (req.method === 'DELETE') {
      let body;
      try {
        body = await readJsonBody(req);
        if (!body?.id) return sendJson(res, 400, { ok: false, error: 'id is required' }, headers);
        await deleteDialogLog(body.id);
        return sendJson(res, 200, { ok: true }, headers);
      } catch (error) {
        const notConfigured = error?.code === 'SUPABASE_NOT_CONFIGURED';
        return sendJson(res, notConfigured ? 200 : 500, { ok: false, configured: false, error: error?.message || 'failed to delete dialog log' }, headers);
      }
    }
  }

  if (req.method === 'POST' && path.endsWith('/api/selection-analysis')) {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (_error) {
      return sendJson(res, 400, { ok: false, error: 'invalid json' }, headers);
    }

    const { scenarioId = 'turkey-family-hard', selectionInput = '' } = body || {};
    let normalizedInput;
    try {
      normalizedInput = normalizeSelectionInput(selectionInput);
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: error?.message || 'selection content is required' }, headers);
    }

    const { fetchedText, fetchError } = await fetchSelectionText(normalizedInput);
    const llmConfig = getLlmConfig();
    if (!llmConfig.configured) {
      return sendJson(res, 200, { ok: true, analysis: createSelectionAnalysisFallback({ scenarioId, selectionInput: normalizedInput, fetchError }), fetchError }, headers);
    }

    try {
      const prompt = buildSelectionAnalysisPrompt({ scenarioId, selectionInput: normalizedInput, fetchedText, fetchError });
      const raw = await callConfiguredLlm(prompt);
      const analysis = normalizeSelectionAnalysis(parseModelJson(raw));
      return sendJson(res, 200, { ok: true, analysis, fetchError, source: llmConfig.provider }, headers);
    } catch (error) {
      console.error('[selection-analysis-api]', error?.message || error);
      return sendJson(res, 200, { ok: true, analysis: createSelectionAnalysisFallback({ scenarioId, selectionInput: normalizedInput, fetchError: fetchError || error?.message }), fetchError, source: 'fallback-after-analysis-error' }, headers);
    }
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

  const { scenarioId, agentText, turn, history, phase = 'dialogue', selectionAnalysis = null } = body || {};
  if (!scenarioId || typeof agentText !== 'string') {
    return sendJson(res, 400, { error: 'scenarioId and agentText are required' }, headers);
  }

  if (containsAbuse(agentText)) {
    return sendJson(res, 200, createFallbackReply(scenarioId, agentText, turn, history, { phase, selectionAnalysis }), headers);
  }

  const llmConfig = getLlmConfig();
  if (!llmConfig.configured) {
    return sendJson(res, 200, createFallbackReply(scenarioId, agentText, turn, history, { phase, selectionAnalysis }), headers);
  }

  try {
    const prompt = buildNeuroclientPrompt({ scenarioId, agentText, turn, history, phase, selectionAnalysis });
    const text = await callConfiguredLlm(prompt);
    return sendJson(res, 200, { text: normalizeClientReply(text), source: llmConfig.provider }, headers);
  } catch (error) {
    console.error('[neuroclient-api]', error?.message || error);
    return sendJson(res, 200, { ...createFallbackReply(scenarioId, agentText, turn, history, { phase, selectionAnalysis }), source: 'fallback-after-llm-error' }, headers);
  }
}
