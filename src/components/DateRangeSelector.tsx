import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { QUICK_RANGES, MONTHS, getYearsList, getDateRangeForYearAndMonth } from '../utils/dateHelpers';
import { TimeframeId } from '../types/market';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  timeframe: TimeframeId;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  onApplyRange: (startDate: string, endDate: string) => void;
  activeQuickRangeId?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  timeframe,
  onChangeStartDate,
  onChangeEndDate,
  onApplyRange,
  activeQuickRangeId,
}) => {
  const years = getYearsList();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Today string for max limit
  const todayStr = new Date().toISOString().split('T')[0];

  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    const range = getDateRangeForYearAndMonth(year, month);
    onApplyRange(range.startDate, range.endDate);
  };

  // Validation
  let validationError: string | null = null;
  if (startDate && endDate) {
    if (startDate > endDate) {
      validationError = 'Start date cannot be after end date.';
    } else if (startDate > todayStr || endDate > todayStr) {
      validationError = 'Future dates are not permitted.';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Historical Date Range</span>
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          {startDate} to {endDate}
        </span>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3.5">
        {/* Quick Range Buttons */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Quick Selections
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_RANGES.map((qr) => {
              const isSelected = activeQuickRangeId === qr.id;
              return (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => {
                    const range = qr.getRange();
                    onApplyRange(range.startDate, range.endDate);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold shadow-sm'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {qr.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Year and Month Quick Selectors */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Quick Month & Year Filter (Auto-Calculates Range)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="quick-select-year" className="text-[11px] text-slate-400 block mb-1">Select Year</label>
              <select
                id="quick-select-year"
                value={selectedYear}
                onChange={(e) => handleYearMonthChange(parseInt(e.target.value, 10), selectedMonth)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quick-select-month" className="text-[11px] text-slate-400 block mb-1">Select Month</label>
              <select
                id="quick-select-month"
                value={selectedMonth}
                onChange={(e) => handleYearMonthChange(selectedYear, parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom Start & End Date Pickers */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Custom Start & End Date
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-start-date" className="text-[11px] text-slate-400 block mb-1">Start Date</label>
              <input
                id="custom-start-date"
                type="date"
                max={todayStr}
                value={startDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="custom-end-date" className="text-[11px] text-slate-400 block mb-1">End Date</label>
              <input
                id="custom-end-date"
                type="date"
                max={todayStr}
                value={endDate}
                onChange={(e) => onChangeEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Real-time validation warning */}
        {validationError && (
          <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
