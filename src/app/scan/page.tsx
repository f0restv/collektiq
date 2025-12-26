'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const analyze = async () => {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [image] }),
      })
      
      if (!res.ok) {
        throw new Error('Analysis failed')
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setImage(null)
    setResult(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Scan Your Item</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!image ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-emerald-500 transition cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-white text-lg mb-2">Drop an image or tap to upload</p>
              <p className="text-slate-400 text-sm">Supports JPG, PNG, HEIC</p>
            </label>
          </div>
        ) : !result ? (
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden">
              <img src={image} alt="Uploaded" className="w-full" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
              >
                Try Different Photo
              </button>
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-3 rounded-lg transition"
              >
                {analyzing ? 'Analyzing...' : 'Identify & Price'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden">
              <img src={image} alt="Uploaded" className="w-full" />
            </div>

            {/* Identification */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Identification</h2>
              <p className="text-2xl font-bold text-emerald-400">{result.identification?.name}</p>
              <p className="text-slate-400">
                {[result.identification?.mint, result.identification?.year, result.identification?.denomination]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              {result.identification?.description && (
                <p className="text-slate-300 mt-2">{result.identification.description}</p>
              )}
            </div>

            {/* Grade */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Estimated Grade</h2>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-white">{result.grade?.estimate}</span>
                {result.grade?.confidence && (
                  <span className="text-slate-400">
                    ({Math.round(result.grade.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
              {result.grade?.notes && (
                <p className="text-slate-400 mt-2">{result.grade.notes}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Market Prices</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">eBay Avg</p>
                  <p className="text-white text-xl font-semibold">${result.pricing?.ebayAvg}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">eBay Range</p>
                  <p className="text-white text-xl font-semibold">
                    ${result.pricing?.ebayLow} - ${result.pricing?.ebayHigh}
                  </p>
                </div>
                {result.pricing?.redbook && (
                  <div>
                    <p className="text-slate-400 text-sm">Redbook</p>
                    <p className="text-white text-xl font-semibold">${result.pricing.redbook}</p>
                  </div>
                )}
                {result.pricing?.greysheet && (
                  <div>
                    <p className="text-slate-400 text-sm">Greysheet</p>
                    <p className="text-white text-xl font-semibold">${result.pricing.greysheet}</p>
                  </div>
                )}
              </div>
              
              {result.pricing?.buyNow && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm mb-1">Buy Now Price</p>
                  <p className="text-white text-2xl font-bold">${result.pricing.buyNow}</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-3 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition text-sm"
                  >
                    View Available
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
              >
                Scan Another
              </button>
              <Link
                href="/sell"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg transition text-center"
              >
                Sell Yours
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
