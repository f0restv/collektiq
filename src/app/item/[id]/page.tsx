import Link from 'next/link'

// TODO: Fetch from API based on ID
const mockItem = {
  id: '1',
  name: '1921 Morgan Silver Dollar',
  grade: 'MS-63',
  price: 79,
  description: 'Beautiful 1921 Morgan Silver Dollar in MS-63 condition. Excellent luster with minimal bag marks. Philadelphia mint.',
  details: {
    year: 1921,
    mint: 'Philadelphia',
    composition: '90% Silver, 10% Copper',
    weight: '26.73g',
    diameter: '38.1mm',
    certification: 'PCGS',
    certNumber: '12345678',
  },
  images: ['/placeholder.jpg'],
  seller: '45° North Collective',
}

export default function ItemPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/shop" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          ← Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center">
            <span className="text-8xl">🪙</span>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{mockItem.name}</h1>
            <p className="text-emerald-400 font-semibold mb-4">{mockItem.grade}</p>
            
            <p className="text-3xl font-bold text-white mb-6">${mockItem.price}</p>

            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition mb-4">
              Buy Now
            </button>

            <p className="text-slate-400 mb-6">{mockItem.description}</p>

            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                {Object.entries(mockItem.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="text-slate-500 text-sm mt-4">Sold by {mockItem.seller}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
