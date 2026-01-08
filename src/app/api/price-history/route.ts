import { NextRequest, NextResponse } from 'next/server';
import { getMockPriceHistory } from '@/lib/ebay';
import type { CollectibleCategory, PriceHistory } from '@/types/valuation';

/**
 * GET /api/price-history
 *
 * Returns historical price data for charting.
 * Currently uses mock data - in production, would query price_history table.
 *
 * Query params:
 * - itemId: UUID of price guide item (optional)
 * - q: Search term (optional, used if no itemId)
 * - category: CollectibleCategory (optional)
 * - grade: Grade filter like "PSA 10" (optional)
 * - months: Number of months of history (default 12)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const itemId = searchParams.get('itemId');
  const query = searchParams.get('q');
  const category = searchParams.get('category') as CollectibleCategory | null;
  const grade = searchParams.get('grade');
  const months = parseInt(searchParams.get('months') || '12');

  if (!itemId && !query) {
    return NextResponse.json(
      { error: 'Either "itemId" or "q" parameter is required' },
      { status: 400 }
    );
  }

  try {
    // In production, this would query the price_history table:
    // SELECT date, avg_price, low_price, high_price, num_sales
    // FROM price_history
    // WHERE (item_id = $1 OR search_term ILIKE $2)
    // AND date >= NOW() - INTERVAL '$3 months'
    // ORDER BY date ASC

    const dataPoints = getMockPriceHistory(months);

    // Calculate trends
    const firstPrice = dataPoints[0]?.avgPrice || 0;
    const lastPrice = dataPoints[dataPoints.length - 1]?.avgPrice || 0;
    const monthAgoIndex = Math.max(0, dataPoints.length - 2);
    const monthAgoPrice = dataPoints[monthAgoIndex]?.avgPrice || firstPrice;

    const yearOverYear = firstPrice > 0
      ? ((lastPrice - firstPrice) / firstPrice) * 100
      : 0;

    const monthOverMonth = monthAgoPrice > 0
      ? ((lastPrice - monthAgoPrice) / monthAgoPrice) * 100
      : 0;

    const allPrices = dataPoints.flatMap(d => [d.lowPrice, d.highPrice]);
    const allTimeHigh = Math.max(...allPrices);
    const allTimeLow = Math.min(...allPrices.filter(p => p > 0));

    // Calculate volatility based on price swings
    const priceChanges = dataPoints.slice(1).map((d, i) =>
      Math.abs((d.avgPrice - dataPoints[i].avgPrice) / dataPoints[i].avgPrice)
    );
    const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;

    const volatility: 'low' | 'medium' | 'high' =
      avgVolatility < 0.05 ? 'low' :
      avgVolatility < 0.15 ? 'medium' : 'high';

    const response: PriceHistory = {
      item: {
        name: query || 'Unknown Item',
        category: category || 'other',
        grade: grade || undefined
      },

      period: {
        start: dataPoints[0]?.date || '',
        end: dataPoints[dataPoints.length - 1]?.date || ''
      },

      dataPoints,

      trends: {
        monthOverMonth: Math.round(monthOverMonth * 10) / 10,
        yearOverYear: Math.round(yearOverYear * 10) / 10,
        allTimeHigh,
        allTimeLow,
        volatility
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Price history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
