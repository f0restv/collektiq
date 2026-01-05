import * as cheerio from 'cheerio';
import type { PlatformGoldItem, PlatformGoldScrapeResult } from '@/types';

const BASE_URL = 'https://platform.gold';

// Browser-like headers to avoid 403 errors
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

// Try to dynamically import Playwright (only works when browser is installed)
async function getPlaywright() {
  try {
    const playwright = await import('playwright');
    return playwright;
  } catch {
    return null;
  }
}

// Fetch page using Playwright (handles JS rendering and bot protection)
async function fetchWithPlaywright(url: string): Promise<string> {
  const playwright = await getPlaywright();
  if (!playwright) {
    throw new Error('Playwright not available');
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: HEADERS['User-Agent'],
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for products to load (adjust selector based on actual site)
    try {
      await page.waitForSelector('[class*="product"], .item, .card', { timeout: 10000 });
    } catch {
      // Continue even if no products found - page might have different structure
    }

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

export interface ScrapeOptions {
  category?: string;
  maxPages?: number;
  inStockOnly?: boolean;
  usePlaywright?: boolean; // Use headless browser (required for JS-heavy sites)
}

async function fetchPage(url: string, usePlaywright = false): Promise<string> {
  // Try Playwright first if requested (handles bot protection and JS rendering)
  if (usePlaywright) {
    try {
      console.log('Using Playwright for fetch...');
      return await fetchWithPlaywright(url);
    } catch (error) {
      console.log('Playwright failed, falling back to fetch:', error);
    }
  }

  // Fall back to simple fetch
  const response = await fetch(url, {
    headers: HEADERS,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parsePrice(priceText: string): number {
  // Remove currency symbols and parse
  const cleaned = priceText.replace(/[^0-9.,]/g, '').replace(',', '');
  return parseFloat(cleaned) || 0;
}

function generateId(name: string, url: string): string {
  // Create a simple hash-like ID from name and URL
  const str = `${name}-${url}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `pg-${Math.abs(hash).toString(36)}`;
}

function parseProductFromElement($: cheerio.CheerioAPI, element: Parameters<typeof $>[0]): PlatformGoldItem | null {
  const $el = $(element);

  // Try multiple common selectors for product data
  // These will need to be adjusted based on actual site structure
  const name = $el.find('[class*="title"], [class*="name"], h2, h3, .product-title, .item-name').first().text().trim() ||
               $el.find('a').first().text().trim();

  if (!name) return null;

  const priceEl = $el.find('[class*="price"], .price, .amount, [data-price]').first();
  const priceText = priceEl.text().trim() || priceEl.attr('data-price') || '0';
  const price = parsePrice(priceText);

  const originalPriceEl = $el.find('[class*="original"], [class*="was"], .compare-price, s, del').first();
  const originalPrice = originalPriceEl.length ? parsePrice(originalPriceEl.text()) : undefined;

  const linkEl = $el.find('a[href*="/product"], a[href*="/item"], a').first();
  const href = linkEl.attr('href') || '';
  const url = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;

  const imgEl = $el.find('img').first();
  const image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  // Check stock status
  const stockText = $el.text().toLowerCase();
  const inStock = !stockText.includes('out of stock') &&
                  !stockText.includes('sold out') &&
                  !stockText.includes('unavailable') &&
                  !$el.find('[class*="sold-out"], [class*="out-of-stock"], .unavailable').length;

  // Try to extract grade (common in collectibles)
  const gradeMatch = name.match(/\b(MS|PR|PF|SP|AU|XF|VF|F|VG|G|AG|FR|PO)?[-\s]?(\d{1,2})\b/i) ||
                     $el.find('[class*="grade"]').first().text().match(/\b(MS|PR|PF|SP|AU|XF|VF|F|VG|G|AG|FR|PO)?[-\s]?(\d{1,2})\b/i);
  const grade = gradeMatch ? gradeMatch[0].toUpperCase() : undefined;

  // Try to extract cert number
  const certMatch = name.match(/\b\d{7,10}\b/) ||
                    $el.find('[class*="cert"]').first().text().match(/\b\d{7,10}\b/);
  const certNumber = certMatch ? certMatch[0] : undefined;

  return {
    id: generateId(name, url),
    name,
    price,
    originalPrice,
    image: fullImageUrl,
    url,
    inStock,
    grade,
    certNumber,
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapePlatformGold(options: ScrapeOptions = {}): Promise<PlatformGoldScrapeResult> {
  const { category, maxPages = 10, inStockOnly = true, usePlaywright = true } = options;
  const items: PlatformGoldItem[] = [];
  const seenIds = new Set<string>();

  try {
    // Build URL - adjust based on actual site structure
    let url = BASE_URL;
    if (category) {
      url = `${BASE_URL}/collections/${category}`;
    } else {
      // Try common collection/shop URLs
      url = `${BASE_URL}/collections/all`;
    }

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = page > 1 ? `${url}?page=${page}` : url;

      console.log(`Scraping page ${page}: ${pageUrl}`);

      let html: string;
      try {
        html = await fetchPage(pageUrl, usePlaywright);
      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, error);
        // If first page fails, try alternative URLs
        if (page === 1) {
          const alternativeUrls = [
            `${BASE_URL}/shop`,
            `${BASE_URL}/products`,
            `${BASE_URL}/inventory`,
            BASE_URL,
          ];

          for (const altUrl of alternativeUrls) {
            try {
              console.log(`Trying alternative URL: ${altUrl}`);
              html = await fetchPage(altUrl, usePlaywright);
              url = altUrl;
              break;
            } catch {
              continue;
            }
          }

          if (!html!) {
            throw new Error('Could not access any product pages');
          }
        } else {
          break; // No more pages
        }
      }

      const $ = cheerio.load(html);

      // Try multiple common product container selectors
      const productSelectors = [
        '[class*="product-card"]',
        '[class*="product-item"]',
        '[class*="collection-product"]',
        '.product',
        '.item',
        '[data-product]',
        '[data-product-id]',
        '.grid-item',
        'article[class*="product"]',
        '.product-grid > *',
        '.products-grid > *',
        '.collection-products > *',
      ];

      let products = $([]);
      for (const selector of productSelectors) {
        products = $(selector);
        if (products.length > 0) {
          console.log(`Found ${products.length} products using selector: ${selector}`);
          break;
        }
      }

      if (products.length === 0) {
        console.log('No products found on page, stopping pagination');
        if (page === 1) {
          // Log the HTML structure for debugging
          console.log('Page structure:', $('body').html()?.substring(0, 1000));
        }
        break;
      }

      let newItemsOnPage = 0;
      products.each((_, element) => {
        const item = parseProductFromElement($, element);
        if (item && !seenIds.has(item.id)) {
          if (!inStockOnly || item.inStock) {
            seenIds.add(item.id);
            items.push(item);
            newItemsOnPage++;
          }
        }
      });

      console.log(`Added ${newItemsOnPage} new items from page ${page}`);

      // Check if there's a next page
      const hasNextPage = $('a[rel="next"], .pagination-next, [class*="next-page"], a:contains("Next")').length > 0;
      if (!hasNextPage) {
        console.log('No more pages available');
        break;
      }

      // Be polite - add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      items,
      totalItems: items.length,
      scrapedAt: new Date().toISOString(),
      source: 'platform.gold',
    };
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

// Scrape a specific product page for more details
export async function scrapeProductDetails(productUrl: string): Promise<Partial<PlatformGoldItem>> {
  const html = await fetchPage(productUrl);
  const $ = cheerio.load(html);

  const details: Partial<PlatformGoldItem> = {};

  // Extract detailed information
  const title = $('h1, [class*="product-title"], [class*="product-name"]').first().text().trim();
  if (title) details.name = title;

  const priceEl = $('[class*="price"]:not([class*="compare"]):not([class*="original"])').first();
  const price = parsePrice(priceEl.text());
  if (price) details.price = price;

  const description = $('[class*="description"], .product-description, [data-description]').first().text().trim();

  // Extract grade from description or title
  const gradeMatch = (title + ' ' + description).match(/\b(MS|PR|PF|SP|AU|XF|VF|F|VG|G|AG|FR|PO)[-\s]?(\d{1,2})\b/i);
  if (gradeMatch) details.grade = gradeMatch[0].toUpperCase();

  // Extract cert number
  const certMatch = (title + ' ' + description).match(/\b\d{7,10}\b/);
  if (certMatch) details.certNumber = certMatch[0];

  // Check stock status
  const pageText = $('body').text().toLowerCase();
  details.inStock = !pageText.includes('out of stock') &&
                    !pageText.includes('sold out') &&
                    !pageText.includes('unavailable');

  return details;
}
