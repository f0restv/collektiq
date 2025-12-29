import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
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

interface ProductWithDetails extends Product {
  seller?: string;
  details?: Record<string, string | number>;
}

function transformProduct(item: PlatformProduct): ProductWithDetails {
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

async function fetchProduct(id: string): Promise<ProductWithDetails | null> {
  if (!PLATFORM_URL || !API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${PLATFORM_URL}/api/v1/inventory/${id}`,
      {
        headers: { 'x-api-key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) return null;

    const item: PlatformProduct = await response.json();
    return transformProduct(item);
  } catch {
    return null;
  }
}

const categoryIcons: Record<CollectibleCategory, string> = {
  coin: '\u{1FA99}',
  currency: '\u{1F4B5}',
  'sports-card': '\u{1F3C8}',
  pokemon: '\u26A1',
  other: '\u{1F4E6}',
};

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  const icon = categoryIcons[product.category] || categoryIcons.other;

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/shop" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          &larr; Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative">
            {product.image && product.image !== '/placeholder.jpg' ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <span className="text-8xl">{icon}</span>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
            {product.grade && (
              <p className="text-emerald-400 font-semibold mb-4">{product.grade}</p>
            )}

            <p className="text-3xl font-bold text-white mb-6">${product.price}</p>

            <Link
              href={`/checkout?productId=${product.id}`}
              className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition text-center mb-4"
            >
              Buy Now
            </Link>

            {product.description && (
              <p className="text-slate-400 mb-6">{product.description}</p>
            )}

            {product.details && Object.keys(product.details).length > 0 && (
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Details</h3>
                <dl className="space-y-2 text-sm">
                  {Object.entries(product.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.seller && (
              <p className="text-slate-500 text-sm mt-4">Sold by {product.seller}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
