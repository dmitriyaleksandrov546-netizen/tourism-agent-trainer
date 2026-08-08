import { getNextClientReply } from './simulatorEngine.js';

const DEFAULT_NEUROCLIENT_API_URL = '/api/neuroclient';
const REQUEST_TIMEOUT_MS = 30000;

function getNeuroclientApiUrl() {
  return import.meta.env.VITE_NEUROCLIENT_API_URL || DEFAULT_NEUROCLIENT_API_URL;
}

export async function requestNeuroclientReply({ scenarioId, agentText, turn, history }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getNeuroclientApiUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, agentText, turn, history })
    });

    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    if (!data?.text) throw new Error('Empty neuroclient reply');
    return data;
  } catch (error) {
    return {
      text: getNextClientReply(scenarioId, agentText, turn, history),
      source: 'client-local-fallback',
      error: error?.message || 'Neuroclient backend unavailable'
    };
  } finally {
    clearTimeout(timeout);
  }
}
