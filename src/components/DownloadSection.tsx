import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Check, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import { HistoricalDataResponse } from '../types/market';
import { downloadExcelFile, downloadCsvFile } from '../services/apiClient';

interface DownloadSectionProps {
  dataResponse: HistoricalDataResponse | null;
  isLoading: boolean;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ dataResponse, isLoading }) => {
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!dataResponse || dataResponse.totalRecords === 0) {
    return null;
  }

  const { instrument, timeframe, startDate, endDate, totalRecords } = dataResponse;

  const expectedFileName = `${instrument.id.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}_${timeframe.toUpperCase().replace('M', 'MIN').replace('H', 'HOUR').replace('D', 'DAY')}_${startDate}_TO_${endDate}.xlsx`;

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    setDownloadError(null);
    try {
      await downloadExcelFile(dataResponse);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download Excel file.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadCsv = async () => {
    setIsExportingCsv(true);
    setDownloadError(null);
    try {
      await downloadCsvFile(dataResponse);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download CSV file.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleCopySummary = () => {
    const text = `Instrument: ${instrument.name} (${instrument.symbol})
Exchange: ${instrument.exchange}
Timeframe: ${timeframe}
Date Range: ${startDate} to ${endDate}
Total Records: ${totalRecords.toLocaleString()}
High: ${dataResponse.summary.periodHigh}
Low: ${dataResponse.summary.periodLow}
Net Change: ${dataResponse.summary.netChange} (${dataResponse.summary.netChangePercent}%)
Total Volume: ${dataResponse.summary.totalVolume.toLocaleString()}
Data Source: ${dataResponse.dataSource}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/60 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Export Historical Dataset</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-formatted 2-Sheet Excel Workbook & RFC-4180 CSV with verified OHLC candles
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Target: <code className="text-cyan-400">{expectedFileName}</code>
          </span>
        </div>
      </div>

      {downloadError && (
        <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Buttons and Format details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Excel Card */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-emerald-900/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Microsoft Excel (.xlsx) Multi-Sheet</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• <strong>Sheet 1:</strong> Historical Data (Date, Time, OHLCV, Frozen Headers, Styled)</li>
              <li>• <strong>Sheet 2:</strong> Download Information & Verification Audit Details</li>
              <li>• Auto-adjusted column widths, date & currency number formats</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExportingExcel || isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            {isExportingExcel ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Styled Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Excel ({totalRecords.toLocaleString()} rows)</span>
              </>
            )}
          </button>
        </div>

        {/* CSV Card */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-1">
              <FileText className="w-4 h-4" />
              <span>Comma Separated Values (.csv)</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Standard raw RFC 4180 CSV export</li>
              <li>• Compatible with Python (Pandas), R, PineScript, and TradingView</li>
              <li>• Clean chronological OHLCV rows ready for algorithmic backtesting</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isExportingCsv || isLoading}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isExportingCsv ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download CSV</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="py-3 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center space-x-1 border border-slate-700 transition"
              title="Copy Summary Report"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
