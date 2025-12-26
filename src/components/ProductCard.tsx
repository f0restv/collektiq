import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

const categoryIcons: Record<string, string> = {
  coin: '🪙',
  currency: '💵',
  'sports-card': '🏈',
  pokemon: '⚡',
  other: '📦',
};

const categoryLabels: Record<string, string> = {
  coin: 'Coin',
  currency: 'Currency',
  'sports-card': 'Sports Card',
  pokemon: 'Pokemon',
  other: 'Other',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ProductCard({ product }: ProductCardProps) {
  const icon = categoryIcons[product.category] || categoryIcons.other;
  const categoryLabel = categoryLabels[product.category] || categoryLabels.other;

  return (
    <Link
      href={`/item/${product.id}`}
      className="group bg-slate-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-700 relative overflow-hidden">
        {product.image && !product.image.includes('placeholder') ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs font-medium text-slate-300">
          {categoryLabel}
        </div>

        {/* Grade badge */}
        {product.grade && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
            {product.grade}
          </div>
        )}

        {/* Sold overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">SOLD</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-white font-medium text-sm line-clamp-2 mb-1 group-hover:text-emerald-400 transition-colors">
          {product.name}
        </p>

        <div className="flex items-center gap-2 mb-2">
          {product.year && (
            <span className="text-slate-400 text-xs">{product.year}</span>
          )}
          {product.mint && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-xs">{product.mint}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-emerald-400 font-bold text-lg">{formatPrice(product.price)}</p>
          {product.inStock && (
            <span className="text-emerald-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              View →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-slate-700" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
