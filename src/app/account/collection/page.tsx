'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface CollectionItem {
  id: string;
  productId?: string;
  customTitle?: string;
  customDescription?: string;
  customImages?: string[];
  customCategory?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  purchaseSource?: string;
  currentValue?: number;
  valueUpdatedAt?: string;
  grade?: string;
  certification?: string;
  certNumber?: string;
  notes?: string;
  order: number;
  isFavorite: boolean;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    price: number;
    images: { url: string }[];
    grade?: string;
    category: { name: string };
  };
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  itemCount: number;
  totalValue?: number;
  createdAt: string;
  items?: CollectionItem[];
}

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      fetchCollections();
    }
  }, [session]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/collections');
      if (!res.ok) throw new Error('Failed to fetch collections');
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      setError('Failed to load collections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionItems = async (collectionId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (!res.ok) throw new Error('Failed to fetch collection');
      const data = await res.json();
      setSelectedCollection(data.collection);
    } catch (err) {
      setError('Failed to load collection items');
      console.error(err);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to create collection');

      const { collection } = await res.json();
      setCollections([...collections, collection]);
      setNewCollectionName('');
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create collection');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-1/4"></div>
            <div className="h-64 bg-slate-800 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="text-emerald-400 hover:text-emerald-300 mb-2 inline-block text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">My Collection</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
          >
            + New Collection
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}

        {selectedCollection ? (
          <div>
            <button
              onClick={() => setSelectedCollection(null)}
              className="text-emerald-400 hover:text-emerald-300 mb-4 inline-block"
            >
              ← Back to Collections
            </button>

            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCollection.name}</h2>
                  {selectedCollection.description && (
                    <p className="text-slate-400 mt-1">{selectedCollection.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatPrice(selectedCollection.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            {selectedCollection.items && selectedCollection.items.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCollection.items.map((item) => (
                  <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden">
                    {(item.customImages?.[0] || item.product?.images?.[0]?.url) && (
                      <div className="aspect-square bg-slate-700">
                        <img
                          src={item.customImages?.[0] || item.product?.images?.[0]?.url}
                          alt={item.customTitle || item.product?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">
                        {item.customTitle || item.product?.title}
                      </h3>
                      {item.grade && (
                        <span className="inline-block px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 mb-2">
                          {item.grade}
                        </span>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-slate-400 text-sm">Current Value</span>
                        <span className="text-emerald-400 font-semibold">
                          {formatPrice(item.currentValue || item.product?.price)}
                        </span>
                      </div>
                      {item.purchasePrice && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-slate-500 text-sm">Paid</span>
                          <span className="text-slate-400 text-sm">
                            {formatPrice(item.purchasePrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-slate-400 mb-4">No items in this collection yet</p>
                <Link
                  href="/scan"
                  className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition"
                >
                  Scan an Item
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {collections.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => fetchCollectionItems(collection.id)}
                    className="bg-slate-800 rounded-xl p-6 text-left hover:bg-slate-700 transition"
                  >
                    {collection.coverImage ? (
                      <div className="aspect-video bg-slate-700 rounded-lg mb-4 overflow-hidden">
                        <img src={collection.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-700 rounded-lg mb-4 flex items-center justify-center text-4xl">
                        📁
                      </div>
                    )}
                    <h3 className="text-white font-semibold text-lg">{collection.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-400 text-sm">{collection.itemCount} items</span>
                      {collection.totalValue !== undefined && collection.totalValue > 0 && (
                        <span className="text-emerald-400 font-semibold">
                          {formatPrice(collection.totalValue)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">📁</div>
                <h2 className="text-xl font-semibold text-white mb-2">No collections yet</h2>
                <p className="text-slate-400 mb-6">Create a collection to start tracking your items</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition"
                >
                  Create Your First Collection
                </button>
              </div>
            )}
          </>
        )}

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Create Collection</h3>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-emerald-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCollectionName('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  disabled={creating || !newCollectionName.trim()}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-3 rounded-lg transition"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
