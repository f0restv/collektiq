# CollektIQ Collectible Valuation Framework

## Overview

A comprehensive system for scanning, identifying, and valuing collectibles using AI-powered image recognition, real-time market data from eBay sold listings, historical price tracking, and curated price guide databases.

---

## Core Features

1. **AI-Powered Identification** - Scan any collectible, AI identifies it instantly
2. **eBay Sold Comps** - Real-time recently sold listings for accurate market value
3. **Price Guide Database** - Curated reference prices by category
4. **Price History Graph** - 12-month price trend visualization
5. **Item Blurb** - AI-generated description with key details and fun facts

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Next.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Scanner   │  │  Results    │  │   Price     │  │    Collection       │ │
│  │   Component │  │  Display    │  │   Chart     │  │    Manager          │ │
│  └──────┬──────┘  └──────▲──────┘  └──────▲──────┘  └─────────────────────┘ │
│         │                │                │                                  │
└─────────┼────────────────┼────────────────┼──────────────────────────────────┘
          │                │                │
          ▼                │                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API LAYER (Next.js API Routes)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ /api/scan   │  │/api/comps   │  │/api/history │  │  /api/price-guide   │ │
│  │             │  │             │  │             │  │                     │ │
│  │ • Identify  │  │ • eBay API  │  │ • Time      │  │  • Category lookup  │ │
│  │ • Grade     │  │ • Filter    │  │   series    │  │  • Reference prices │ │
│  │ • Blurb     │  │ • Aggregate │  │ • Trends    │  │  • Rarity data      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Claude Vision  │  │   eBay Browse   │  │      Price Database         │  │
│  │      API        │  │      API        │  │      (PostgreSQL)           │  │
│  │                 │  │                 │  │                             │  │
│  │ • Image analysis│  │ • Sold listings │  │ • Price guides              │  │
│  │ • OCR/text      │  │ • Search API    │  │ • Historical prices         │  │
│  │ • Grading AI    │  │ • Item details  │  │ • Item catalog              │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Price Guide Tables

```sql
-- Master item catalog (reference data)
CREATE TABLE price_guide_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'coin', 'currency', 'sports-card', 'pokemon', 'other'
  subcategory VARCHAR(100),      -- 'baseball', 'football', 'base-set', 'morgan-dollar'

  -- Identification fields
  name VARCHAR(255) NOT NULL,
  year INTEGER,
  variant VARCHAR(255),          -- '1st Edition', 'Holo', 'Proof', 'Error'

  -- Category-specific identifiers
  set_name VARCHAR(255),         -- Card set name
  card_number VARCHAR(50),       -- Card number in set
  mint_mark VARCHAR(10),         -- Coin mint mark (P, D, S, W)
  denomination VARCHAR(50),      -- '25 cents', '$1', etc.
  manufacturer VARCHAR(100),     -- Topps, Panini, PCGS, etc.

  -- Reference pricing (updated periodically)
  price_raw DECIMAL(12,2),       -- Ungraded/raw condition
  price_low_grade DECIMAL(12,2), -- PSA 1-4, AG-VG
  price_mid_grade DECIMAL(12,2), -- PSA 5-7, F-VF
  price_high_grade DECIMAL(12,2),-- PSA 8-9, EF-AU
  price_gem DECIMAL(12,2),       -- PSA 10, MS-65+

  -- Metadata
  rarity VARCHAR(50),            -- 'common', 'uncommon', 'rare', 'ultra-rare'
  population INTEGER,            -- Known population/print run
  description TEXT,              -- Item description
  fun_facts TEXT,                -- Interesting facts for blurb
  image_url VARCHAR(500),        -- Reference image

  -- Indexing
  search_vector TSVECTOR,        -- Full-text search
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_price_guide_category ON price_guide_items(category);
CREATE INDEX idx_price_guide_name ON price_guide_items(name);
CREATE INDEX idx_price_guide_year ON price_guide_items(year);
CREATE INDEX idx_price_guide_search ON price_guide_items USING GIN(search_vector);

-- Historical price tracking (from eBay sold data)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES price_guide_items(id),

  -- Can also track by search term for items not in catalog
  search_term VARCHAR(255),
  category VARCHAR(50),

  -- Price data point
  date DATE NOT NULL,
  avg_price DECIMAL(12,2),
  low_price DECIMAL(12,2),
  high_price DECIMAL(12,2),
  num_sales INTEGER,

  -- Grade-specific pricing
  grade VARCHAR(20),             -- 'PSA 10', 'MS-65', 'Raw', etc.

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_item ON price_history(item_id);
CREATE INDEX idx_price_history_date ON price_history(date);
CREATE INDEX idx_price_history_search ON price_history(search_term);

-- eBay sold listings cache (refreshed frequently)
CREATE TABLE ebay_sold_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- eBay item data
  ebay_item_id VARCHAR(50) UNIQUE,
  title VARCHAR(500),
  sold_price DECIMAL(12,2),
  sold_date TIMESTAMP,
  condition VARCHAR(100),
  image_url VARCHAR(500),
  listing_url VARCHAR(500),

  -- Our categorization
  category VARCHAR(50),
  matched_item_id UUID REFERENCES price_guide_items(id),
  search_term VARCHAR(255),

  -- Metadata
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ebay_sold_date ON ebay_sold_cache(sold_date);
CREATE INDEX idx_ebay_sold_category ON ebay_sold_cache(category);
CREATE INDEX idx_ebay_sold_search ON ebay_sold_cache(search_term);

-- User scans history
CREATE TABLE user_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),          -- From NextAuth session

  -- Scan data
  image_url VARCHAR(500),

  -- AI identification results
  identified_name VARCHAR(255),
  identified_category VARCHAR(50),
  identified_year INTEGER,
  identified_grade VARCHAR(20),
  confidence_score DECIMAL(3,2),

  -- Matched catalog item
  matched_item_id UUID REFERENCES price_guide_items(id),

  -- Valuation at time of scan
  estimated_value DECIMAL(12,2),
  ebay_avg_price DECIMAL(12,2),
  price_guide_value DECIMAL(12,2),

  -- AI-generated blurb
  item_blurb TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_scans_user ON user_scans(user_id);
CREATE INDEX idx_user_scans_date ON user_scans(created_at);
```

---

## API Endpoints

### 1. Scan & Identify (`POST /api/scan`)

Handles image upload, AI identification, and returns complete valuation.

```typescript
// Request
{
  image: string;        // Base64 or URL
  category?: string;    // Optional hint: 'coin', 'pokemon', etc.
}

// Response
{
  identification: {
    category: 'pokemon',
    name: 'Charizard',
    set: 'Base Set',
    year: 1999,
    variant: '1st Edition Holo',
    cardNumber: '4/102',
    grade: {
      estimate: 'PSA 8',
      confidence: 0.85,
      notes: 'Light whitening on back corners, centering slightly off'
    }
  },

  valuation: {
    estimatedValue: 45000,
    priceGuideValue: 42000,
    ebayAverage: 47500,
    ebayLow: 38000,
    ebayHigh: 62000,
    lastUpdated: '2024-01-15T10:30:00Z'
  },

  comps: [
    {
      title: 'PSA 8 Charizard 1st Edition Base Set Holo',
      soldPrice: 48500,
      soldDate: '2024-01-12',
      condition: 'PSA 8',
      imageUrl: '...',
      listingUrl: '...'
    },
    // ... more comps
  ],

  priceHistory: [
    { date: '2024-01', avgPrice: 47500, sales: 12 },
    { date: '2023-12', avgPrice: 45000, sales: 15 },
    // ... 12 months of data
  ],

  blurb: "The 1999 Charizard 1st Edition Holo from the Base Set is the holy grail of Pokémon cards. As the final evolution of the beloved starter Charmander, Charizard's 120 HP and devastating Fire Spin attack made it the most sought-after card in schoolyards worldwide. First Edition copies, identifiable by the '1' stamp on the left side, were only printed in the initial US run, making them significantly rarer. A PSA 10 sold for $420,000 in 2022, cementing Charizard's status as the most valuable Pokémon card ever printed."
}
```

### 2. Get Comps (`GET /api/comps`)

Fetches recent eBay sold listings for comparison.

```typescript
// Request
GET /api/comps?q=charizard+base+set+psa+8&category=pokemon&days=90&limit=20

// Response
{
  query: 'charizard base set psa 8',
  totalResults: 45,
  comps: [
    {
      ebayItemId: '123456789',
      title: 'PSA 8 1999 Pokemon Base Set Charizard Holo #4',
      soldPrice: 48500,
      soldDate: '2024-01-12T14:30:00Z',
      condition: 'PSA 8',
      imageUrl: 'https://i.ebayimg.com/...',
      listingUrl: 'https://ebay.com/itm/...',
      shippingPrice: 0,
      totalPrice: 48500
    },
    // ... more results
  ],
  statistics: {
    average: 47250,
    median: 46500,
    low: 38000,
    high: 62000,
    standardDeviation: 5200,
    sampleSize: 45
  }
}
```

### 3. Price History (`GET /api/price-history`)

Returns 12-month price trend data for charting.

```typescript
// Request
GET /api/price-history?itemId=uuid-here
// OR
GET /api/price-history?q=charizard+base+set&category=pokemon&grade=PSA+8

// Response
{
  item: {
    name: 'Charizard Base Set 1st Edition',
    category: 'pokemon',
    grade: 'PSA 8'
  },

  period: {
    start: '2023-01-01',
    end: '2024-01-15'
  },

  dataPoints: [
    {
      date: '2024-01',
      avgPrice: 47500,
      lowPrice: 38000,
      highPrice: 62000,
      numSales: 12,
      volume: 570000
    },
    {
      date: '2023-12',
      avgPrice: 45000,
      lowPrice: 36000,
      highPrice: 58000,
      numSales: 15,
      volume: 675000
    },
    // ... 12 months
  ],

  trends: {
    monthOverMonth: 5.5,      // % change
    yearOverYear: 12.3,       // % change
    allTimeHigh: 65000,
    allTimeLow: 28000,
    volatility: 'medium'
  }
}
```

### 4. Price Guide Lookup (`GET /api/price-guide`)

Query the curated price guide database.

```typescript
// Request
GET /api/price-guide?category=coin&year=1921&name=morgan+dollar&mint=S

// Response
{
  item: {
    id: 'uuid',
    category: 'coin',
    name: 'Morgan Silver Dollar',
    year: 1921,
    mint: 'S',
    denomination: '$1',

    pricing: {
      raw: 35,
      vg: 40,
      fine: 45,
      vf: 55,
      ef: 75,
      au: 120,
      ms60: 175,
      ms63: 250,
      ms65: 850,
      ms67: 15000
    },

    rarity: 'common',
    mintage: 21695000,

    description: 'The 1921-S Morgan Dollar was the last year of Morgan Dollar production before the series ended.',

    funFacts: [
      'Morgan Dollars were designed by George T. Morgan, an English engraver',
      'The 1921 coins were struck to replace silver dollars melted under the Pittman Act',
      'Lady Liberty on the obverse was modeled after Anna Willess Williams'
    ]
  },

  relatedItems: [
    { year: 1921, mint: 'P', price_ms63: 65 },
    { year: 1921, mint: 'D', price_ms63: 70 },
    { year: 1920, mint: 'S', price_ms63: 45000 }
  ]
}
```

---

## AI Identification System

### Claude Vision Prompt Template

```typescript
const IDENTIFICATION_PROMPT = `You are an expert collectibles appraiser specializing in coins, currency, trading cards (Pokémon, sports), and memorabilia.

Analyze this image and provide:

1. **IDENTIFICATION**
- Category: [coin/currency/pokemon/sports-card/memorabilia/other]
- Exact item name (be specific)
- Year/date of production
- Set/series name (for cards)
- Variant details (1st Edition, Holo, Proof, Error, etc.)
- Manufacturer/Mint
- Any certification numbers visible (PSA, BGS, PCGS, NGC)

2. **CONDITION ASSESSMENT**
- Estimated grade (use appropriate scale: PSA 1-10, MS/PR for coins, etc.)
- Confidence level (0-100%)
- Specific condition notes:
  - For cards: centering, corners, edges, surface
  - For coins: luster, strike, contact marks, eye appeal
  - For currency: crispness, folds, stains, margins

3. **ITEM BLURB** (2-3 sentences)
Write an engaging description that includes:
- What makes this item collectible
- Historical significance or fun facts
- Why collectors value it

Return as JSON:
{
  "identification": {
    "category": "",
    "name": "",
    "year": null,
    "set": "",
    "variant": "",
    "cardNumber": "",
    "mint": "",
    "manufacturer": "",
    "certNumber": ""
  },
  "grade": {
    "estimate": "",
    "confidence": 0.0,
    "notes": "",
    "details": {}
  },
  "blurb": "",
  "searchTerms": ["term1", "term2"] // For eBay search
}`;
```

---

## eBay Integration

### eBay Browse API Setup

```typescript
// lib/ebay.ts

interface EbayConfig {
  clientId: string;
  clientSecret: string;
  environment: 'SANDBOX' | 'PRODUCTION';
}

interface SoldItem {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  soldDate: string;
  condition: string;
  imageUrl: string;
  itemUrl: string;
}

class EbayService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Get OAuth token
  async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

    return this.accessToken;
  }

  // Search sold/completed listings
  async getSoldListings(query: string, options: {
    category?: string;
    days?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<SoldItem[]> {
    const token = await this.authenticate();

    const { days = 90, limit = 50 } = options;
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Use Browse API with sold items filter
    const params = new URLSearchParams({
      q: query,
      filter: `soldDateFrom:${dateFrom},conditions:{USED|LIKE_NEW|NEW}`,
      sort: 'endDate',
      limit: limit.toString()
    });

    // Add category filter if specified
    if (options.category) {
      const categoryId = EBAY_CATEGORY_MAP[options.category];
      if (categoryId) params.append('category_ids', categoryId);
    }

    const response = await fetch(
      `https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      }
    );

    const data = await response.json();

    return data.itemSales?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: parseFloat(item.lastSoldPrice.value),
      currency: item.lastSoldPrice.currency,
      soldDate: item.lastSoldDate,
      condition: item.condition,
      imageUrl: item.image?.imageUrl,
      itemUrl: item.itemAffiliateWebUrl || item.itemWebUrl
    })) || [];
  }

  // Calculate statistics from sold listings
  calculateStats(items: SoldItem[]): {
    average: number;
    median: number;
    low: number;
    high: number;
    count: number;
  } {
    if (items.length === 0) {
      return { average: 0, median: 0, low: 0, high: 0, count: 0 };
    }

    const prices = items.map(i => i.price).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);

    return {
      average: Math.round(sum / prices.length),
      median: prices[Math.floor(prices.length / 2)],
      low: prices[0],
      high: prices[prices.length - 1],
      count: prices.length
    };
  }
}

// Category mapping for eBay
const EBAY_CATEGORY_MAP: Record<string, string> = {
  'coin': '253',           // Coins & Paper Money
  'currency': '3412',      // Paper Money
  'pokemon': '183454',     // Pokémon TCG
  'sports-card': '212',    // Sports Trading Cards
  'memorabilia': '60'      // Memorabilia
};

export const ebayService = new EbayService();
```

---

## Price History Tracking

### Aggregation Job (runs daily)

```typescript
// lib/price-aggregator.ts

async function aggregateDailyPrices() {
  const categories = ['coin', 'currency', 'pokemon', 'sports-card'];

  for (const category of categories) {
    // Get popular search terms for category
    const popularItems = await db.query(`
      SELECT DISTINCT search_term, COUNT(*) as scan_count
      FROM user_scans
      WHERE category = $1
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY search_term
      ORDER BY scan_count DESC
      LIMIT 100
    `, [category]);

    for (const item of popularItems) {
      // Fetch sold data from eBay
      const soldItems = await ebayService.getSoldListings(item.search_term, {
        category,
        days: 1, // Just today's sales
        limit: 100
      });

      if (soldItems.length > 0) {
        const stats = ebayService.calculateStats(soldItems);

        // Insert into price_history
        await db.query(`
          INSERT INTO price_history (search_term, category, date, avg_price, low_price, high_price, num_sales)
          VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
          ON CONFLICT (search_term, date) DO UPDATE SET
            avg_price = $3, low_price = $4, high_price = $5, num_sales = $6
        `, [item.search_term, category, stats.average, stats.low, stats.high, stats.count]);
      }
    }
  }
}
```

---

## Frontend Components

### Price Chart Component

```typescript
// components/PriceChart.tsx
'use client';

import { useMemo } from 'react';

interface PriceDataPoint {
  date: string;
  avgPrice: number;
  lowPrice: number;
  highPrice: number;
  numSales: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  title?: string;
}

export function PriceChart({ data, title }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return null;

    const maxPrice = Math.max(...data.map(d => d.highPrice));
    const minPrice = Math.min(...data.map(d => d.lowPrice));
    const range = maxPrice - minPrice;

    return {
      points: data.map((d, i) => ({
        x: (i / (data.length - 1)) * 100,
        yAvg: ((maxPrice - d.avgPrice) / range) * 100,
        yLow: ((maxPrice - d.lowPrice) / range) * 100,
        yHigh: ((maxPrice - d.highPrice) / range) * 100,
        ...d
      })),
      maxPrice,
      minPrice,
      currentPrice: data[data.length - 1]?.avgPrice || 0,
      priceChange: data.length > 1
        ? ((data[data.length - 1].avgPrice - data[0].avgPrice) / data[0].avgPrice) * 100
        : 0
    };
  }, [data]);

  if (!chartData) return <div>No price data available</div>;

  const { points, maxPrice, minPrice, currentPrice, priceChange } = chartData;
  const isPositive = priceChange >= 0;

  // Generate SVG path for average price line
  const avgPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAvg}`
  ).join(' ');

  // Generate area path for price range
  const areaPath = [
    ...points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yHigh}`),
    ...points.slice().reverse().map((p, i) => `L ${p.x} ${p.yLow}`),
    'Z'
  ].join(' ');

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}

      {/* Price Summary */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-2xl font-bold text-white">
          ${currentPrice.toLocaleString()}
        </span>
        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(priceChange).toFixed(1)}% (12mo)
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Price range area */}
          <path
            d={areaPath}
            fill={isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
          />

          {/* Average price line */}
          <path
            d={avgPath}
            fill="none"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Current price dot */}
          <circle
            cx={points[points.length - 1]?.x}
            cy={points[points.length - 1]?.yAvg}
            r="3"
            fill={isPositive ? '#10b981' : '#ef4444'}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400">
          <span>${maxPrice.toLocaleString()}</span>
          <span>${minPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
```

### Comps List Component

```typescript
// components/CompsList.tsx
'use client';

interface Comp {
  title: string;
  soldPrice: number;
  soldDate: string;
  condition: string;
  imageUrl: string;
  listingUrl: string;
}

interface CompsListProps {
  comps: Comp[];
  statistics: {
    average: number;
    median: number;
    low: number;
    high: number;
  };
}

export function CompsList({ comps, statistics }: CompsListProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Recent eBay Sales</h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-700 rounded">
        <div className="text-center">
          <div className="text-xs text-slate-400">Average</div>
          <div className="text-emerald-400 font-semibold">${statistics.average.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Median</div>
          <div className="text-white font-semibold">${statistics.median.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Low</div>
          <div className="text-slate-300 font-semibold">${statistics.low.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">High</div>
          <div className="text-slate-300 font-semibold">${statistics.high.toLocaleString()}</div>
        </div>
      </div>

      {/* Comps List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comps.map((comp, index) => (
          <a
            key={index}
            href={comp.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 bg-slate-700 rounded hover:bg-slate-600 transition"
          >
            <img
              src={comp.imageUrl}
              alt={comp.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{comp.title}</div>
              <div className="text-xs text-slate-400">
                {comp.condition} • {new Date(comp.soldDate).toLocaleDateString()}
              </div>
            </div>
            <div className="text-emerald-400 font-semibold">
              ${comp.soldPrice.toLocaleString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

### Item Blurb Component

```typescript
// components/ItemBlurb.tsx

interface ItemBlurbProps {
  blurb: string;
  identification: {
    name: string;
    year?: number;
    category: string;
    variant?: string;
  };
}

export function ItemBlurb({ blurb, identification }: ItemBlurbProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-3xl">
          {identification.category === 'pokemon' && '⚡'}
          {identification.category === 'sports-card' && '🏆'}
          {identification.category === 'coin' && '🪙'}
          {identification.category === 'currency' && '💵'}
          {identification.category === 'other' && '✨'}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            {identification.year && `${identification.year} `}
            {identification.name}
            {identification.variant && ` (${identification.variant})`}
          </h3>
          <p className="text-slate-300 mt-2 leading-relaxed">
            {blurb}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Price Guide Data Sources

### By Category

| Category | Primary Sources | Update Frequency |
|----------|----------------|------------------|
| **Coins** | PCGS Price Guide, NGC Price Guide, Greysheet | Weekly |
| **Currency** | PMG Price Guide, Heritage Auctions | Weekly |
| **Pokémon** | TCGPlayer, PriceCharting, PSA Pop Report | Daily |
| **Sports Cards** | Beckett, PSA, COMC, 130point | Daily |
| **Memorabilia** | Heritage, Goldin, eBay | Weekly |

### Data Import Scripts

```typescript
// scripts/import-price-guides.ts

// Example: Import PCGS coin data
async function importPCGSData() {
  // PCGS provides API access for dealers
  const coins = await fetchPCGSPriceGuide();

  for (const coin of coins) {
    await db.query(`
      INSERT INTO price_guide_items (
        category, name, year, mint, denomination,
        price_raw, price_low_grade, price_mid_grade, price_high_grade, price_gem,
        rarity, population, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (category, name, year, mint) DO UPDATE SET
        price_raw = $6, price_low_grade = $7, price_mid_grade = $8,
        price_high_grade = $9, price_gem = $10, updated_at = NOW()
    `, [
      'coin', coin.name, coin.year, coin.mint, coin.denomination,
      coin.prices.raw, coin.prices.vf, coin.prices.ef, coin.prices.ms63, coin.prices.ms65,
      coin.rarity, coin.population, coin.description
    ]);
  }
}

// Example: Import TCGPlayer Pokémon data
async function importTCGPlayerData() {
  // TCGPlayer has a public API
  const sets = await fetchTCGPlayerSets('pokemon');

  for (const set of sets) {
    const cards = await fetchTCGPlayerCards(set.id);

    for (const card of cards) {
      await db.query(`
        INSERT INTO price_guide_items (
          category, subcategory, name, set_name, card_number, year,
          price_raw, price_mid_grade, price_high_grade, price_gem,
          rarity, description, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (category, set_name, card_number) DO UPDATE SET
          price_raw = $7, price_mid_grade = $8, price_high_grade = $9,
          price_gem = $10, updated_at = NOW()
      `, [
        'pokemon', set.name, card.name, set.name, card.number, set.releaseYear,
        card.prices.normal, card.prices.psa7, card.prices.psa9, card.prices.psa10,
        card.rarity, card.description, card.imageUrl
      ]);
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Core Scanning (Week 1-2)
- [ ] Enhance `/api/scan` endpoint with new response format
- [ ] Update Claude Vision prompt for detailed identification
- [ ] Create `ItemBlurb` component
- [ ] Store scan history in database

### Phase 2: eBay Integration (Week 2-3)
- [ ] Set up eBay Developer account & API credentials
- [ ] Implement `EbayService` class
- [ ] Create `/api/comps` endpoint
- [ ] Build `CompsList` component
- [ ] Add sold listings cache table

### Phase 3: Price Guide Database (Week 3-4)
- [ ] Design and create database schema
- [ ] Build import scripts for major price guides
- [ ] Create `/api/price-guide` endpoint
- [ ] Implement search/matching logic

### Phase 4: Price History & Charts (Week 4-5)
- [ ] Set up daily price aggregation job
- [ ] Create `price_history` table and indexes
- [ ] Build `/api/price-history` endpoint
- [ ] Create `PriceChart` component with SVG visualization

### Phase 5: Polish & Optimization (Week 5-6)
- [ ] Add caching layer (Redis) for frequent queries
- [ ] Optimize database queries with proper indexes
- [ ] Add rate limiting for external APIs
- [ ] Mobile-optimize scanner UI
- [ ] Add offline price guide access

---

## Environment Variables

```bash
# .env.local

# Existing
ANTHROPIC_API_KEY=sk-ant-...
PLATFORM_API_URL=https://api.platform.com
PLATFORM_API_KEY=...
STRIPE_SECRET_KEY=sk_...

# New for this feature
EBAY_CLIENT_ID=your-ebay-app-id
EBAY_CLIENT_SECRET=your-ebay-secret
EBAY_ENVIRONMENT=PRODUCTION

# Database
DATABASE_URL=postgresql://user:pass@host:5432/collektiq

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Price Guide APIs (optional - for direct integration)
PCGS_API_KEY=...
TCGPLAYER_API_KEY=...
```

---

## Summary

This framework provides:

1. **Instant AI Identification** - Claude Vision analyzes images and returns detailed item info
2. **Real Market Data** - eBay sold listings provide actual transaction prices
3. **Reference Pricing** - Curated price guide database for baseline values
4. **Trend Visualization** - 12-month price charts show market direction
5. **Engaging Content** - AI-generated blurbs make results informative and fun

The system is designed to be modular, allowing each component to be developed and tested independently while integrating seamlessly with the existing CollektIQ architecture.
