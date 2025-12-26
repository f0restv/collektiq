'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SellPage() {
  const [step, setStep] = useState(1)

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Sell With Us</h1>
        <p className="text-slate-400 mb-8">Get maximum exposure across eBay, Etsy, and more. We handle everything.</p>

        {/* Options */}
        <div className="space-y-4">
          {/* Instant Quote */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Quick Cash</h2>
            <p className="text-slate-400 mb-4">Get an instant offer. We buy it outright, you ship and get paid.</p>
            <Link
              href="/scan"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition"
            >
              Scan for Quote
            </Link>
          </div>

          {/* Consignment */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Consignment</h2>
            <p className="text-slate-400 mb-4">We list it for you across all platforms. You get paid when it sells. Higher returns, we take a small commission.</p>
            <Link
              href="/portal"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition"
            >
              Start Consignment
            </Link>
          </div>

          {/* Bulk */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Bulk / Collections</h2>
            <p className="text-slate-400 mb-4">Have a large collection? Let's talk. We can do on-site visits and make bulk offers.</p>
            <a
              href="mailto:sell@collektiq.com"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-6">How Consignment Works</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Submit', desc: 'Upload photos and tell us your desired payout' },
              { step: 2, title: 'Review', desc: 'We analyze market value and confirm listing price' },
              { step: 3, title: 'List', desc: 'Your item goes live on eBay, Etsy, our site, and more' },
              { step: 4, title: 'Sell', desc: 'We handle buyers, questions, and shipping labels' },
              { step: 5, title: 'Get Paid', desc: 'Money in your account within 24hrs of delivery' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 font-semibold">{item.step}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
