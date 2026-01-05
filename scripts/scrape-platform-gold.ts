/**
 * Standalone script to scrape platform.gold
 * Run with: npx tsx scripts/scrape-platform-gold.ts
 */

import * as cheerio from 'cheerio';

const BASE_URL = 'https://platform.gold';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

interface ScrapedItem {
  name: string;
  price: number;
  url: string;
  image: string;
  inStock: boolean;
  grade?: string;
}

async function fetchPage(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: HEADERS,
  });

  console.log(`Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const text = await response.text();
    console.log('Response body (first 500 chars):', text.substring(0, 500));
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.text();
}

function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^0-9.,]/g, '').replace(',', '');
  return parseFloat(cleaned) || 0;
}

async function scrape() {
  console.log('='.repeat(60));
  console.log('Platform.gold Scraper');
  console.log('='.repeat(60));

  // Try different URLs to find the product listing
  const urlsToTry = [
    `${BASE_URL}/collections/all`,
    `${BASE_URL}/shop`,
    `${BASE_URL}/products`,
    `${BASE_URL}/inventory`,
    `${BASE_URL}/`,
  ];

  let html: string | null = null;
  let successUrl: string | null = null;

  for (const url of urlsToTry) {
    try {
      html = await fetchPage(url);
      successUrl = url;
      console.log(`✓ Successfully fetched: ${url}`);
      break;
    } catch (error) {
      console.log(`✗ Failed: ${url} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (!html || !successUrl) {
    console.log('\nCould not access any pages. The site may require:');
    console.log('- JavaScript rendering (use Playwright/Puppeteer)');
    console.log('- Authentication/cookies');
    console.log('- Different headers or approach');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Parsing HTML...');
  console.log('='.repeat(60));

  const $ = cheerio.load(html);

  // Log page title and structure info
  console.log(`Page title: ${$('title').text()}`);
  console.log(`Body length: ${$('body').html()?.length || 0} chars`);

  // Try to find products with various selectors
  const selectors = [
    '[class*="product-card"]',
    '[class*="product-item"]',
    '[class*="ProductCard"]',
    '.product',
    '.item',
    '[data-product]',
    '[data-product-id]',
    '.grid-item',
    'article',
    '.card',
  ];

  console.log('\nSearching for product elements...');

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`  ${selector}: ${elements.length} elements found`);
    }
  }

  // Look for any price-like patterns in the page
  const pricePattern = /\$[\d,]+\.?\d*/g;
  const prices = html.match(pricePattern);
  if (prices && prices.length > 0) {
    console.log(`\nFound ${prices.length} price-like patterns:`);
    console.log(prices.slice(0, 10).join(', '), prices.length > 10 ? '...' : '');
  }

  // Log any JSON data embedded in the page (common in modern sites)
  const jsonScripts = $('script[type="application/json"], script[type="application/ld+json"]');
  if (jsonScripts.length > 0) {
    console.log(`\nFound ${jsonScripts.length} JSON script tags`);
    jsonScripts.each((i, el) => {
      const content = $(el).html()?.substring(0, 200);
      console.log(`  Script ${i + 1}: ${content}...`);
    });
  }

  // Look for links that might be product pages
  const productLinks = $('a[href*="/product"], a[href*="/item"], a[href*="/p/"]');
  if (productLinks.length > 0) {
    console.log(`\nFound ${productLinks.length} potential product links:`);
    productLinks.slice(0, 5).each((i, el) => {
      console.log(`  ${$(el).attr('href')}`);
    });
  }

  // Output HTML structure for analysis
  console.log('\n' + '='.repeat(60));
  console.log('HTML Structure Preview (first 2000 chars of body):');
  console.log('='.repeat(60));
  console.log($('body').html()?.substring(0, 2000));
}

scrape().catch(console.error);
