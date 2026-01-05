import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ebayService, getMockComps, getMockPriceHistory } from '@/lib/ebay';
import type { ScanResult, ItemIdentification, GradeEstimate, CollectibleCategory } from '@/types/valuation';

const anthropic = new Anthropic();

const IDENTIFICATION_PROMPT = `You are an expert collectibles appraiser specializing in coins, currency, trading cards (Pokémon, sports), and memorabilia.

Analyze this image and provide detailed identification and valuation information.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "identification": {
    "category": "coin|currency|pokemon|sports-card|memorabilia|other",
    "name": "exact item name",
    "year": 1999,
    "description": "brief description",
    "set": "set/series name if applicable",
    "cardNumber": "card number if applicable",
    "player": "player name for sports cards",
    "manufacturer": "Topps, Panini, WOTC, US Mint, etc",
    "mint": "mint mark for coins (P, D, S, W)",
    "denomination": "face value if applicable",
    "variant": "1st Edition, Holo, Proof, Error, etc",
    "certNumber": "certification number if visible",
    "certService": "PSA, BGS, PCGS, NGC if graded"
  },
  "grade": {
    "estimate": "PSA 8 or MS-65 or VF-30 etc",
    "numericGrade": 8,
    "confidence": 0.85,
    "notes": "condition observations",
    "details": {
      "centering": "for cards",
      "corners": "for cards",
      "edges": "for cards/coins",
      "surface": "for cards/coins",
      "luster": "for coins",
      "strike": "for coins"
    }
  },
  "estimatedValue": 150,
  "searchTerms": ["term1", "term2", "term3"],
  "blurb": "2-3 sentence engaging description with historical significance, fun facts, and why collectors value this item"
}`;

interface ClaudeAnalysis {
  identification: ItemIdentification;
  grade: GradeEstimate;
  estimatedValue: number;
  searchTerms: string[];
  blurb: string;
}

async function analyzeWithClaude(imageData: string): Promise<ClaudeAnalysis> {
  const isUrl = imageData.startsWith('http');

  const imageContent = isUrl
    ? { type: 'image' as const, source: { type: 'url' as const, url: imageData } }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: imageData.replace(/^data:image\/\w+;base64,/, '')
        }
      };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          imageContent,
          { type: 'text', text: IDENTIFICATION_PROMPT }
        ]
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Clean up response - remove markdown code blocks if present
  let jsonText = textContent.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(jsonText);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { image, categoryHint } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Step 1: AI Identification
    const analysis = await analyzeWithClaude(image);

    // Step 2: Get eBay sold comps
    const searchQuery = analysis.searchTerms.slice(0, 3).join(' ');
    const category = (categoryHint || analysis.identification.category) as CollectibleCategory;

    let comps;
    let compsStats;

    try {
      // Try real eBay API first
      if (process.env.EBAY_CLIENT_ID) {
        comps = await ebayService.getSoldListings(searchQuery, {
          category,
          days: 90,
          limit: 20
        });
        compsStats = ebayService.calculateStatistics(comps);
      } else {
        // Fall back to mock data for development
        comps = getMockComps(searchQuery, category);
        compsStats = ebayService.calculateStatistics(comps);
      }
    } catch (ebayError) {
      console.error('eBay API error:', ebayError);
      // Fallback to mock
      comps = getMockComps(searchQuery, category);
      compsStats = ebayService.calculateStatistics(comps);
    }

    // Step 3: Get price history (mock for now, would come from database)
    const priceHistory = getMockPriceHistory(12);

    // Step 4: Calculate valuation
    const ebayAverage = compsStats.average || analysis.estimatedValue;
    const estimatedValue = analysis.estimatedValue || ebayAverage;

    // Build complete response
    const result: ScanResult = {
      identification: analysis.identification,
      grade: analysis.grade,

      valuation: {
        estimatedValue,
        confidence: analysis.grade.confidence,
        ebayAverage: compsStats.average,
        ebayMedian: compsStats.median,
        ebayLow: compsStats.low,
        ebayHigh: compsStats.high,
        priceGuideValue: analysis.estimatedValue,
        lastUpdated: new Date().toISOString()
      },

      comps,
      compsStats,
      priceHistory,

      blurb: analysis.blurb,
      searchTerms: analysis.searchTerms,

      scannedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scan item' },
      { status: 500 }
    );
  }
}
