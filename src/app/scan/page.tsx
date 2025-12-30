'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface PricingSource {
  name: string;
  source: string;
  sourceUrl?: string;
  prices?: {
    raw?: { low?: number; mid?: number; high?: number };
    graded?: Record<string, { low?: number; mid?: number; high?: number }>;
  };
  lastUpdated?: string;
}

interface AnalysisResult {
  identification: {
    category: string;
    name: string;
    year?: number;
    description?: string;
    mint?: string;
    denomination?: string;
    player?: string;
    set?: string;
    certNumber?: string;
    confidence?: number;
  };
  grade: {
    estimate: string;
    numericGrade?: number | null;
    confidence: number;
    notes?: string;
    details?: {
      surfaces?: string;
      centering?: string;
      corners?: string;
      edges?: string;
      strike?: string;
      luster?: string;
    };
  };
  searchTerms?: string[];
  pricing: {
    ebayAvg: number;
    ebayLow: number;
    ebayHigh: number;
    sources?: PricingSource[];
    greysheet?: number;
    redbook?: number;
    buyNow: number;
  };
}

interface Collection {
  id: string;
  name: string;
  itemCount: number;
}

export default function ScanPage() {
  const { data: session } = useSession()
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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
    setSaveSuccess(false)
  }

  const fetchCollections = async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/collections')
      if (res.ok) {
        const data = await res.json()
        setCollections(data.collections || [])
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err)
    }
  }

  useEffect(() => {
    if (showSaveModal && session?.user) {
      fetchCollections()
    }
  }, [showSaveModal, session])

  const handleSaveToCollection = async () => {
    if (!result || !image) return
    setSaving(true)

    try {
      let collectionId = selectedCollection

      // Create new collection if needed
      if (newCollectionName.trim()) {
        const createRes = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCollectionName.trim() }),
        })
        if (!createRes.ok) throw new Error('Failed to create collection')
        const { collection } = await createRes.json()
        collectionId = collection.id
      }

      if (!collectionId) {
        setError('Please select or create a collection')
        setSaving(false)
        return
      }

      // Add item to collection
      const addRes = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customItem: {
            title: result.identification.name,
            description: result.identification.description,
            category: result.identification.category,
            images: [image],
            grade: result.grade.estimate,
            currentValue: result.pricing.ebayAvg,
            metadata: {
              year: result.identification.year,
              mint: result.identification.mint,
              denomination: result.identification.denomination,
              gradeConfidence: result.grade.confidence,
              pricing: result.pricing,
            },
          },
        }),
      })

      if (!addRes.ok) throw new Error('Failed to save item')

      setSaveSuccess(true)
      setShowSaveModal(false)
      setNewCollectionName('')
      setSelectedCollection('')
    } catch (err) {
      console.error('Save failed:', err)
      setError('Failed to save to collection')
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
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
            <button onClick={() => setError(null)} className="float-right text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg mb-6">
            Item saved to your collection!
            <Link href="/account/collection" className="ml-2 underline hover:text-emerald-300">View Collection</Link>
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
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-white">Identification</h2>
                {result.identification?.category && (
                  <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 uppercase">
                    {result.identification.category}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-emerald-400">{result.identification?.name}</p>
              <p className="text-slate-400">
                {[result.identification?.mint, result.identification?.year, result.identification?.denomination]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              {result.identification?.certNumber && (
                <p className="text-slate-500 text-sm mt-1">Cert# {result.identification.certNumber}</p>
              )}
              {result.identification?.description && (
                <p className="text-slate-300 mt-2 text-sm">{result.identification.description}</p>
              )}
            </div>

            {/* Grade */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Estimated Grade</h2>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-white">{result.grade?.estimate}</span>
                {result.grade?.confidence !== undefined && (
                  <span className="text-slate-400">
                    ({Math.round(result.grade.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
              {result.grade?.notes && (
                <p className="text-slate-400 mt-2 text-sm">{result.grade.notes}</p>
              )}
              {result.grade?.details && Object.keys(result.grade.details).some(k => result.grade?.details?.[k as keyof typeof result.grade.details]) && (
                <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-2 text-sm">
                  {result.grade.details.surfaces && <div><span className="text-slate-500">Surfaces:</span> <span className="text-slate-300">{result.grade.details.surfaces}</span></div>}
                  {result.grade.details.strike && <div><span className="text-slate-500">Strike:</span> <span className="text-slate-300">{result.grade.details.strike}</span></div>}
                  {result.grade.details.luster && <div><span className="text-slate-500">Luster:</span> <span className="text-slate-300">{result.grade.details.luster}</span></div>}
                  {result.grade.details.centering && <div><span className="text-slate-500">Centering:</span> <span className="text-slate-300">{result.grade.details.centering}</span></div>}
                  {result.grade.details.corners && <div><span className="text-slate-500">Corners:</span> <span className="text-slate-300">{result.grade.details.corners}</span></div>}
                  {result.grade.details.edges && <div><span className="text-slate-500">Edges:</span> <span className="text-slate-300">{result.grade.details.edges}</span></div>}
                </div>
              )}
            </div>

            {/* Pricing - All Sources */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Market Prices</h2>

              {/* Primary estimate */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Estimated Value</p>
                  <p className="text-white text-2xl font-bold">{formatPrice(result.pricing?.ebayAvg)}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Price Range</p>
                  <p className="text-white text-xl font-semibold">
                    {formatPrice(result.pricing?.ebayLow)} - {formatPrice(result.pricing?.ebayHigh)}
                  </p>
                </div>
              </div>

              {/* Individual sources */}
              <div className="space-y-2">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Data Sources</p>

                {result.pricing?.sources && result.pricing.sources.length > 0 ? (
                  result.pricing.sources.map((source, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                      <div>
                        <p className="text-slate-300">{source.name || source.source}</p>
                        {source.sourceUrl && (
                          <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-emerald-400">
                            View source →
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        {source.prices?.raw?.mid ? (
                          <p className="text-white font-semibold">{formatPrice(source.prices.raw.mid)}</p>
                        ) : source.prices?.graded && Object.keys(source.prices.graded).length > 0 ? (
                          <p className="text-white font-semibold">
                            {formatPrice(Object.values(source.prices.graded)[0]?.mid)}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-sm">N/A</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {result.pricing?.greysheet && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-slate-300">Greysheet</span>
                        <span className="text-white font-semibold">{formatPrice(result.pricing.greysheet)}</span>
                      </div>
                    )}
                    {result.pricing?.redbook && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-slate-300">Redbook</span>
                        <span className="text-white font-semibold">{formatPrice(result.pricing.redbook)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {result.pricing?.buyNow && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm mb-1">Instant Cash Offer</p>
                  <p className="text-white text-2xl font-bold">{formatPrice(result.pricing.buyNow)}</p>
                  <p className="text-slate-400 text-xs mt-1">We'll buy it from you right now at this price</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={reset}
                className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
              >
                Scan Another
              </button>
              {session?.user ? (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition"
                >
                  Save to Collection
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition text-center"
                >
                  Sign in to Save
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/sell"
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg transition text-center"
              >
                Sell Yours
              </Link>
              <Link
                href="/shop"
                className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition text-center"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        )}

        {/* Save to Collection Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Save to Collection</h3>

              {collections.length > 0 && (
                <div className="mb-4">
                  <label className="text-slate-400 text-sm mb-2 block">Choose existing collection</label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => {
                      setSelectedCollection(e.target.value)
                      setNewCollectionName('')
                    }}
                    className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select a collection...</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.itemCount} items)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label className="text-slate-400 text-sm mb-2 block">
                  {collections.length > 0 ? 'Or create new collection' : 'Create a collection'}
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => {
                    setNewCollectionName(e.target.value)
                    setSelectedCollection('')
                  }}
                  placeholder="My Coin Collection"
                  className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToCollection}
                  disabled={saving || (!selectedCollection && !newCollectionName.trim())}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-3 rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
