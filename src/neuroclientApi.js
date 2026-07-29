import { createFallbackReply } from './neuroclientPrompt.js';

export async function requestNeuroclientReply({ scenarioId, agentText, turn, history }) {
  try {
    const response = await fetch('/api/neuroclient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, agentText, turn, history })
    });

    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    if (!data?.text) throw new Error('Empty neuroclient reply');
    return data;
  } catch (_error) {
    return createFallbackReply(scenarioId, agentText, turn, history);
  }
}
