import React, { useRef, useEffect, useState, useMemo } from 'react';
import { OHLCRecord } from '../types/market';
import { Maximize2, BarChart2, Eye, LineChart } from 'lucide-react';

interface CandlestickChartProps {
  data: OHLCRecord[];
  instrumentName: string;
  timeframe: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, instrumentName, timeframe }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredRecord, setHoveredRecord] = useState<OHLCRecord | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');
  const [zoomRange, setZoomRange] = useState<'all' | '100' | '250'>('all');

  // Filter or slice data based on zoom range
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (zoomRange === '100' && data.length > 100) {
      return data.slice(-100);
    }
    if (zoomRange === '250' && data.length > 250) {
      return data.slice(-250);
    }
    return data;
  }, [data, zoomRange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#090D16'; // deep slate
    ctx.fillRect(0, 0, width, height);

    // Padding
    const paddingLeft = 10;
    const paddingRight = 65; // for price axis
    const paddingTop = 20;
    const paddingBottom = 40; // for time axis

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const volumeHeight = plotHeight * 0.22;
    const pricePlotHeight = plotHeight - volumeHeight - 10;

    // Min and Max calculation
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (const d of displayData) {
      if (d.low < minPrice) minPrice = d.low;
      if (d.high > maxPrice) maxPrice = d.high;
      if (d.volume > maxVol) maxVol = d.volume;
    }

    // Add 5% buffer on prices
    const priceSpan = maxPrice - minPrice || 1;
    minPrice -= priceSpan * 0.05;
    maxPrice += priceSpan * 0.05;
    const effectiveSpan = maxPrice - minPrice;

    const getY = (val: number) => paddingTop + pricePlotHeight - ((val - minPrice) / effectiveSpan) * pricePlotHeight;
    const getVolY = (vol: number) => paddingTop + pricePlotHeight + 10 + volumeHeight - (maxVol > 0 ? (vol / maxVol) * volumeHeight : 0);

    // Draw Price Grid lines (horizontal)
    const gridLines = 5;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const priceVal = minPrice + (effectiveSpan / gridLines) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(priceVal.toFixed(2), width - paddingRight + 6, y + 3);
    }

    // Candle bar geometry
    const n = displayData.length;
    const barSpacing = plotWidth / n;
    const candleWidth = Math.max(1, barSpacing * 0.7);

    // Draw Bars or Line
    if (chartMode === 'line') {
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4'; // cyan
      ctx.lineWidth = 2;

      for (let i = 0; i < n; i++) {
        const x = paddingLeft + i * barSpacing + barSpacing / 2;
        const y = getY(displayData[i].close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Area fill gradient
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + pricePlotHeight);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.lineTo(paddingLeft + (n - 1) * barSpacing + barSpacing / 2, paddingTop + pricePlotHeight);
      ctx.lineTo(paddingLeft + barSpacing / 2, paddingTop + pricePlotHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    } else {
      // Candlesticks
      for (let i = 0; i < n; i++) {
        const bar = displayData[i];
        const x = paddingLeft + i * barSpacing + barSpacing / 2;
        const isBullish = bar.close >= bar.open;

        const openY = getY(bar.open);
        const closeY = getY(bar.close);
        const highY = getY(bar.high);
        const lowY = getY(bar.low);

        const candleColor = isBullish ? '#10B981' : '#EF4444';
        const volumeColor = isBullish ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';

        // 1. Draw Wick Line
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = Math.max(1, candleWidth > 4 ? 1.5 : 1);
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // 2. Draw Candle Body Box
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));
        const bodyLeft = x - candleWidth / 2;

        ctx.fillStyle = candleColor;
        ctx.fillRect(bodyLeft, bodyTop, candleWidth, bodyHeight);

        // 3. Draw Volume Bar at bottom
        const volY = getVolY(bar.volume);
        const volBase = paddingTop + pricePlotHeight + 10 + volumeHeight;
        ctx.fillStyle = volumeColor;
        ctx.fillRect(bodyLeft, volY, candleWidth, volBase - volY);
      }
    }

    // Time axis labels (draw 4-5 dates)
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += step) {
      const x = paddingLeft + i * barSpacing + barSpacing / 2;
      const bar = displayData[i];
      const label = bar.time ? `${bar.date.slice(5)} ${bar.time.slice(0, 5)}` : bar.date.slice(5);
      ctx.fillText(label, x, height - paddingBottom + 16);
    }

    // Draw Crosshair if hovering
    if (hoverCoord && hoveredRecord) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverCoord.x, paddingTop);
      ctx.lineTo(hoverCoord.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal price line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, hoverCoord.y);
      ctx.lineTo(width - paddingRight, hoverCoord.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [displayData, chartMode, hoverCoord, hoveredRecord]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || displayData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 10;
    const paddingRight = 65;
    const plotWidth = rect.width - paddingLeft - paddingRight;
    const barSpacing = plotWidth / displayData.length;

    const index = Math.floor((x - paddingLeft) / barSpacing);
    if (index >= 0 && index < displayData.length) {
      setHoveredRecord(displayData[index]);
      setHoverCoord({ x, y });
    } else {
      setHoveredRecord(null);
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRecord(null);
    setHoverCoord(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3" ref={containerRef}>
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            OHLC Candlestick Preview • {instrumentName} ({timeframe})
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            ({displayData.length} Candles)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom options */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setZoomRange('all')}
              className={`px-2 py-0.5 rounded ${zoomRange === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setZoomRange('250')}
              className={`px-2 py-0.5 rounded ${zoomRange === '250' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Last 250
            </button>
            <button
              type="button"
              onClick={() => setZoomRange('100')}
              className={`px-2 py-0.5 rounded ${zoomRange === '100' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Last 100
            </button>
          </div>

          {/* Mode switch */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setChartMode('candles')}
              className={`px-2 py-0.5 rounded flex items-center space-x-1 ${chartMode === 'candles' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`px-2 py-0.5 rounded flex items-center space-x-1 ${chartMode === 'line' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Area</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hover Info Header Strip */}
      <div className="min-h-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
        {hoveredRecord ? (
          <>
            <span className="text-cyan-400 font-bold">
              {hoveredRecord.date} {hoveredRecord.time ? `• ${hoveredRecord.time}` : ''}
            </span>
            <span>
              O: <strong className="text-white">{hoveredRecord.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">{hoveredRecord.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">{hoveredRecord.low.toFixed(2)}</strong>
            </span>
            <span>
              C: <strong className="text-white">{hoveredRecord.close.toFixed(2)}</strong>
            </span>
            <span>
              Vol: <strong className="text-slate-200">{hoveredRecord.volume.toLocaleString()}</strong>
            </span>
            <span className={hoveredRecord.close >= hoveredRecord.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {hoveredRecord.close >= hoveredRecord.open ? '+' : ''}
              {(((hoveredRecord.close - hoveredRecord.open) / hoveredRecord.open) * 100).toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="text-slate-500 italic">
            Hover over any candle to inspect exact Open, High, Low, Close, and Volume details
          </span>
        )}
      </div>

      {/* Canvas Chart Area */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};
