import React, { useState, useMemo } from 'react';
import { OHLCRecord } from '../types/market';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface DataPreviewTableProps {
  data: OHLCRecord[];
  totalRecords: number;
  isLoading: boolean;
  timeframe: string;
}

type SortField = 'date' | 'time' | 'open' | 'high' | 'low' | 'close' | 'volume';
type SortOrder = 'asc' | 'desc';

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  totalRecords,
  isLoading,
  timeframe,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100); // 100 records default as required
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // chronological default

  const isDailyOrHigher = ['1d', '1wk', '1mo'].includes(timeframe);

  // Filter and search
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Date filter
      if (dateFilter && row.date !== dateFilter) {
        return false;
      }

      // Search query across date, time, ohlc, symbol, etc.
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rowStr = `${row.date} ${row.time || ''} ${row.open} ${row.high} ${row.low} ${row.close} ${row.volume} ${row.symbol} ${row.instrument}`.toLowerCase();
        return rowStr.includes(q);
      }

      return true;
    });
  }, [data, searchQuery, dateFilter]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'date' || sortField === 'time') {
        valA = a.timestamp;
        valB = b.timestamp;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-400 ml-1 inline" />
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-3">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white tracking-wide">Historical OHLC Data Preview</h3>
            <span className="text-[11px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full">
              Showing {paginatedRows.length} of {sortedData.length.toLocaleString()} (Total {totalRecords.toLocaleString()})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronologically validated dataset • Ready for multi-sheet Excel export
          </p>
        </div>

        {/* Search, Date Filter & Page Size */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in records..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 w-40 sm:w-48 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Specific Date Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 outline-none font-mono"
              title="Filter by specific date"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[10px] text-slate-400 hover:text-white px-1"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Page Size Dropdown */}
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700/80 text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100 (Default)</option>
              <option value="250">250</option>
              <option value="500">500</option>
              <option value="1000">1,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs text-slate-300 font-mono">
          <thead className="bg-slate-950/90 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 select-none sticky top-0 z-10">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                Date {renderSortIcon('date')}
              </th>
              {!isDailyOrHigher && (
                <th
                  onClick={() => handleSort('time')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Time {renderSortIcon('time')}
                </th>
              )}
              <th
                onClick={() => handleSort('open')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                Open {renderSortIcon('open')}
              </th>
              <th
                onClick={() => handleSort('high')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                High {renderSortIcon('high')}
              </th>
              <th
                onClick={() => handleSort('low')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                Low {renderSortIcon('low')}
              </th>
              <th
                onClick={() => handleSort('close')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                Close {renderSortIcon('close')}
              </th>
              <th
                onClick={() => handleSort('volume')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                Volume {renderSortIcon('volume')}
              </th>
              <th className="py-3 px-3 text-center">Change</th>
              <th className="py-3 px-3 text-center">Symbol</th>
              <th className="py-3 px-3 text-center">Exchange</th>
              <th className="py-3 px-3 text-center">Timeframe</th>
              <th className="py-3 px-2 text-center">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, index) => {
                const isBullish = row.close >= row.open;
                const changeAmount = row.close - row.open;
                const changePct = row.open !== 0 ? (changeAmount / row.open) * 100 : 0;

                return (
                  <tr
                    key={`${row.timestamp}-${index}`}
                    className={`hover:bg-slate-800/60 transition-colors ${
                      index % 2 === 1 ? 'bg-slate-950/30' : ''
                    } ${!row.isValid ? 'bg-rose-950/30 text-rose-300' : ''}`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-200">
                      {row.date}
                    </td>
                    {!isDailyOrHigher && (
                      <td className="py-2.5 px-3 whitespace-nowrap text-cyan-400">
                        {row.time || '—'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {row.open.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {row.high.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                      {row.low.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isBullish ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.close.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {row.volume.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center text-[11px] font-semibold ${
                        isBullish ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isBullish ? '+' : ''}
                      {changePct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                      {row.symbol}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {row.exchange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                      {row.timeframe}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {row.isValid ? (
                        <span title="OHLC valid: High >= max(O,C) and Low <= min(O,C)">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                        </span>
                      ) : (
                        <span title={row.validationError || 'Invalid candle geometry'}>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 inline" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching market data from provider...</span>
                    </div>
                  ) : (
                    <span>No records found matching your filters.</span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing <span className="text-white font-mono">{startIndex + 1}</span> to{' '}
          <span className="text-white font-mono">{Math.min(startIndex + pageSize, sortedData.length)}</span> of{' '}
          <span className="text-white font-mono">{sortedData.length.toLocaleString()}</span> entries
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-md transition"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-md transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-mono text-slate-200">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-md transition"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded-md transition"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
