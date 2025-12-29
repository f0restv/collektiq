import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

interface PricingSource {
  source: string;
  prices?: {
    raw?: {
      low?: number;
      mid?: number;
      high?: number;
    };
  };
}

interface PlatformResponse {
  identification: {
    category: string;
    name: string;
    year?: number;
    description?: string;
    mint?: string;
    denomination?: string;
    player?: string;
    set?: string;
    manufacturer?: string;
    certNumber?: string;
  };
  grade: {
    estimate: string;
    confidence: number;
    notes?: string;
  };
  searchTerms: string[];
  pricing: {
    estimated: {
      low: number;
      mid: number;
      high: number;
    };
    sources: PricingSource[];
  };
}

function findSourcePrice(sources: PricingSource[], name: string): number | undefined {
  const source = sources.find(s => s.source === name);
  return source?.prices?.raw?.mid;
}

function calculateBuyNow(estimated: { low: number; mid: number; high: number }): number {
  // Buy now = ~80% of mid (margin for platform)
  return Math.round(estimated.mid * 0.8);
}

export async function POST(request: NextRequest) {
  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json(
      { error: 'Platform not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${PLATFORM_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data: PlatformResponse = await response.json();

    // Transform to match existing frontend expectations
    return NextResponse.json({
      identification: data.identification,
      grade: data.grade,
      searchTerms: data.searchTerms,
      pricing: {
        ebayAvg: data.pricing.estimated.mid,
        ebayLow: data.pricing.estimated.low,
        ebayHigh: data.pricing.estimated.high,
        sources: data.pricing.sources,
        greysheet: findSourcePrice(data.pricing.sources, 'Greysheet'),
        redbook: findSourcePrice(data.pricing.sources, 'Redbook'),
        buyNow: calculateBuyNow(data.pricing.estimated),
      },
    });
  } catch (error) {
    console.error('Platform API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze item' },
      { status: 500 }
    );
  }
}
