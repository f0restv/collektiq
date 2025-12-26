import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { images, category } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // Build image content for Claude
    const imageContent = images.map((img: string) => {
      // Handle base64 or URL
      if (img.startsWith('data:')) {
        const [meta, data] = img.split(',')
        const mediaType = meta.match(/data:(.*);/)?.[1] || 'image/jpeg'
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data,
          },
        }
      }
      return {
        type: 'image' as const,
        source: {
          type: 'url' as const,
          url: img,
        },
      }
    })

    const prompt = `You are an expert appraiser of collectibles including coins, currency, sports cards, and Pokemon cards.

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

Be specific and accurate. If you cannot determine something, omit that field. The searchTerms should be good for finding comparable sales on eBay.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    // Parse Claude's response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let analysis
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = textContent.text
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }
      analysis = JSON.parse(jsonStr.trim())
    } catch (e) {
      console.error('Failed to parse Claude response:', textContent.text)
      throw new Error('Failed to parse analysis')
    }

    // TODO: Fetch real market data using searchTerms
    // For now, return mock pricing
    const mockPricing = {
      ebayAvg: Math.floor(Math.random() * 100) + 50,
      ebayLow: Math.floor(Math.random() * 50) + 30,
      ebayHigh: Math.floor(Math.random() * 100) + 100,
      redbook: Math.floor(Math.random() * 100) + 60,
      greysheet: Math.floor(Math.random() * 80) + 40,
      buyNow: Math.floor(Math.random() * 90) + 45,
    }

    return NextResponse.json({
      ...analysis,
      pricing: mockPricing,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
