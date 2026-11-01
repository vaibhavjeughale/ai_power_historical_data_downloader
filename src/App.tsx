import React, { useState, useEffect, useCallback } from 'react';
import {
  Header,
} from './components/Header';
import { AiAssistant } from './components/AiAssistant';
import { InstrumentSelector } from './components/InstrumentSelector';
import { TimeframeSelector } from './components/TimeframeSelector';
import { DateRangeSelector } from './components/DateRangeSelector';
import { DataSummary } from './components/DataSummary';
import { CandlestickChart } from './components/CandlestickChart';
import { DataPreviewTable } from './components/DataPreviewTable';
import { DownloadSection } from './components/DownloadSection';
import { RangeAnalysisModal } from './components/RangeAnalysisModal';

import { MASTER_INSTRUMENTS } from './config/instruments';
import { MarketInstrument, TimeframeId, HistoricalDataResponse, DataProviderInfo } from './types/market';
import { fetchInstruments, fetchProviders, fetchHistoricalMarketData } from './services/apiClient';
import { formatDateForInput, validateDateRange } from './utils/dateHelpers';
import { Play, RefreshCw, AlertCircle, Sparkles, SlidersHorizontal, BarChart } from 'lucide-react';

export default function App() {
  // App configurations
  const [instruments, setInstruments] = useState<MarketInstrument[]>(MASTER_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument>(MASTER_INSTRUMENTS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeId>('1d');

  // Dates
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState<string>(formatDateForInput(thirtyDaysAgo));
  const [endDate, setEndDate] = useState<string>(formatDateForInput(today));
  const [activeQuickRangeId, setActiveQuickRangeId] = useState<string>('30d');

  // Providers
  const [providers, setProviders] = useState<DataProviderInfo[]>([
    {
      id: 'yahoo',
      name: 'Yahoo Finance (Real Market Feed)',
      description: 'Authoritative live market feed for Indian Indices, Equities & Commodities',
      isMock: false,
      supportedTimeframes: ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
      intradayMaxDays: 60,
      status: 'active',
    },
    {
      id: 'mock_sandbox',
      name: 'Developer Sandbox (Offline Test Feed)',
      description: 'Deterministic offline simulation feed for unit testing and development',
      isMock: true,
      supportedTimeframes: ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
      intradayMaxDays: 365,
      status: 'active',
    },
  ]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('yahoo');

  // Data fetching state
  const [historicalData, setHistoricalData] = useState<HistoricalDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // Load server instruments and providers on mount
  useEffect(() => {
    fetchInstruments()
      .then((res) => {
        if (res.instruments && res.instruments.length > 0) {
          setInstruments(res.instruments);
        }
      })
      .catch((err) => console.warn('Could not load remote instruments:', err));

    fetchProviders()
      .then((res) => {
        if (res.providers && res.providers.length > 0) {
          setProviders(res.providers);
          if (res.defaultProvider) {
            setSelectedProviderId(res.defaultProvider);
          }
        }
      })
      .catch((err) => console.warn('Could not load remote providers:', err));
  }, []);

  // Fetch data function
  const handleFetchData = useCallback(async (
    targetInstrument = selectedInstrument,
    targetTimeframe = selectedTimeframe,
    targetStart = startDate,
    targetEnd = endDate,
    targetProvider = selectedProviderId
  ) => {
    // Validate range
    const validation = validateDateRange(targetStart, targetEnd, targetTimeframe);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid date range.');
      return;
    }

    setWarningMessage(validation.warning || null);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetchHistoricalMarketData({
        instrument: targetInstrument.id,
        symbol: targetInstrument.symbol,
        exchange: targetInstrument.exchange,
        timeframe: targetTimeframe,
        startDate: targetStart,
        endDate: targetEnd,
        providerId: targetProvider,
      });

      setHistoricalData(response);
      if (response.warning) {
        setWarningMessage(response.warning);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch historical market data from provider.');
      // Keep previous data if any, or set error
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstrument, selectedTimeframe, startDate, endDate, selectedProviderId]);

  // Initial fetch on mount for immediate preview of NIFTY 50
  useEffect(() => {
    handleFetchData(MASTER_INSTRUMENTS[0], '1d', formatDateForInput(thirtyDaysAgo), formatDateForInput(today), 'yahoo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI parameter apply handler
  const handleAiApply = (params: {
    instrumentId: string;
    timeframe: TimeframeId;
    startDate: string;
    endDate: string;
    autoFetch?: boolean;
  }) => {
    const foundInst = instruments.find((i) => i.id === params.instrumentId) || selectedInstrument;
    setSelectedInstrument(foundInst);
    setSelectedTimeframe(params.timeframe);
    setStartDate(params.startDate);
    setEndDate(params.endDate);
    setActiveQuickRangeId('');

    if (params.autoFetch) {
      handleFetchData(foundInst, params.timeframe, params.startDate, params.endDate, selectedProviderId);
    }
  };

  const handleApplyDateRange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleAddCustomInstrument = (newInst: MarketInstrument) => {
    setInstruments((prev) => [newInst, ...prev]);
    setSelectedInstrument(newInst);
  };

  const isMockActive = selectedProviderId === 'mock_sandbox';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        providers={providers}
        selectedProviderId={selectedProviderId}
        onSelectProvider={(id) => {
          setSelectedProviderId(id);
          // Refetch with new provider
          handleFetchData(selectedInstrument, selectedTimeframe, startDate, endDate, id);
        }}
        isMockActive={isMockActive}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Optional AI Assistant Section */}
        <AiAssistant
          onApplyParameters={handleAiApply}
          isLoading={isLoading}
        />

        {/* Main Filter Configuration Panel */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Market Data Query Parameters
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Provider: <strong className="text-cyan-400">{providers.find(p => p.id === selectedProviderId)?.name || 'Default'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Instrument Selector (Col 1-4) */}
            <div className="lg:col-span-4">
              <InstrumentSelector
                instruments={instruments}
                selectedInstrument={selectedInstrument}
                onSelectInstrument={(inst) => {
                  setSelectedInstrument(inst);
                }}
                onAddCustomInstrument={handleAddCustomInstrument}
              />
            </div>

            {/* Timeframe Selector (Col 5-8) */}
            <div className="lg:col-span-4">
              <TimeframeSelector
                selectedTimeframe={selectedTimeframe}
                onSelectTimeframe={(tf) => setSelectedTimeframe(tf)}
                startDate={startDate}
                endDate={endDate}
              />
            </div>

            {/* Date Range Selector (Col 9-12) */}
            <div className="lg:col-span-4">
              <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                timeframe={selectedTimeframe}
                onChangeStartDate={(d) => {
                  setStartDate(d);
                  setActiveQuickRangeId('');
                }}
                onChangeEndDate={(d) => {
                  setEndDate(d);
                  setActiveQuickRangeId('');
                }}
                onApplyRange={(s, e) => {
                  handleApplyDateRange(s, e);
                  setActiveQuickRangeId('');
                }}
                activeQuickRangeId={activeQuickRangeId}
              />
            </div>
          </div>

          {/* Warnings or Error Banners */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Market Data Provider Notice:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {warningMessage && !errorMessage && (
            <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Fetch Historical Data Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              Querying <span className="text-white font-semibold">{selectedInstrument.name}</span> on{' '}
              <span className="text-cyan-400 font-mono">{selectedInstrument.exchange}</span> • Resolution{' '}
              <span className="text-white font-semibold uppercase">{selectedTimeframe}</span>
            </div>

            <button
              type="button"
              onClick={() => handleFetchData()}
              disabled={isLoading}
              className="py-3 px-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fetching Market Candles...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Fetch Historical Data</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Data Results & Preview Sections */}
        {historicalData && (
          <div className="space-y-6">
            {/* Data Summary Card */}
            <DataSummary
              dataResponse={historicalData}
              onOpenAnalysis={() => setShowAnalysisModal(true)}
            />

            {/* Candlestick Chart Preview */}
            <CandlestickChart
              data={historicalData.data}
              instrumentName={historicalData.instrument.name}
              timeframe={historicalData.timeframe}
            />

            {/* Data Preview Table */}
            <DataPreviewTable
              data={historicalData.data}
              totalRecords={historicalData.totalRecords}
              isLoading={isLoading}
              timeframe={historicalData.timeframe}
            />

            {/* Download Section (Excel & CSV) */}
            <DownloadSection
              dataResponse={historicalData}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Empty State when no data */}
        {!historicalData && !isLoading && !errorMessage && (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
              <Play className="w-6 h-6 ml-0.5" />
            </div>
            <h3 className="text-sm font-bold text-white">No Market Data Loaded Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select your instrument, timeframe, and date range above and click <strong>Fetch Historical Data</strong> or use the AI Assistant to query data.
            </p>
          </div>
        )}
      </main>

      {/* Range Analysis Modal */}
      {showAnalysisModal && historicalData && (
        <RangeAnalysisModal
          dataResponse={historicalData}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Market Historical Data Downloader • Multi-timeframe OHLC Excel Exporter
          </div>
          <div className="text-[11px]">
            Strict Data Quality Engine: High ≥ max(O,C) & Low ≤ min(O,C) mathematically audited.
          </div>
        </div>
      </footer>
    </div>
  );
}
