import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { TimeframeId, TimeframeConfig } from '../types/market';
import { SUPPORTED_TIMEFRAMES } from '../config/instruments';

interface TimeframeSelectorProps {
  selectedTimeframe: TimeframeId;
  onSelectTimeframe: (timeframe: TimeframeId) => void;
  startDate: string;
  endDate: string;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onSelectTimeframe,
  startDate,
  endDate,
}) => {
  const currentConfig = SUPPORTED_TIMEFRAMES.find((t) => t.id === selectedTimeframe) || SUPPORTED_TIMEFRAMES[0];

  const intradayTimeframes = SUPPORTED_TIMEFRAMES.filter((t) => t.category === 'intraday');
  const dailyTimeframes = SUPPORTED_TIMEFRAMES.filter((t) => t.category === 'daily_plus');

  // Compute date diff in days for quick warning
  let daysDiff = 0;
  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      daysDiff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    }
  }

  const isOneMinOverLimit = selectedTimeframe === '1m' && daysDiff > 7;
  const isIntradayOverLimit = ['3m', '5m', '10m', '15m', '30m'].includes(selectedTimeframe) && daysDiff > 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Candle Timeframe / Resolution</span>
        </label>
        <span className="text-[11px] text-cyan-400 font-mono font-medium">
          Selected: {currentConfig.label}
        </span>
      </div>

      {/* Timeframe Button Groups */}
      <div className="space-y-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        {/* Intraday */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Intraday Timeframes
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {intradayTimeframes.map((tf) => {
              const isSelected = selectedTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => onSelectTimeframe(tf.id)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all duration-150 border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {tf.label.replace('Minute', 'Min').replace('Minutes', 'Min').replace('Hour', 'Hr')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily and Higher */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Daily & Higher (Multi-Year Historical)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {dailyTimeframes.map((tf) => {
              const isSelected = selectedTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => onSelectTimeframe(tf.id)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all duration-150 border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe description caption */}
        <p className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
          <span>{currentConfig.description}</span>
          <span className="font-mono text-[10px] text-slate-400">ID: {currentConfig.id}</span>
        </p>

        {/* Warning if requested date range exceeds provider intraday limit */}
        {isOneMinOverLimit && (
          <div className="p-2.5 bg-amber-950/50 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Provider Limit Notice:</strong> 1-minute intraday data is restricted to a maximum of 7 days by public market data feeds. Your selected date span is {daysDiff} days. Please reduce your date window or select a 5-minute or 1-day timeframe.
            </span>
          </div>
        )}

        {isIntradayOverLimit && (
          <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-lg text-xs text-blue-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Intraday Notice:</strong> Your selected range is {daysDiff} days. Public providers offer up to the last 60 days of {currentConfig.label} data. Older bars will be skipped by the provider.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
