import { MarketDataProvider, ProviderFetchParams } from './types';
import { DataProviderInfo, HistoricalDataResponse, OHLCRecord, TimeframeId } from '../../src/types/market';
import { cleanAndValidateOHLC } from '../utils/dataCleaner';

export class MockSandboxProvider implements MarketDataProvider {
  readonly id = 'mock_sandbox';
  readonly name = 'Developer Sandbox (Offline Test Feed)';
  readonly description = 'Deterministic sample data feed strictly for offline development, local unit testing, and sandbox verification.';
  readonly isMock = true;
  readonly supportedTimeframes: TimeframeId[] = ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1wk', '1mo'];
  readonly intradayMaxDays = 365;

  getInfo(): DataProviderInfo {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isMock: this.isMock,
      supportedTimeframes: this.supportedTimeframes,
      intradayMaxDays: this.intradayMaxDays,
      status: 'active',
    };
  }

  validateTimeframeAndRange(
    _timeframe: TimeframeId,
    startDate: string,
    endDate: string
  ): { valid: boolean; warning?: string; error?: string } {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      return { valid: false, error: 'Invalid start or end date format.' };
    }
    if (start > end) {
      return { valid: false, error: 'Start date cannot be after end date.' };
    }
    return {
      valid: true,
      warning: 'NOTICE: You are currently using the Developer Sandbox feed. Data is simulated for testing only and should not be used for real financial trading.',
    };
  }

  async fetchHistoricalData(params: ProviderFetchParams): Promise<HistoricalDataResponse> {
    const { instrumentObj, timeframe, startDate, endDate } = params;

    const startObj = new Date(startDate);
    startObj.setUTCHours(9, 15, 0, 0); // NSE market opens 9:15 AM
    const endObj = new Date(endDate);
    endObj.setUTCHours(15, 30, 0, 0); // NSE market closes 3:30 PM

    // Base price anchor per instrument
    let basePrice = 24500; // default Nifty level
    if (instrumentObj.id.includes('BANK')) basePrice = 51200;
    else if (instrumentObj.id.includes('SENSEX')) basePrice = 80100;
    else if (instrumentObj.id.includes('FIN')) basePrice = 23800;
    else if (instrumentObj.id.includes('MID')) basePrice = 12900;
    else if (instrumentObj.id === 'RELIANCE') basePrice = 1295;
    else if (instrumentObj.id === 'TCS') basePrice = 4150;
    else if (instrumentObj.id === 'INFY') basePrice = 1880;
    else if (instrumentObj.id === 'HDFCBANK') basePrice = 1720;
    else if (instrumentObj.id === 'ICICIBANK') basePrice = 1260;
    else if (instrumentObj.id === 'TATASTEEL') basePrice = 152;
    else if (instrumentObj.id === 'CRUDEOIL') basePrice = 71.5;
    else if (instrumentObj.id === 'GOLD') basePrice = 2740;
    else if (instrumentObj.id === 'SILVER') basePrice = 33.8;

    let stepMinutes = 1440;
    if (timeframe === '1m') stepMinutes = 1;
    else if (timeframe === '3m') stepMinutes = 3;
    else if (timeframe === '5m') stepMinutes = 5;
    else if (timeframe === '10m') stepMinutes = 10;
    else if (timeframe === '15m') stepMinutes = 15;
    else if (timeframe === '30m') stepMinutes = 30;
    else if (timeframe === '1h') stepMinutes = 60;
    else if (timeframe === '1wk') stepMinutes = 10080;
    else if (timeframe === '1mo') stepMinutes = 43200;

    const isIntraday = timeframe !== '1d' && timeframe !== '1wk' && timeframe !== '1mo';
    const rawRecords: OHLCRecord[] = [];

    let currentTs = startObj.getTime();
    const endTs = endObj.getTime();
    let currentPrice = basePrice;
    let seed = 42;

    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Cap total generated mock bars to avoid memory bloat
    const MAX_MOCK_BARS = 3000;
    let count = 0;

    while (currentTs <= endTs && count < MAX_MOCK_BARS) {
      const d = new Date(currentTs);
      const dayOfWeek = d.getUTCDay();

      // Skip weekends for stock/index
      if (instrumentObj.assetType !== 'COMMODITY' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentTs += 24 * 60 * 60 * 1000;
        continue;
      }

      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let timeStr: string | undefined = undefined;
      if (isIntraday) {
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        timeStr = `${hours}:${minutes}:${seconds}`;
      }

      const volatility = currentPrice * 0.003;
      const change = (pseudoRandom() - 0.49) * volatility;
      const open = currentPrice;
      const close = Number((open + change).toFixed(2));
      const wick1 = pseudoRandom() * volatility * 0.8;
      const wick2 = pseudoRandom() * volatility * 0.8;
      const high = Number((Math.max(open, close) + wick1).toFixed(2));
      const low = Number((Math.min(open, close) - wick2).toFixed(2));
      const volume = Math.floor(pseudoRandom() * 500000 + 50000);

      currentPrice = close;

      rawRecords.push({
        date: dateStr,
        time: timeStr,
        timestamp: currentTs,
        open,
        high,
        low,
        close,
        volume,
        instrument: instrumentObj.name,
        symbol: instrumentObj.symbol,
        exchange: instrumentObj.exchange,
        timeframe,
        isValid: true,
      });

      count++;
      currentTs += stepMinutes * 60 * 1000;
    }

    const cleaned = cleanAndValidateOHLC(rawRecords);

    return {
      success: true,
      instrument: instrumentObj,
      timeframe,
      startDate,
      endDate,
      totalRecords: cleaned.records.length,
      firstDate: cleaned.firstDate,
      lastDate: cleaned.lastDate,
      dataSource: `${this.name} [MOCK TEST FEED]`,
      isMockData: true,
      generatedAt: new Date().toISOString(),
      data: cleaned.records,
      summary: cleaned.summary,
      warning: 'NOTICE: This data was produced by the Developer Sandbox Mock Provider for offline testing. It does not reflect actual financial exchanges.',
    };
  }
}
