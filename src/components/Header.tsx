import React, { useState, useEffect } from 'react';
import { TrendingUp, Database, ShieldCheck, Clock, Server, Info, AlertTriangle } from 'lucide-react';
import { DataProviderInfo } from '../types/market';

interface HeaderProps {
  providers: DataProviderInfo[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
  isMockActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  providers,
  selectedProviderId,
  onSelectProvider,
  isMockActive,
}) => {
  const [currentTimeIST, setCurrentTimeIST] = useState<string>('');
  const [currentTimeUTC, setCurrentTimeUTC] = useState<string>('');
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTimeIST(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentTimeUTC(
        now.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' UTC'
      );
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Market Historical Data Downloader</h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  v2.0 Full-Stack
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Professional OHLC data export for Indices, Stocks & Commodities
              </p>
            </div>
          </div>

          {/* Clocks & Provider Selector */}
          <div className="flex items-center space-x-3">
            {/* Clocks */}
            <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-lg">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">IST:</span>
                <span className="font-mono font-medium text-slate-200">{currentTimeIST || '09:15:00 AM'}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="text-slate-400 font-mono text-[11px]">{currentTimeUTC}</div>
            </div>

            {/* Configured Data Source Selector */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="flex items-center bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg p-1 text-xs">
                  <div className="flex items-center pl-2 pr-1 space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${isMockActive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => onSelectProvider(e.target.value)}
                    aria-label="Select Market Data Provider Feed"
                    className="bg-transparent text-slate-200 font-medium py-1 pr-6 pl-1 focus:outline-none cursor-pointer text-xs"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                        {p.name} {p.isMock ? '(Sandbox)' : '(Live)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Provider Info Button */}
              <button
                type="button"
                onClick={() => setShowProviderModal(true)}
                title="View Data Source Architecture details"
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mock Mode Alert Bar (if active) */}
        {isMockActive && (
          <div className="bg-amber-950/70 border-t border-b border-amber-800/50 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Developer Sandbox Active:</strong> Currently simulating offline data for unit testing. Switch to "Yahoo Finance (Real Market Feed)" above for actual exchange data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectProvider('yahoo')}
                className="underline font-semibold hover:text-white shrink-0 ml-4"
              >
                Switch to Live Feed
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Provider Details Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Configured Market Data Architecture</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This application implements a modular backend <code>MarketDataProvider</code> adapter architecture. Market data is fetched authoritatively from the configured provider with strict mathematical verification:
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/40">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Real Market Feed (Yahoo Finance Adapter)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fetches live exchange candles for NSE indices (^NSEI, ^NSEBANK), BSE (^BSESN), equities (Reliance, TCS, INFY), and global commodities (Crude, Gold). Handles multi-resolution intraday aggregation and public provider rate limits.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-1">
                  <Server className="w-4 h-4" />
                  <span>Developer Sandbox Feed (Offline Testing)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Provides reproducible deterministic candles matching real price levels for offline unit testing and automated QA when external exchange network connectivity is restricted.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Data Validation Rules:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Chronological sorting and duplicate timestamp removal.</li>
                <li>Strict rule: High ≥ max(Open, Close) and Low ≤ min(Open, Close).</li>
                <li>Missing candles are never silently fabricated.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
