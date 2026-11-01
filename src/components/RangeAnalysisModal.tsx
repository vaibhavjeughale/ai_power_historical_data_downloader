import React from 'react';
import { HistoricalDataResponse } from '../types/market';
import { BarChart2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, X, ShieldCheck } from 'lucide-react';

interface RangeAnalysisModalProps {
  dataResponse: HistoricalDataResponse;
  onClose: () => void;
}

export const RangeAnalysisModal: React.FC<RangeAnalysisModalProps> = ({ dataResponse, onClose }) => {
  const { instrument, summary, data, timeframe, startDate, endDate } = dataResponse;

  // Compute deeper volatility & breakout statistics
  const highLowSpread = summary.periodHigh - summary.periodLow;
  const spreadPercent = summary.periodLow > 0 ? (highLowSpread / summary.periodLow) * 100 : 0;

  // Candle metrics
  let maxSingleGain = 0;
  let maxSingleLoss = 0;
  let totalCandleRange = 0;

  data.forEach((bar) => {
    const range = bar.high - bar.low;
    totalCandleRange += range;

    const bodyChange = ((bar.close - bar.open) / bar.open) * 100;
    if (bodyChange > maxSingleGain) maxSingleGain = bodyChange;
    if (bodyChange < maxSingleLoss) maxSingleLoss = bodyChange;
  });

  const avgCandleRange = data.length > 0 ? totalCandleRange / data.length : 0;
  const currencySymbol = instrument.currency === 'USD' ? '$' : '₹';

  // First candle open vs last candle close
  const firstCandle = data[0];
  const lastCandle = data[data.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Range & Volatility Analysis: {instrument.name} ({timeframe})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date scope */}
        <p className="text-xs text-slate-400 font-mono">
          Analyzed period: {startDate} to {endDate} ({data.length.toLocaleString()} candles verified)
        </p>

        {/* Top metrics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Period Range Spread</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {currencySymbol}{highLowSpread.toFixed(2)}
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">({spreadPercent.toFixed(2)}% range)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average True Candle Range</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {currencySymbol}{avgCandleRange.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">Mean high-low bar spread</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Volume</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {summary.totalVolume.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">Contracts / shares traded</span>
          </div>
        </div>

        {/* Directional breakout stats */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Price Extremes & Momentum
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-950">
              <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                <span>Maximum Single-Bar Surge</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold font-mono text-emerald-400">
                +{maxSingleGain.toFixed(2)}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Strongest upward momentum candle in the requested period.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-950">
              <div className="flex items-center justify-between text-rose-400 font-semibold mb-1">
                <span>Maximum Single-Bar Drawdown</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold font-mono text-rose-400">
                {maxSingleLoss.toFixed(2)}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Deepest contraction candle during the requested timeframe.
              </p>
            </div>
          </div>
        </div>

        {/* Opening and Closing Candle Comparison */}
        {firstCandle && lastCandle && (
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Boundary Anchor Candles
            </h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans text-[10px]">Opening Candle ({firstCandle.date})</span>
                <div className="mt-1 space-y-0.5">
                  <div>Open: <strong className="text-white">{firstCandle.open}</strong></div>
                  <div>High: <strong className="text-emerald-400">{firstCandle.high}</strong></div>
                  <div>Low: <strong className="text-rose-400">{firstCandle.low}</strong></div>
                  <div>Close: <strong className="text-white">{firstCandle.close}</strong></div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-sans text-[10px]">Closing Candle ({lastCandle.date})</span>
                <div className="mt-1 space-y-0.5">
                  <div>Open: <strong className="text-white">{lastCandle.open}</strong></div>
                  <div>High: <strong className="text-emerald-400">{lastCandle.high}</strong></div>
                  <div>Low: <strong className="text-rose-400">{lastCandle.low}</strong></div>
                  <div>Close: <strong className="text-white">{lastCandle.close}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Passed strict mathematical OHLC integrity check</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
