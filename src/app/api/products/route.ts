import { NextRequest, NextResponse } from 'next/server';
import type { Product, CollectibleCategory } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Fallback mock data when backend is unavailable
const mockProducts: Product[] = [
  {
    id: '1',
    name: '1921 Morgan Silver Dollar',
    price: 79,
    category: 'coin',
    grade: 'MS-63',
    image: '/images/morgan-1921.jpg',
    description: 'Beautiful example of the final year Morgan Dollar with strong luster.',
    year: 1921,
    mint: 'Philadelphia',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '1923 Peace Dollar',
    price: 45,
    category: 'coin',
    grade: 'AU-58',
    image: '/images/peace-1923.jpg',
    description: 'Near mint Peace Dollar with minimal wear on high points.',
    year: 1923,
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '2023 Topps Chrome Mike Trout',
    price: 125,
    category: 'sports-card',
    grade: 'PSA 10',
    image: '/images/trout-chrome.jpg',
    description: 'Gem mint Topps Chrome of the Angels superstar.',
    year: 2023,
    certNumber: 'PSA-12345678',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Charizard Base Set Holo',
    price: 450,
    category: 'pokemon',
    grade: 'PSA 7',
    image: '/images/charizard-base.jpg',
    description: 'The iconic 1999 Base Set Charizard holographic card.',
    year: 1999,
    certNumber: 'PSA-87654321',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: '$2 Red Seal 1953',
    price: 15,
    category: 'currency',
    grade: 'VF',
    image: '/images/2-red-seal.jpg',
    description: 'United States Note with distinctive red seal and serial numbers.',
    year: 1953,
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: '1878-S Morgan Dollar',
    price: 52,
    category: 'coin',
    grade: 'VF-30',
    image: '/images/morgan-1878s.jpg',
    description: 'First year San Francisco Morgan with nice original surfaces.',
    year: 1878,
    mint: 'San Francisco',
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: '2020 Panini Prizm Justin Herbert RC',
    price: 85,
    category: 'sports-card',
    grade: 'PSA 9',
    image: '/images/herbert-prizm.jpg',
    description: 'Rookie card of the Chargers franchise quarterback.',
    year: 2020,
    inStock: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Pikachu 25th Anniversary Promo',
    price: 35,
    category: 'pokemon',
    grade: 'NM',
    image: '/images/pikachu-25th.jpg',
    description: 'Special 25th anniversary celebration Pikachu card.',
    year: 2021,
    inStock: true,
    createdAt: new Date().toISOString(),
  },
];

async function fetchFromBackend(category?: string): Promise<Product[] | null> {
  try {
    const url = category
      ? `${BACKEND_URL}/api/products?category=${category}`
      : `${BACKEND_URL}/api/products`;

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as CollectibleCategory | null;
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Try to fetch from backend first
  let products = await fetchFromBackend(category || undefined);

  // Fall back to mock data if backend is unavailable
  if (!products) {
    products = mockProducts;
  }

  // Filter by category
  if (category) {
    products = products.filter((p) => p.category === category);
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  // Filter to only in-stock items
  products = products.filter((p) => p.inStock);

  // Apply pagination
  const total = products.length;
  products = products.slice(offset, offset + limit);

  return NextResponse.json({
    products,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
