import { OHLCRecord } from '../../src/types/market';

export interface CleanedDataResult {
  records: OHLCRecord[];
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
  firstDate?: string;
  lastDate?: string;
}

/**
 * Standard data hygiene, validation, and analytics engine.
 * Ensures:
 * 1. Chronological sorting
 * 2. Deduplication by timestamp
 * 3. Strict OHLC mathematical validation (High >= Open & Close, Low <= Open & Close)
 * 4. Missing/invalid records flagged, never silently fabricated.
 */
export function cleanAndValidateOHLC(records: OHLCRecord[]): CleanedDataResult {
  if (!records || records.length === 0) {
    return {
      records: [],
      summary: {
        periodHigh: 0,
        periodLow: 0,
        periodOpen: 0,
        periodClose: 0,
        netChange: 0,
        netChangePercent: 0,
        totalVolume: 0,
        bullishCandles: 0,
        bearishCandles: 0,
        dojiCandles: 0,
        validCandles: 0,
        invalidCandles: 0,
      },
    };
  }

  // 1. Deduplicate by timestamp (prefer earlier or cleaner record)
  const seenTimestamps = new Set<number>();
  const uniqueRecords: OHLCRecord[] = [];

  for (const rec of records) {
    if (!rec.timestamp || isNaN(rec.timestamp)) continue;
    if (seenTimestamps.has(rec.timestamp)) continue;
    seenTimestamps.add(rec.timestamp);

    // Validate OHLC sanity
    let isValid = true;
    let validationError: string | undefined = undefined;

    if (
      isNaN(rec.open) ||
      isNaN(rec.high) ||
      isNaN(rec.low) ||
      isNaN(rec.close) ||
      rec.open <= 0 ||
      rec.high <= 0 ||
      rec.low <= 0 ||
      rec.close <= 0
    ) {
      isValid = false;
      validationError = 'Zero, negative or non-numeric price values detected';
    } else if (rec.high < rec.open || rec.high < rec.close) {
      isValid = false;
      validationError = `Invalid High (${rec.high}) less than Open (${rec.open}) or Close (${rec.close})`;
    } else if (rec.low > rec.open || rec.low > rec.close) {
      isValid = false;
      validationError = `Invalid Low (${rec.low}) greater than Open (${rec.open}) or Close (${rec.close})`;
    }

    uniqueRecords.push({
      ...rec,
      isValid,
      validationError,
    });
  }

  // 2. Sort chronologically (oldest to newest)
  uniqueRecords.sort((a, b) => a.timestamp - b.timestamp);

  // 3. Compute period summary analytics
  let periodHigh = -Infinity;
  let periodLow = Infinity;
  let totalVolume = 0;
  let bullishCandles = 0;
  let bearishCandles = 0;
  let dojiCandles = 0;
  let validCandles = 0;
  let invalidCandles = 0;

  for (const bar of uniqueRecords) {
    if (bar.isValid) {
      validCandles++;
      if (bar.high > periodHigh) periodHigh = bar.high;
      if (bar.low < periodLow) periodLow = bar.low;
      totalVolume += bar.volume || 0;

      if (bar.close > bar.open) {
        bullishCandles++;
      } else if (bar.close < bar.open) {
        bearishCandles++;
      } else {
        dojiCandles++;
      }
    } else {
      invalidCandles++;
    }
  }

  const periodOpen = uniqueRecords.length > 0 ? uniqueRecords[0].open : 0;
  const periodClose = uniqueRecords.length > 0 ? uniqueRecords[uniqueRecords.length - 1].close : 0;
  const netChange = Number((periodClose - periodOpen).toFixed(2));
  const netChangePercent = periodOpen !== 0 ? Number(((netChange / periodOpen) * 100).toFixed(2)) : 0;

  const firstDate = uniqueRecords[0]?.date + (uniqueRecords[0]?.time ? ` ${uniqueRecords[0].time}` : '');
  const lastDate =
    uniqueRecords[uniqueRecords.length - 1]?.date +
    (uniqueRecords[uniqueRecords.length - 1]?.time ? ` ${uniqueRecords[uniqueRecords.length - 1].time}` : '');

  return {
    records: uniqueRecords,
    summary: {
      periodHigh: periodHigh === -Infinity ? 0 : Number(periodHigh.toFixed(2)),
      periodLow: periodLow === Infinity ? 0 : Number(periodLow.toFixed(2)),
      periodOpen: Number(periodOpen.toFixed(2)),
      periodClose: Number(periodClose.toFixed(2)),
      netChange,
      netChangePercent,
      totalVolume,
      bullishCandles,
      bearishCandles,
      dojiCandles,
      validCandles,
      invalidCandles,
    },
    firstDate,
    lastDate,
  };
}
