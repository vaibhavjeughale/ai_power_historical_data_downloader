import { HistoricalDataRequest, HistoricalDataResponse, DataProviderInfo, AiParsedRequest } from '../types/market';

export async function fetchInstruments(): Promise<any> {
  const res = await fetch('/api/instruments');
  if (!res.ok) throw new Error('Failed to load instruments configuration');
  return res.json();
}

export async function fetchProviders(): Promise<{ providers: DataProviderInfo[]; defaultProvider: string }> {
  const res = await fetch('/api/providers');
  if (!res.ok) throw new Error('Failed to load data providers');
  return res.json();
}

export async function fetchHistoricalMarketData(request: HistoricalDataRequest): Promise<HistoricalDataResponse> {
  const res = await fetch('/api/historical-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to retrieve historical market data.');
  }

  return data as HistoricalDataResponse;
}

export async function parseAiQuery(prompt: string): Promise<AiParsedRequest> {
  const res = await fetch('/api/ai-parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to interpret natural language query.');
  }

  return data.parsed as AiParsedRequest;
}

export async function downloadExcelFile(historicalData: HistoricalDataResponse): Promise<void> {
  const res = await fetch('/api/download/excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ historicalData }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to generate Excel download.');
  }

  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = `${historicalData.instrument.symbol}_${historicalData.timeframe}.xlsx`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadCsvFile(historicalData: HistoricalDataResponse): Promise<void> {
  const res = await fetch('/api/download/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ historicalData }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to generate CSV download.');
  }

  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = `${historicalData.instrument.symbol}_${historicalData.timeframe}.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
