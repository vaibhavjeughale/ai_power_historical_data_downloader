import { MarketDataProvider, ProviderFetchParams } from './types';
import { DataProviderInfo, HistoricalDataResponse, OHLCRecord, TimeframeId } from '../../src/types/market';
import { cleanAndValidateOHLC } from '../utils/dataCleaner';

export class YahooFinanceProvider implements MarketDataProvider {
  readonly id = 'yahoo';
  readonly name = 'Yahoo Finance (Real Market Feed)';
  readonly description = 'Live real-time and historical market data for Indian Indices (^NSEI, ^NSEBANK, ^BSESN), Stocks, and Global Commodities';
  readonly isMock = false;
  readonly supportedTimeframes: TimeframeId[] = ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1wk', '1mo'];
  readonly intradayMaxDays = 60;

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
    timeframe: TimeframeId,
    startDate: string,
    endDate: string
  ): { valid: boolean; warning?: string; error?: string } {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();

    if (isNaN(start) || isNaN(end)) {
      return { valid: false, error: 'Invalid start or end date format. Expected YYYY-MM-DD.' };
    }

    if (start > end) {
      return { valid: false, error: 'Start date cannot be after end date.' };
    }

    if (start > now) {
      return { valid: false, error: 'Future dates are not allowed.' };
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (timeframe === '1m') {
      if (diffDays > 7) {
        return {
          valid: false,
          error: `No 1-minute data is available for the selected date range (${diffDays} days) from the current data provider. Please choose another timeframe (such as 5 Minutes or 1 Day) or a shorter date range (maximum 7 days).`,
        };
      }
      const daysFromNow = (now - start) / (1000 * 60 * 60 * 24);
      if (daysFromNow > 30) {
        return {
          valid: false,
          error: `1-minute intraday data is only available for the past 30 days. For historical periods further back, please select a higher timeframe (e.g., 5 Minutes, 1 Hour, or 1 Day).`,
        };
      }
    } else if (timeframe === '3m' || timeframe === '5m' || timeframe === '10m' || timeframe === '15m' || timeframe === '30m') {
      const daysFromNow = (now - start) / (1000 * 60 * 60 * 24);
      if (daysFromNow > 60) {
        return {
          valid: false,
          error: `Intraday ${timeframe} data is limited to the last 60 days by the exchange data provider. For earlier historical dates, please choose '1 Day', '1 Week', or '1 Month'.`,
        };
      }
    } else if (timeframe === '1h') {
      const daysFromNow = (now - start) / (1000 * 60 * 60 * 24);
      if (daysFromNow > 730) {
        return {
          valid: false,
          error: `1-hour intraday data is available up to 730 days (2 years). For older dates, please select '1 Day', '1 Week', or '1 Month'.`,
        };
      }
    }

    return { valid: true };
  }

  async fetchHistoricalData(params: ProviderFetchParams): Promise<HistoricalDataResponse> {
    const { instrumentObj, timeframe, startDate, endDate } = params;

    const validation = this.validateTimeframeAndRange(timeframe, startDate, endDate);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid timeframe or date range selection.');
    }

    const symbol = instrumentObj.providerSymbols.yahoo || instrumentObj.symbol;

    // Convert dates to epoch seconds
    const startObj = new Date(startDate);
    startObj.setUTCHours(0, 0, 0, 0);
    const startSec = Math.floor(startObj.getTime() / 1000);

    const endObj = new Date(endDate);
    endObj.setUTCHours(23, 59, 59, 999);
    const endSec = Math.floor(endObj.getTime() / 1000);

    // Map timeframe to Yahoo interval
    let fetchInterval = '1d';
    let needsAggregation = false;
    let aggregateMinutes = 0;

    switch (timeframe) {
      case '1m':
        fetchInterval = '1m';
        break;
      case '3m':
        fetchInterval = '1m';
        needsAggregation = true;
        aggregateMinutes = 3;
        break;
      case '5m':
        fetchInterval = '5m';
        break;
      case '10m':
        fetchInterval = '5m';
        needsAggregation = true;
        aggregateMinutes = 10;
        break;
      case '15m':
        fetchInterval = '15m';
        break;
      case '30m':
        fetchInterval = '30m';
        break;
      case '1h':
        fetchInterval = '60m';
        break;
      case '1d':
        fetchInterval = '1d';
        break;
      case '1wk':
        fetchInterval = '1wk';
        break;
      case '1mo':
        fetchInterval = '1mo';
        break;
      default:
        fetchInterval = '1d';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${startSec}&period2=${endSec}&interval=${fetchInterval}&includePrePost=false&events=history`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (networkErr: any) {
      // Retry once on query2
      const backupUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${startSec}&period2=${endSec}&interval=${fetchInterval}&includePrePost=false&events=history`;
      try {
        response = await fetch(backupUrl, { headers });
      } catch (backupErr: any) {
        throw new Error(`Network error connecting to market data provider: ${networkErr.message || 'Connection refused'}`);
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Symbol '${symbol}' not found on market data exchange feed.`);
      }
      if (response.status === 429) {
        throw new Error('Data provider rate limit exceeded. Please wait a few seconds and try again.');
      }
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMsg = parsed?.chart?.error?.description || parsed?.message || errText;
      } catch {
        // ignore
      }
      throw new Error(`Data provider error (${response.status}): ${parsedMsg}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      const errorMsg = data?.chart?.error?.description || 'No market data returned from provider for this query.';
      throw new Error(errorMsg);
    }

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens: (number | null)[] = quote.open || [];
    const highs: (number | null)[] = quote.high || [];
    const lows: (number | null)[] = quote.low || [];
    const closes: (number | null)[] = quote.close || [];
    const volumes: (number | null)[] = quote.volume || [];

    if (timestamps.length === 0) {
      throw new Error(`No market data candles available for ${instrumentObj.name} (${symbol}) between ${startDate} and ${endDate}. The exchange may have been closed or data is unavailable for this date range.`);
    }

    const rawRecords: OHLCRecord[] = [];
    const isIntraday = timeframe !== '1d' && timeframe !== '1wk' && timeframe !== '1mo';

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i] * 1000;
      const open = opens[i];
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const volume = volumes[i] ?? 0;

      // Skip null candles (holidays / non-trading ticks)
      if (open === null || high === null || low === null || close === null) {
        continue;
      }

      const dateObj = new Date(ts);
      // Format YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let timeStr: string | undefined = undefined;
      if (isIntraday) {
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        timeStr = `${hours}:${minutes}:${seconds}`;
      }

      rawRecords.push({
        date: dateStr,
        time: timeStr,
        timestamp: ts,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.round(volume),
        instrument: instrumentObj.name,
        symbol: instrumentObj.symbol,
        exchange: instrumentObj.exchange,
        timeframe: timeframe,
        isValid: true,
      });
    }

    // Aggregate if needed (e.g. 1m -> 3m, 5m -> 10m)
    let processedRecords = rawRecords;
    if (needsAggregation && aggregateMinutes > 0 && rawRecords.length > 0) {
      processedRecords = this.aggregateBars(rawRecords, aggregateMinutes, timeframe);
    }

    const cleaned = cleanAndValidateOHLC(processedRecords);

    return {
      success: true,
      instrument: instrumentObj,
      timeframe,
      startDate,
      endDate,
      totalRecords: cleaned.records.length,
      firstDate: cleaned.firstDate,
      lastDate: cleaned.lastDate,
      dataSource: `${this.name} [Real Market Feed]`,
      isMockData: false,
      generatedAt: new Date().toISOString(),
      data: cleaned.records,
      summary: cleaned.summary,
    };
  }

  private aggregateBars(bars: OHLCRecord[], targetMinutes: number, targetTimeframeId: TimeframeId): OHLCRecord[] {
    const bucketDurationMs = targetMinutes * 60 * 1000;
    const aggregated: OHLCRecord[] = [];

    let currentBucket: OHLCRecord[] = [];
    let currentBucketKey = -1;

    for (const bar of bars) {
      const bucketKey = Math.floor(bar.timestamp / bucketDurationMs);

      if (currentBucketKey === -1) {
        currentBucketKey = bucketKey;
        currentBucket.push(bar);
      } else if (bucketKey === currentBucketKey) {
        currentBucket.push(bar);
      } else {
        aggregated.push(this.mergeBucket(currentBucket, targetTimeframeId));
        currentBucket = [bar];
        currentBucketKey = bucketKey;
      }
    }

    if (currentBucket.length > 0) {
      aggregated.push(this.mergeBucket(currentBucket, targetTimeframeId));
    }

    return aggregated;
  }

  private mergeBucket(bucket: OHLCRecord[], timeframeId: TimeframeId): OHLCRecord {
    const first = bucket[0];
    const last = bucket[bucket.length - 1];

    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    for (const b of bucket) {
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
      volume += b.volume;
    }

    return {
      ...first,
      close: last.close,
      high,
      low,
      volume,
      timeframe: timeframeId,
    };
  }
}
