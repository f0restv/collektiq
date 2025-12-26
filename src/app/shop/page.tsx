'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductGrid } from '@/components/ProductCard';
import type { Product, CollectibleCategory } from '@/types';

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const categories: { slug: string; name: string; value: CollectibleCategory | null }[] = [
  { slug: 'all', name: 'All', value: null },
  { slug: 'coins', name: 'Coins', value: 'coin' },
  { slug: 'currency', name: 'Currency', value: 'currency' },
  { slug: 'sports-cards', name: 'Sports Cards', value: 'sports-card' },
  { slug: 'pokemon', name: 'Pokemon', value: 'pokemon' },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchProducts = async (category: CollectibleCategory | null, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('offset', currentOffset.toString());
      params.set('limit', '20');

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();

      if (reset) {
        setProducts(data.products);
        setOffset(data.products.length);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
        setOffset((prev) => prev + data.products.length);
      }

      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const category = categories.find((c) => c.slug === activeCategory)?.value || null;
    fetchProducts(category, true);
  }, [activeCategory]);

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    setOffset(0);
  };

  const handleLoadMore = () => {
    const category = categories.find((c) => c.slug === activeCategory)?.value || null;
    fetchProducts(category, false);
  };

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          &larr; Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Shop Collectibles</h1>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeCategory === cat.slug
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchProducts(categories.find((c) => c.slug === activeCategory)?.value || null, true)}
              className="text-red-400 underline mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Products Grid */}
        <ProductGrid products={products} loading={loading && products.length === 0} />

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg transition"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading more indicator */}
        {loading && products.length > 0 && (
          <div className="text-center mt-8">
            <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </main>
  );
}
