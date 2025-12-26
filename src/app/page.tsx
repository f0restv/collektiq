import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Kollekt<span className="text-emerald-400">IQ</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Snap a photo. Get instant identification, grading, and market prices for coins, cards, and collectibles.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/scan"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition"
          >
            Scan Your Item
          </Link>
          <Link
            href="/shop"
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition"
          >
            Shop Collectibles
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">1. Snap</h3>
            <p className="text-slate-400">Take a photo of your coin, card, or collectible</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">2. Identify</h3>
            <p className="text-slate-400">AI identifies your item and estimates grade</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3. Price</h3>
            <p className="text-slate-400">Get real market prices from eBay, Redbook & more</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">What We Cover</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {['Coins', 'Currency', 'Sports Cards', 'Pokemon'].map((cat) => (
            <Link
              key={cat}
              href={`/shop/${cat.toLowerCase().replace(' ', '-')}`}
              className="bg-slate-800 hover:bg-slate-700 rounded-lg p-6 text-center transition"
            >
              <span className="text-white font-medium">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Want to sell?</h2>
          <p className="text-slate-300 mb-6">
            Get an instant quote or list with us for maximum exposure across eBay, Etsy, and more.
          </p>
          <Link
            href="/sell"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Get a Quote
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} KollektIQ. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
