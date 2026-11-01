export type Exchange = 'NSE' | 'BSE' | 'MCX' | 'GLOBAL';
export type AssetType = 'INDEX' | 'EQUITY' | 'COMMODITY' | 'CURRENCY';

export type TimeframeId = 
  | '1m' 
  | '3m' 
  | '5m' 
  | '10m' 
  | '15m' 
  | '30m' 
  | '1h' 
  | '1d' 
  | '1wk' 
  | '1mo';

export interface TimeframeConfig {
  id: TimeframeId;
  label: string;
  category: 'intraday' | 'daily_plus';
  minutes: number;
  maxHistoricalDays?: number;
  description: string;
}

export interface MarketInstrument {
  id: string;
  name: string;
  symbol: string;
  exchange: Exchange;
  assetType: AssetType;
  supportedTimeframes: TimeframeId[];
  providerSymbols: {
    yahoo: string;
    stooq?: string;
    alphaVantage?: string;
    mock?: string;
    [key: string]: string | undefined;
  };
  description?: string;
  currency?: string;
  tickSize?: number;
  lotSize?: number;
}

export interface OHLCRecord {
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm:ss (for intraday data)
  timestamp: number;  // epoch milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  instrument: string;
  symbol: string;
  exchange: Exchange;
  timeframe: string;
  isValid: boolean;
  validationError?: string;
}

export interface HistoricalDataRequest {
  instrument: string; // Instrument ID or Symbol
  symbol?: string;
  exchange?: Exchange;
  timeframe: TimeframeId;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  providerId?: string; // Optional specific provider
}

export interface HistoricalDataResponse {
  success: boolean;
  instrument: MarketInstrument;
  timeframe: TimeframeId;
  startDate: string;
  endDate: string;
  totalRecords: number;
  firstDate?: string;
  lastDate?: string;
  dataSource: string;
  isMockData: boolean;
  generatedAt: string;
  data: OHLCRecord[];
  summary: {
    periodHigh: number;
    periodLow: number;
    periodOpen: number;
    periodClose: number;
    netChange: number;
    netChangePercent: number;
    totalVolume: number;
    bullishCandles: number;
    bearishCandles: number;
    dojiCandles: number;
    validCandles: number;
    invalidCandles: number;
  };
  message?: string;
  warning?: string;
}

export interface DataProviderInfo {
  id: string;
  name: string;
  description: string;
  isMock: boolean;
  supportedTimeframes: TimeframeId[];
  intradayMaxDays: number;
  status: 'active' | 'rate_limited' | 'offline';
}

export interface AiParsedRequest {
  instrumentId: string;
  instrumentName: string;
  symbol: string;
  timeframe: TimeframeId;
  startDate: string;
  endDate: string;
  rawQuery: string;
  confidence: number;
  explanation: string;
}
