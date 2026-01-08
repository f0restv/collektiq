import { NextRequest, NextResponse } from 'next/server';
import { ebayService, getMockComps } from '@/lib/ebay';
import type { CollectibleCategory, CompsResponse } from '@/types/valuation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const category = searchParams.get('category') as CollectibleCategory | null;
  const days = parseInt(searchParams.get('days') || '90');
  const limit = parseInt(searchParams.get('limit') || '20');
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const gradeFilter = searchParams.get('grade') || undefined;

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    let comps;

    if (process.env.EBAY_CLIENT_ID) {
      // Use real eBay API
      comps = await ebayService.getSoldListings(query, {
        category: category || undefined,
        days,
        limit,
        minPrice,
        maxPrice,
        gradeFilter
      });
    } else {
      // Development fallback
      comps = getMockComps(query, category || undefined);
    }

    const statistics = ebayService.calculateStatistics(comps);

    const response: CompsResponse = {
      query,
      totalResults: comps.length,
      comps,
      statistics
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Comps fetch error:', error);

    // Fallback to mock data on error
    const comps = getMockComps(query, category || undefined);
    const statistics = ebayService.calculateStatistics(comps);

    return NextResponse.json({
      query,
      totalResults: comps.length,
      comps,
      statistics,
      _mock: true
    });
  }
}
