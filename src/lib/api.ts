// API client for client-commerce-platform backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface AnalyzeRequest {
  images: string[]  // base64 or URLs
  category?: 'coin' | 'currency' | 'sports-card' | 'pokemon' | 'auto'
}

export interface AnalyzeResponse {
  identification: {
    category: string
    name: string
    year?: number
    description: string
    mint?: string
    player?: string
    set?: string
    certNumber?: string
  }
  grade: {
    estimate: string
    confidence: number
    notes: string
  }
  pricing: {
    ebayAvg: number
    ebayLow: number
    ebayHigh: number
    redbook?: number
    greysheet?: number
    buyNow?: number
    buyNowUrl?: string
  }
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  grade?: string
  image: string
  description?: string
}

export const api = {
  // Analyze an item from photos
  async analyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error('Analysis failed')
    return res.json()
  },

  // Get shop inventory
  async getProducts(category?: string): Promise<Product[]> {
    const url = category 
      ? `${API_BASE}/api/products?category=${category}`
      : `${API_BASE}/api/products`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },

  // Get single product
  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/products/${id}`)
    if (!res.ok) throw new Error('Product not found')
    return res.json()
  },

  // Submit for consignment
  async submitConsignment(data: {
    images: string[]
    desiredPayout: number
    contact: { email: string; phone?: string }
  }): Promise<{ submissionId: string }> {
    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Submission failed')
    return res.json()
  },

  // Get instant quote (for quick cash option)
  async getQuote(images: string[]): Promise<{ offer: number; expires: Date }> {
    const res = await fetch(`${API_BASE}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    })
    if (!res.ok) throw new Error('Quote failed')
    return res.json()
  },
}
