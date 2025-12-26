import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { QuoteRequest, QuoteResponse, CollectibleCategory } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Buy rates - percentage of market value we offer for quick cash
const BUY_RATES: Record<CollectibleCategory, number> = {
  coin: 0.65,
  currency: 0.60,
  'sports-card': 0.55,
  pokemon: 0.50,
  other: 0.45,
};

interface QuickAnalysis {
  category: CollectibleCategory;
  estimatedValue: number;
  confidence: 'high' | 'medium' | 'low';
  name: string;
}

const QUOTE_PROMPT = `You are an expert appraiser. Quickly analyze this collectible and estimate its fair market value.

Respond with ONLY valid JSON:
{
  "category": "coin|currency|sports-card|pokemon|other",
  "name": "Brief item name",
  "estimatedValue": 100,
  "confidence": "high|medium|low"
}

Be conservative with values. estimatedValue should be in USD based on recent eBay sold prices for comparable items.`;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as QuoteRequest;
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
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: QUOTE_PROMPT },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response from analysis');
    }

    let analysis: QuickAnalysis;
    try {
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse quote response:', textContent.text);
      throw new Error('Failed to analyze item');
    }

    // Validate category
    const validCategories: CollectibleCategory[] = ['coin', 'currency', 'sports-card', 'pokemon', 'other'];
    const category: CollectibleCategory = validCategories.includes(analysis.category)
      ? analysis.category
      : 'other';

    // Calculate offer based on estimated value and buy rate
    const marketValue = Math.max(1, analysis.estimatedValue || 10);
    const buyRate = BUY_RATES[category];
    const offer = Math.round(marketValue * buyRate);

    // Quote expires in 24 hours
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const result: QuoteResponse = {
      offer,
      confidence: analysis.confidence || 'medium',
      expires: expires.toISOString(),
      breakdown: {
        marketValue,
        buyRate,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quote failed' },
      { status: 500 }
    );
  }
}
