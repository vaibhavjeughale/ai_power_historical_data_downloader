import { MarketInstrument, TimeframeId, HistoricalDataResponse, DataProviderInfo } from '../../src/types/market';

export interface ProviderFetchParams {
  instrument: string;
  symbol: string;
  exchange: string;
  timeframe: TimeframeId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  instrumentObj: MarketInstrument;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly isMock: boolean;
  readonly supportedTimeframes: TimeframeId[];
  readonly intradayMaxDays: number;

  getInfo(): DataProviderInfo;

  validateTimeframeAndRange(
    timeframe: TimeframeId,
    startDate: string,
    endDate: string
  ): { valid: boolean; warning?: string; error?: string };

  fetchHistoricalData(params: ProviderFetchParams): Promise<HistoricalDataResponse>;
}
