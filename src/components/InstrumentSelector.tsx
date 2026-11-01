import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Layers, BarChart2, DollarSign, PlusCircle } from 'lucide-react';
import { MarketInstrument, AssetType, Exchange } from '../types/market';

interface InstrumentSelectorProps {
  instruments: MarketInstrument[];
  selectedInstrument: MarketInstrument;
  onSelectInstrument: (instrument: MarketInstrument) => void;
  onAddCustomInstrument?: (instrument: MarketInstrument) => void;
}

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  instruments,
  selectedInstrument,
  onSelectInstrument,
  onAddCustomInstrument,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | 'ALL'>('ALL');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  
  // Custom instrument form state
  const [customName, setCustomName] = useState<string>('');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [customExchange, setCustomExchange] = useState<Exchange>('NSE');
  const [customAssetType, setCustomAssetType] = useState<AssetType>('EQUITY');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredInstruments = useMemo(() => {
    return instruments.filter((inst) => {
      const matchesType = selectedAssetType === 'ALL' || inst.assetType === selectedAssetType;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        inst.name.toLowerCase().includes(query) ||
        inst.symbol.toLowerCase().includes(query) ||
        inst.exchange.toLowerCase().includes(query) ||
        (inst.description && inst.description.toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [instruments, selectedAssetType, searchQuery]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customSymbol) return;

    const newInst: MarketInstrument = {
      id: customSymbol.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      name: customName,
      symbol: customSymbol.toUpperCase(),
      exchange: customExchange,
      assetType: customAssetType,
      supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
      providerSymbols: {
        yahoo: customSymbol.includes('.') || customSymbol.includes('=') ? customSymbol : `${customSymbol}.${customExchange === 'BSE' ? 'BO' : 'NS'}`,
      },
      description: `User-added custom instrument on ${customExchange}`,
    };

    if (onAddCustomInstrument) {
      onAddCustomInstrument(newInst);
    }
    onSelectInstrument(newInst);
    setShowCustomModal(false);
    setIsOpen(false);
    setCustomName('');
    setCustomSymbol('');
  };

  const getExchangeBadgeColor = (ex: Exchange) => {
    switch (ex) {
      case 'NSE':
        return 'bg-blue-950 text-blue-400 border-blue-800/60';
      case 'BSE':
        return 'bg-purple-950 text-purple-400 border-purple-800/60';
      case 'MCX':
        return 'bg-amber-950 text-amber-400 border-amber-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Market Instrument</span>
        </span>
        <span className="text-[11px] text-slate-400 font-normal">
          {instruments.length} Available
        </span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0 border border-slate-700">
            {selectedInstrument.symbol.slice(0, 2)}
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm truncate">{selectedInstrument.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getExchangeBadgeColor(selectedInstrument.exchange)}`}>
                {selectedInstrument.exchange}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-2 font-mono">
              <span>Symbol: {selectedInstrument.symbol}</span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{selectedInstrument.assetType}</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol (NIFTY, SENSEX, RELIANCE)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            {/* Asset Type Tabs */}
            <div className="flex items-center space-x-1 mt-2 text-[11px]">
              {(['ALL', 'INDEX', 'EQUITY', 'COMMODITY'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedAssetType(type)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedAssetType === type
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>

          {/* List of instruments */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
            {filteredInstruments.length > 0 ? (
              filteredInstruments.map((inst) => {
                const isSelected = inst.id === selectedInstrument.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      onSelectInstrument(inst);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300 shrink-0">
                        {inst.symbol.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-100'}`}>
                            {inst.name}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono border ${getExchangeBadgeColor(inst.exchange)}`}>
                            {inst.exchange}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          Symbol: <span className="text-slate-300 font-mono">{inst.symbol}</span> • {inst.description || inst.assetType}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No instruments match "{searchQuery}".
              </div>
            )}
          </div>

          {/* Custom Instrument Button Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Want another ticker?</span>
            <button
              type="button"
              onClick={() => {
                setShowCustomModal(true);
                setIsOpen(false);
              }}
              className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-slate-800 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Custom Ticker</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Ticker Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Add Custom Market Instrument</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter any exchange ticker symbol (e.g. <code>TATAMOTORS.NS</code>, <code>AAPL</code>, <code>BTC-USD</code>).
            </p>

            <form onSubmit={handleAddCustom} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Instrument Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Motors Ltd"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Exchange Symbol / Ticker</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TATAMOTORS.NS or TATAMOTORS"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Exchange</label>
                  <select
                    value={customExchange}
                    onChange={(e) => setCustomExchange(e.target.value as Exchange)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="MCX">MCX</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Asset Type</label>
                  <select
                    value={customAssetType}
                    onChange={(e) => setCustomAssetType(e.target.value as AssetType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="EQUITY">EQUITY</option>
                    <option value="INDEX">INDEX</option>
                    <option value="COMMODITY">COMMODITY</option>
                    <option value="CURRENCY">CURRENCY</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs"
                >
                  Add Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
