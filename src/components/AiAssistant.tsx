import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, CornerDownLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { AiParsedRequest, TimeframeId } from '../types/market';
import { parseAiQuery } from '../services/apiClient';
import { formatHumanDate } from '../utils/dateHelpers';

interface AiAssistantProps {
  onApplyParameters: (params: {
    instrumentId: string;
    timeframe: TimeframeId;
    startDate: string;
    endDate: string;
    autoFetch?: boolean;
  }) => void;
  isLoading: boolean;
}

const SAMPLE_QUERIES = [
  'Download NIFTY 5-minute data for January 2025',
  'Get BANKNIFTY daily data from 2023 to 2025',
  'Download SENSEX data for the last 6 months',
  'Fetch RELIANCE 15-minute data for the last 7 days',
  'Get GOLD daily data for year to date',
];

export const AiAssistant: React.FC<AiAssistantProps> = ({ onApplyParameters, isLoading: isParentLoading }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<AiParsedRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleParse = async (queryText?: string) => {
    const textToSubmit = queryText || prompt;
    if (!textToSubmit.trim()) return;

    setIsParsing(true);
    setErrorMessage(null);
    setParsedResult(null);

    try {
      const result = await parseAiQuery(textToSubmit);
      setParsedResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to interpret prompt. Please refine your query.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  };

  const handleConfirmAndFetch = () => {
    if (!parsedResult) return;
    onApplyParameters({
      instrumentId: parsedResult.instrumentId,
      timeframe: parsedResult.timeframe,
      startDate: parsedResult.startDate,
      endDate: parsedResult.endDate,
      autoFetch: true,
    });
  };

  const handleApplyFormOnly = () => {
    if (!parsedResult) return;
    onApplyParameters({
      instrumentId: parsedResult.instrumentId,
      timeframe: parsedResult.timeframe,
      startDate: parsedResult.startDate,
      endDate: parsedResult.endDate,
      autoFetch: false,
    });
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-cyan-900/40 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              AI Market Query Assistant
            </h2>
            <p className="text-[11px] text-slate-400">
              Type what data you need in plain English — Gemini extracts instrument, timeframe, and dates
            </p>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800 self-start sm:self-auto">
          Gemini 3.8 Flash • Strictly Interprets Parameters
        </span>
      </div>

      {/* Input Box */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Download NIFTY 5-minute data for January 2025" or "Get SENSEX daily data for 2024"'
          className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 pr-28 transition-colors outline-none"
        />
        <div className="absolute right-1.5 flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={isParsing || !prompt.trim()}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Interpreting...</span>
              </>
            ) : (
              <>
                <span>Parse</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example Prompt Pills */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Prompts:</span>
        {SAMPLE_QUERIES.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setPrompt(sample);
              handleParse(sample);
            }}
            className="text-[11px] bg-slate-800/70 hover:bg-slate-700/80 hover:text-cyan-300 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
          >
            "{sample}"
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Confirmation Card */}
      {parsedResult && (
        <div className="mt-4 p-4 bg-slate-950/90 border border-cyan-800/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Interpreted Request Confirmation</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-mono">
              Confidence: {Math.round(parsedResult.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Instrument</span>
              <span className="font-bold text-white text-xs mt-0.5 block truncate">
                {parsedResult.instrumentName}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">({parsedResult.symbol})</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Timeframe</span>
              <span className="font-bold text-white text-xs mt-0.5 block">
                {parsedResult.timeframe.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400">Resolution</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Start Date</span>
              <span className="font-bold text-white text-xs mt-0.5 block font-mono">
                {parsedResult.startDate}
              </span>
              <span className="text-[10px] text-slate-400">{formatHumanDate(parsedResult.startDate)}</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">End Date</span>
              <span className="font-bold text-white text-xs mt-0.5 block font-mono">
                {parsedResult.endDate}
              </span>
              <span className="text-[10px] text-slate-400">{formatHumanDate(parsedResult.endDate)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            "{parsedResult.explanation}"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleApplyFormOnly}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              Fill Form Parameters Only
            </button>
            <button
              type="button"
              onClick={handleConfirmAndFetch}
              disabled={isParentLoading}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-900/30 transition"
            >
              <span>Confirm & Fetch Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
