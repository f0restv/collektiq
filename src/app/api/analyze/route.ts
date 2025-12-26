import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzeRequest, AnalyzeResponse, Identification, GradeEstimate, Pricing, CollectibleCategory } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ClaudeAnalysis {
  identification: Identification;
  grade: GradeEstimate;
  searchTerms: string[];
}

function buildImageContent(images: string[]): Anthropic.ImageBlockParam[] {
  return images.map((img) => {
    if (img.startsWith('data:')) {
      const [meta, data] = img.split(',');
      const mediaType = meta.match(/data:(.*);/)?.[1] || 'image/jpeg';
      return {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data,
        },
      };
    }
    return {
      type: 'image' as const,
      source: {
        type: 'url' as const,
        url: img,
      },
    };
  });
}

function validateCategory(category: string): CollectibleCategory {
  const valid: CollectibleCategory[] = ['coin', 'currency', 'sports-card', 'pokemon', 'other'];
  return valid.includes(category as CollectibleCategory) ? (category as CollectibleCategory) : 'other';
}

const ANALYSIS_PROMPT = `You are an expert appraiser of collectibles including coins, currency, sports cards, and Pokemon cards.

Analyze the provided image(s) and respond with ONLY valid JSON in this exact format:
{
  "identification": {
    "category": "coin|currency|sports-card|pokemon|other",
    "name": "Full name/title of the item",
    "year": 1921,
    "description": "Brief description",
    "mint": "Mint mark or location if applicable",
    "denomination": "Face value if applicable",
    "player": "Player name if sports card",
    "set": "Card set name if applicable",
    "manufacturer": "PCGS/NGC/PSA/Topps/etc if visible",
    "certNumber": "Certification number if visible"
  },
  "grade": {
    "estimate": "MS-65 or PSA 9 or VF-30 etc",
    "confidence": 0.85,
    "notes": "Observations about condition - wear, luster, centering, etc"
  },
  "searchTerms": ["search", "terms", "for", "ebay", "lookup"]
}

Be specific and accurate. If you cannot determine something, omit that field. The searchTerms should be good for finding comparable sales on eBay.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyzeRequest;
    const { images } = body;

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const imageContent = buildImageContent(images);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let analysis: ClaudeAnalysis;
    try {
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Failed to parse analysis');
    }

    // Validate and normalize the response
    const identification: Identification = {
      ...analysis.identification,
      category: validateCategory(analysis.identification.category),
    };

    const grade: GradeEstimate = {
      estimate: analysis.grade?.estimate || 'Unknown',
      confidence: Math.min(1, Math.max(0, analysis.grade?.confidence || 0.5)),
      notes: analysis.grade?.notes || '',
    };

    // TODO: Fetch real market data using searchTerms
    // For now, return mock pricing based on category
    const basePrices: Record<CollectibleCategory, number> = {
      coin: 75,
      currency: 25,
      'sports-card': 50,
      pokemon: 100,
      other: 30,
    };
    const base = basePrices[identification.category];

    const pricing: Pricing = {
      ebayAvg: base + Math.floor(Math.random() * 50),
      ebayLow: base - Math.floor(Math.random() * 20),
      ebayHigh: base + Math.floor(Math.random() * 100),
      redbook: identification.category === 'coin' ? base + 10 : undefined,
      greysheet: identification.category === 'coin' ? base - 5 : undefined,
      buyNow: base - 10,
    };

    const result: AnalyzeResponse = {
      identification,
      grade,
      searchTerms: analysis.searchTerms || [],
      pricing,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
