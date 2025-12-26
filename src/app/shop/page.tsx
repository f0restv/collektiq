'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ProductGrid } from '@/components/ProductCard';
import { api } from '@/lib/api';
import type { Product, CollectibleCategory } from '@/types';

const categories: { slug: string; name: string; value: CollectibleCategory | null; icon: string }[] = [
  { slug: 'all', name: 'All', value: null, icon: '📦' },
  { slug: 'coins', name: 'Coins', value: 'coin', icon: '🪙' },
  { slug: 'currency', name: 'Currency', value: 'currency', icon: '💵' },
  { slug: 'sports-cards', name: 'Sports Cards', value: 'sports-card', icon: '🏈' },
  { slug: 'pokemon', name: 'Pokemon', value: 'pokemon', icon: '⚡' },
];

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async (
    category: CollectibleCategory | null,
    search: string,
    reset = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      const data = await api.getProducts({
        category: category || undefined,
        search: search || undefined,
        offset: currentOffset,
        limit: 20,
      });

      if (reset) {
        setProducts(data.products);
        setOffset(data.products.length);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
        setOffset((prev) => prev + data.products.length);
      }

      setHasMore(data.pagination.hasMore);
      setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [products, sortBy]);

  useEffect(() => {
    const category = categories.find((c) => c.slug === activeCategory)?.value || null;
    fetchProducts(category, searchQuery, true);
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    setOffset(0);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    setSearchQuery(query);
    setOffset(0);
  };

  const handleLoadMore = () => {
    const category = categories.find((c) => c.slug === activeCategory)?.value || null;
    fetchProducts(category, searchQuery, false);
  };

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Shop Collectibles</h1>
            {!loading && totalCount > 0 && (
              <p className="text-slate-400 text-sm mt-1">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} available
              </p>
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search collectibles..."
                defaultValue={searchQuery}
                className="bg-slate-800 text-white placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none w-full md:w-64"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                activeCategory === cat.slug
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Sort and Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {searchQuery && (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400 text-sm">Search:</span>
                <span className="text-white text-sm">&quot;{searchQuery}&quot;</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white ml-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-slate-400 text-sm hidden sm:block">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchProducts(categories.find((c) => c.slug === activeCategory)?.value || null, searchQuery, true)}
              className="text-red-400 underline mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Products Grid */}
        <ProductGrid products={sortedProducts} loading={loading && products.length === 0} />

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
