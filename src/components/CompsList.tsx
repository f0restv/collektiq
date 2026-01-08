'use client';

import { useState } from 'react';
import type { EbaySoldItem, PriceStatistics } from '@/types/valuation';

interface CompsListProps {
  comps: EbaySoldItem[];
  statistics: PriceStatistics;
  maxItems?: number;
}

export function CompsList({ comps, statistics, maxItems = 10 }: CompsListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedComps = showAll ? comps : comps.slice(0, maxItems);
  const hasMore = comps.length > maxItems;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent eBay Sales</h3>
        <span className="text-sm text-slate-400">
          {comps.length} comp{comps.length !== 1 ? 's' : ''} (90 days)
        </span>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-700/50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Average</div>
          <div className="text-emerald-400 font-bold">
            {formatPrice(statistics.average)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Median</div>
          <div className="text-white font-semibold">
            {formatPrice(statistics.median)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Low</div>
          <div className="text-slate-300 font-semibold">
            {formatPrice(statistics.low)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">High</div>
          <div className="text-slate-300 font-semibold">
            {formatPrice(statistics.high)}
          </div>
        </div>
      </div>

      {/* Comps List */}
      {comps.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          No recent sales found
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {displayedComps.map((comp, index) => (
            <a
              key={comp.ebayItemId || index}
              href={comp.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/60 transition-colors group"
            >
              {/* Image */}
              <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-slate-600">
                {comp.imageUrl ? (
                  <img
                    src={comp.imageUrl}
                    alt={comp.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                  {comp.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="bg-slate-600 px-1.5 py-0.5 rounded">
                    {comp.condition || 'Unknown'}
                  </span>
                  <span>•</span>
                  <span>{formatDate(comp.soldDate)}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-emerald-400 font-bold">
                  {formatPrice(comp.soldPrice)}
                </div>
                {comp.shippingPrice && comp.shippingPrice > 0 && (
                  <div className="text-xs text-slate-400">
                    +${comp.shippingPrice.toFixed(2)} ship
                  </div>
                )}
              </div>

              {/* External link indicator */}
              <svg
                className="w-4 h-4 text-slate-500 group-hover:text-slate-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Show more button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${comps.length} Comps`}
        </button>
      )}
    </div>
  );
}

export default CompsList;
