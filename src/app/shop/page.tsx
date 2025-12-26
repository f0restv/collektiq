import Link from 'next/link'

// TODO: Fetch from client-commerce-platform API
const mockItems = [
  { id: '1', name: '1921 Morgan Silver Dollar MS-63', price: 79, category: 'coins', image: '/placeholder.jpg' },
  { id: '2', name: '1923 Peace Dollar AU-58', price: 45, category: 'coins', image: '/placeholder.jpg' },
  { id: '3', name: '2023 Topps Chrome Mike Trout PSA 10', price: 125, category: 'sports-cards', image: '/placeholder.jpg' },
  { id: '4', name: 'Charizard Base Set Holo PSA 7', price: 450, category: 'pokemon', image: '/placeholder.jpg' },
  { id: '5', name: '$2 Red Seal 1953 VF', price: 15, category: 'currency', image: '/placeholder.jpg' },
  { id: '6', name: '1878-S Morgan Dollar VF-30', price: 52, category: 'coins', image: '/placeholder.jpg' },
]

const categories = [
  { slug: 'all', name: 'All' },
  { slug: 'coins', name: 'Coins' },
  { slug: 'currency', name: 'Currency' },
  { slug: 'sports-cards', name: 'Sports Cards' },
  { slug: 'pokemon', name: 'Pokemon' },
]

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Shop Collectibles</h1>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.slug === 'all' ? '/shop' : `/shop/${cat.slug}`}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg whitespace-nowrap transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockItems.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="bg-slate-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition"
            >
              <div className="aspect-square bg-slate-700 flex items-center justify-center">
                <span className="text-4xl">🪙</span>
              </div>
              <div className="p-4">
                <p className="text-white font-medium text-sm line-clamp-2 mb-2">{item.name}</p>
                <p className="text-emerald-400 font-bold">${item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
