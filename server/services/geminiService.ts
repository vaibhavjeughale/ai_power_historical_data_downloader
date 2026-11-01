import { GoogleGenAI, Type } from '@google/genai';
import { AiParsedRequest, TimeframeId } from '../../src/types/market';
import { MASTER_INSTRUMENTS, findInstrument } from '../../src/config/instruments';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (genAIClient) return genAIClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  genAIClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return genAIClient;
}

export async function parseMarketDataPrompt(prompt: string): Promise<AiParsedRequest> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Please enter a query describing the market data you need.');
  }

  const ai = getGenAI();

  // Reference date: Current date in 2026 or fallback
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const instrumentCatalog = MASTER_INSTRUMENTS.map((inst) => ({
    id: inst.id,
    name: inst.name,
    symbol: inst.symbol,
    exchange: inst.exchange,
    assetType: inst.assetType,
  }));

  if (ai) {
    try {
      const systemInstruction = `
You are a precise financial market data assistant for the "Market Historical Data Downloader".
Your task is ONLY to interpret the user's natural language request and extract download parameters.
Reference Current Date: ${todayStr}.

Supported Instruments Catalog:
${JSON.stringify(instrumentCatalog, null, 2)}

Supported Timeframes:
- 1m (1 Minute)
- 3m (3 Minutes)
- 5m (5 Minutes)
- 10m (10 Minutes)
- 15m (15 Minutes)
- 30m (30 Minutes)
- 1h (1 Hour)
- 1d (1 Day / Daily)
- 1wk (1 Week / Weekly)
- 1mo (1 Month / Monthly)

Rules:
1. Identify the most appropriate instrumentId from the catalog (e.g., "NIFTY", "NIFTY50" -> "NIFTY50", "BANKNIFTY" -> "BANKNIFTY", "SENSEX" -> "SENSEX", "RELIANCE" -> "RELIANCE", "CRUDE" -> "CRUDEOIL"). If ambiguous, default to NIFTY50.
2. Identify the timeframeId (1m, 3m, 5m, 10m, 15m, 30m, 1h, 1d, 1wk, 1mo). If unspecified, default to "1d".
3. Extract or compute precise startDate and endDate in "YYYY-MM-DD" format.
   - For example, "January 2025" -> startDate: "2025-01-01", endDate: "2025-01-31".
   - "2023 to 2025" -> startDate: "2023-01-01", endDate: "2025-12-31".
   - "Last 6 months" -> compute 6 months before today (${todayStr}) to today.
   - "Last 30 days" -> compute 30 days before today to today.
4. Explain clearly what parameters you understood.
5. NEVER fabricate or produce market data numbers. Only parse parameters.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Parse this user market data request: "${trimmed}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              instrumentId: {
                type: Type.STRING,
                description: 'Matched instrument ID from catalog',
              },
              timeframe: {
                type: Type.STRING,
                description: 'Valid timeframe ID (1m, 3m, 5m, 10m, 15m, 30m, 1h, 1d, 1wk, 1mo)',
              },
              startDate: {
                type: Type.STRING,
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: Type.STRING,
                description: 'End date in YYYY-MM-DD format',
              },
              explanation: {
                type: Type.STRING,
                description: 'User-friendly sentence explaining the extracted parameters',
              },
            },
            required: ['instrumentId', 'timeframe', 'startDate', 'endDate', 'explanation'],
          },
        },
      });

      const parsedText = response.text;
      if (parsedText) {
        const result = JSON.parse(parsedText);
        const matchedInst = findInstrument(result.instrumentId) || MASTER_INSTRUMENTS[0];
        const validTimeframe = validateOrFallbackTimeframe(result.timeframe);

        return {
          instrumentId: matchedInst.id,
          instrumentName: matchedInst.name,
          symbol: matchedInst.symbol,
          timeframe: validTimeframe,
          startDate: result.startDate || getPastDate(30),
          endDate: result.endDate || todayStr,
          rawQuery: trimmed,
          confidence: 0.95,
          explanation: result.explanation || `Parsed request for ${matchedInst.name} (${validTimeframe}) from ${result.startDate} to ${result.endDate}.`,
        };
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to rule-based parser:', err.message);
    }
  }

  // Fallback rule-based parser
  return ruleBasedQueryParser(trimmed, todayStr);
}

function validateOrFallbackTimeframe(tf: string): TimeframeId {
  const allowed: TimeframeId[] = ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1wk', '1mo'];
  const lower = (tf || '').toLowerCase().trim();
  if (allowed.includes(lower as TimeframeId)) {
    return lower as TimeframeId;
  }
  if (lower.includes('1m') || lower.includes('1 min') || lower.includes('1-min')) return '1m';
  if (lower.includes('5m') || lower.includes('5 min') || lower.includes('5-min')) return '5m';
  if (lower.includes('15m') || lower.includes('15 min') || lower.includes('15-min')) return '15m';
  if (lower.includes('30m') || lower.includes('30 min') || lower.includes('30-min')) return '30m';
  if (lower.includes('hour') || lower.includes('1h')) return '1h';
  if (lower.includes('week') || lower.includes('1wk')) return '1wk';
  if (lower.includes('month') || lower.includes('1mo')) return '1mo';
  return '1d';
}

function ruleBasedQueryParser(query: string, todayStr: string): AiParsedRequest {
  const q = query.toLowerCase();

  // Find instrument
  let matched = MASTER_INSTRUMENTS[0];
  if (q.includes('bank') || q.includes('banknifty')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'BANKNIFTY')!;
  } else if (q.includes('sensex')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'SENSEX')!;
  } else if (q.includes('finnifty') || q.includes('financial')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'FINNIFTY') || matched;
  } else if (q.includes('midcap') || q.includes('midcpnifty')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'MIDCPNIFTY') || matched;
  } else if (q.includes('reliance')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'RELIANCE') || matched;
  } else if (q.includes('tcs')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'TCS') || matched;
  } else if (q.includes('infy') || q.includes('infosys')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'INFY') || matched;
  } else if (q.includes('hdfc')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'HDFCBANK') || matched;
  } else if (q.includes('crude') || q.includes('oil')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'CRUDEOIL') || matched;
  } else if (q.includes('gold')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'GOLD') || matched;
  } else if (q.includes('silver')) {
    matched = MASTER_INSTRUMENTS.find((i) => i.id === 'SILVER') || matched;
  }

  // Find timeframe
  let timeframe: TimeframeId = '1d';
  if (q.includes('1 min') || q.includes('1m') || q.includes('1-minute')) timeframe = '1m';
  else if (q.includes('3 min') || q.includes('3m')) timeframe = '3m';
  else if (q.includes('5 min') || q.includes('5m') || q.includes('5-minute')) timeframe = '5m';
  else if (q.includes('10 min') || q.includes('10m')) timeframe = '10m';
  else if (q.includes('15 min') || q.includes('15m') || q.includes('15-minute')) timeframe = '15m';
  else if (q.includes('30 min') || q.includes('30m') || q.includes('30-minute')) timeframe = '30m';
  else if (q.includes('hour') || q.includes('60m') || q.includes('1h')) timeframe = '1h';
  else if (q.includes('week') || q.includes('weekly')) timeframe = '1wk';
  else if (q.includes('month') || q.includes('monthly')) timeframe = '1mo';
  else if (q.includes('daily') || q.includes('day')) timeframe = '1d';

  // Dates
  let startDate = getPastDate(30);
  let endDate = todayStr;

  // Check for specific year/month mention (e.g. "January 2025")
  const monthMatch = q.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if (monthMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
    const year = parseInt(monthMatch[2], 10);
    const startM = new Date(Date.UTC(year, monthIndex, 1));
    const endM = new Date(Date.UTC(year, monthIndex + 1, 0));
    startDate = startM.toISOString().split('T')[0];
    endDate = endM.toISOString().split('T')[0];
  } else if (q.includes('last 7 days')) {
    startDate = getPastDate(7);
  } else if (q.includes('last 30 days') || q.includes('past month')) {
    startDate = getPastDate(30);
  } else if (q.includes('last 3 months')) {
    startDate = getPastDate(90);
  } else if (q.includes('last 6 months')) {
    startDate = getPastDate(180);
  } else if (q.includes('last 1 year') || q.includes('last year') || q.includes('1 year')) {
    startDate = getPastDate(365);
  } else if (q.includes('2023 to 2025')) {
    startDate = '2023-01-01';
    endDate = '2025-12-31';
  } else if (q.includes('2024 to 2025')) {
    startDate = '2024-01-01';
    endDate = '2025-12-31';
  }

  return {
    instrumentId: matched.id,
    instrumentName: matched.name,
    symbol: matched.symbol,
    timeframe,
    startDate,
    endDate,
    rawQuery: query,
    confidence: 0.85,
    explanation: `Identified request for ${matched.name} (${timeframe}) from ${startDate} to ${endDate}.`,
  };
}

function getPastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
