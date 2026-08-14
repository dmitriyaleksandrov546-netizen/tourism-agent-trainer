const DEFAULT_SELECTION_ANALYSIS_API_URL = '/api/selection-analysis';
const REQUEST_TIMEOUT_MS = 45000;

function getSelectionAnalysisApiUrl() {
  return import.meta.env.VITE_SELECTION_ANALYSIS_API_URL || DEFAULT_SELECTION_ANALYSIS_API_URL;
}

export async function requestSelectionAnalysis({ scenarioId, selectionInput }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getSelectionAnalysisApiUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, selectionInput })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.analysis?.clientReply) {
      throw new Error(data?.error || `selection analysis API ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
