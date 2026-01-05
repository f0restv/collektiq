import { NextResponse } from 'next/server';
import { scrapePlatformGold, type ScrapeOptions } from '@/lib/scrapers/platformGold';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for scraping

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const options: ScrapeOptions = {
      category: searchParams.get('category') || undefined,
      maxPages: parseInt(searchParams.get('maxPages') || '5', 10),
      inStockOnly: searchParams.get('inStockOnly') !== 'false',
      usePlaywright: searchParams.get('usePlaywright') !== 'false',
    };

    console.log('Starting platform.gold scrape with options:', options);

    const result = await scrapePlatformGold(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        error: 'Failed to scrape platform.gold',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const options: ScrapeOptions = {
      category: body.category,
      maxPages: body.maxPages || 5,
      inStockOnly: body.inStockOnly !== false,
      usePlaywright: body.usePlaywright !== false,
    };

    console.log('Starting platform.gold scrape with options:', options);

    const result = await scrapePlatformGold(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        error: 'Failed to scrape platform.gold',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
