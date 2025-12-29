import { NextRequest, NextResponse } from 'next/server';
import type { Product, CollectibleCategory } from '@/types';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

interface PlatformProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  condition?: string;
  images: { url: string; alt?: string }[];
  client?: {
    name: string;
    slug: string;
  };
  createdAt: string;
  year?: number;
  mint?: string;
  certNumber?: string;
  grade?: string;
  composition?: string;
  weight?: string;
  diameter?: string;
  certification?: string;
}

function transformProduct(item: PlatformProduct): Product & {
  seller?: string;
  details?: Record<string, string | number>;
} {
  const details: Record<string, string | number> = {};
  if (item.year) details.year = item.year;
  if (item.mint) details.mint = item.mint;
  if (item.composition) details.composition = item.composition;
  if (item.weight) details.weight = item.weight;
  if (item.diameter) details.diameter = item.diameter;
  if (item.certification) details.certification = item.certification;
  if (item.certNumber) details.certNumber = item.certNumber;

  return {
    id: item.id,
    name: item.title,
    price: item.price,
    category: (item.category as CollectibleCategory) || 'other',
    grade: item.grade || item.condition,
    image: item.images?.[0]?.url || '/placeholder.jpg',
    images: item.images?.map(img => img.url),
    description: item.description,
    year: item.year,
    mint: item.mint,
    certNumber: item.certNumber,
    inStock: true,
    createdAt: item.createdAt,
    seller: item.client?.name,
    details: Object.keys(details).length > 0 ? details : undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json(
      { error: 'Platform not configured' },
      { status: 500 }
    );
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${PLATFORM_URL}/api/v1/inventory/${id}`,
      {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch product' }));
      return NextResponse.json(error, { status: response.status });
    }

    const item: PlatformProduct = await response.json();
    const product = transformProduct(item);

    return NextResponse.json(product);
  } catch (error) {
    console.error('Platform product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
