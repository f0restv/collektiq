'use client';

import { useMemo } from 'react';
import type { PriceDataPoint } from '@/types/valuation';

interface PriceChartProps {
  data: PriceDataPoint[];
  title?: string;
  height?: number;
}

export function PriceChart({ data, title, height = 200 }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxPrice = Math.max(...data.map(d => d.highPrice));
    const minPrice = Math.min(...data.map(d => d.lowPrice));
    const range = maxPrice - minPrice || 1;
    const padding = range * 0.1;

    const adjustedMax = maxPrice + padding;
    const adjustedMin = Math.max(0, minPrice - padding);
    const adjustedRange = adjustedMax - adjustedMin;

    return {
      points: data.map((d, i) => ({
        x: (i / Math.max(1, data.length - 1)) * 100,
        yAvg: 100 - ((d.avgPrice - adjustedMin) / adjustedRange) * 100,
        yLow: 100 - ((d.lowPrice - adjustedMin) / adjustedRange) * 100,
        yHigh: 100 - ((d.highPrice - adjustedMin) / adjustedRange) * 100,
        ...d
      })),
      maxPrice: adjustedMax,
      minPrice: adjustedMin,
      currentPrice: data[data.length - 1]?.avgPrice || 0,
      startPrice: data[0]?.avgPrice || 0
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <p className="text-slate-400">No price data available</p>
      </div>
    );
  }

  const { points, maxPrice, minPrice, currentPrice, startPrice } = chartData;
  const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Generate SVG path for average price line
  const avgPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAvg}`
  ).join(' ');

  // Generate area path for price range (high to low band)
  const areaPath = [
    `M ${points[0].x} ${points[0].yHigh}`,
    ...points.slice(1).map(p => `L ${p.x} ${p.yHigh}`),
    ...points.slice().reverse().map(p => `L ${p.x} ${p.yLow}`),
    'Z'
  ].join(' ');

  // Generate gradient area under the average line
  const gradientPath = [
    `M ${points[0].x} ${points[0].yAvg}`,
    ...points.slice(1).map(p => `L ${p.x} ${p.yAvg}`),
    `L ${points[points.length - 1].x} 100`,
    `L ${points[0].x} 100`,
    'Z'
  ].join(' ');

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      )}

      {/* Price Summary */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-2xl font-bold text-white">
          ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        <span className={`text-sm font-medium flex items-center gap-1 ${
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(priceChange).toFixed(1)}%</span>
          <span className="text-slate-500">(12mo)</span>
        </span>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-slate-400 pr-2">
          <span className="text-right">{formatPrice(maxPrice)}</span>
          <span className="text-right">{formatPrice((maxPrice + minPrice) / 2)}</span>
          <span className="text-right">{formatPrice(minPrice)}</span>
        </div>

        {/* Chart SVG */}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

            {/* Price range band (high-low) */}
            <path
              d={areaPath}
              fill={isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
            />

            {/* Gradient fill under line */}
            <path d={gradientPath} fill="url(#priceGradient)" />

            {/* Average price line */}
            <path
              d={avgPath}
              fill="none"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current price dot */}
            <circle
              cx={points[points.length - 1]?.x}
              cy={points[points.length - 1]?.yAvg}
              r="4"
              fill={isPositive ? '#10b981' : '#ef4444'}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={points[points.length - 1]?.x}
              cy={points[points.length - 1]?.yAvg}
              r="6"
              fill={isPositive ? '#10b981' : '#ef4444'}
              fillOpacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-400 mt-2 ml-14">
        <span>{points[0]?.date}</span>
        <span>{points[Math.floor(points.length / 2)]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <div className="text-xs text-slate-400">Low</div>
          <div className="text-sm font-medium text-slate-300">
            ${Math.min(...data.map(d => d.lowPrice)).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Avg Volume</div>
          <div className="text-sm font-medium text-slate-300">
            {Math.round(data.reduce((a, d) => a + d.numSales, 0) / data.length)} sales/mo
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">High</div>
          <div className="text-sm font-medium text-slate-300">
            ${Math.max(...data.map(d => d.highPrice)).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceChart;
