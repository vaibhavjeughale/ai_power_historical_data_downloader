import React from 'react';
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  ShieldCheck,
  BarChart,
} from 'lucide-react';
import { HistoricalDataResponse } from '../types/market';
import { formatHumanDate } from '../utils/dateHelpers';

interface DataSummaryProps {
  dataResponse: HistoricalDataResponse;
  onOpenAnalysis: () => void;
}

export const DataSummary: React.FC<DataSummaryProps> = ({ dataResponse, onOpenAnalysis }) => {
  const { instrument, timeframe, startDate, endDate, totalRecords, dataSource, isMockData, summary } = dataResponse;

  const isNetPositive = summary.netChange >= 0;
  const currencySymbol = instrument.currency === 'USD' ? '$' : '₹';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-bold text-sm">
            {instrument.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base tracking-tight">{instrument.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {instrument.exchange}: {instrument.symbol}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Data Feed: <span className="font-semibold text-slate-200">{dataSource}</span>
            </p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% OHLC Verified</span>
          </div>

          <button
            type="button"
            onClick={onOpenAnalysis}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-medium transition"
          >
            <BarChart className="w-3.5 h-3.5" />
            <span>Range Analysis</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Records */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Total Records</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {totalRecords.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400">Candles Fetched</span>
        </div>

        {/* Timeframe */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Timeframe</span>
          <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5 block uppercase">
            {timeframe}
          </span>
          <span className="text-[11px] text-slate-400">Resolution</span>
        </div>

        {/* Date Range */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 col-span-2">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Date Range</span>
          <span className="text-sm font-bold text-slate-200 font-mono mt-1 block truncate">
            {formatHumanDate(startDate)} → {formatHumanDate(endDate)}
          </span>
          <span className="text-[11px] text-slate-400">
            First: {dataResponse.firstDate || startDate} • Last: {dataResponse.lastDate || endDate}
          </span>
        </div>

        {/* Net Period Return */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Net Change</span>
          <div className="flex items-center space-x-1 mt-0.5">
            {isNetPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-base font-bold font-mono ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isNetPositive ? '+' : ''}{summary.netChangePercent}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {isNetPositive ? '+' : ''}{currencySymbol}{summary.netChange.toLocaleString()}
          </span>
        </div>

        {/* Period High / Low */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Period High / Low</span>
          <span className="text-xs font-bold text-emerald-400 font-mono block mt-0.5">
            H: {currencySymbol}{summary.periodHigh.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-rose-400 font-mono block">
            L: {currencySymbol}{summary.periodLow.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Candle Sentiment Distribution */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800/60 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold">{summary.bullishCandles}</span>
            <span>Bullish Candles</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-semibold">{summary.bearishCandles}</span>
            <span>Bearish Candles</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-300 font-semibold">{summary.dojiCandles}</span>
            <span>Doji / Neutral</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Total Volume: <span className="text-slate-200 font-semibold">{summary.totalVolume.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
