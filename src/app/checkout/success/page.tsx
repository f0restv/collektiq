'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OrderDetails {
  id: string;
  email: string;
  amount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear the cart on successful purchase
    localStorage.removeItem('cart');

    // Fetch order details if session_id is present
    if (sessionId) {
      fetchOrderDetails(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/checkout/session?session_id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading order details...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-slate-800 rounded-xl p-8 md:p-12">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
            Order Confirmed!
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
          </p>

          {error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-6 text-center text-sm">
              {error}
            </div>
          )}

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-slate-700/50 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-600">
                <span className="text-slate-400 text-sm">Order ID</span>
                <span className="text-white font-mono text-sm">{orderDetails.id}</span>
              </div>

              {orderDetails.items && orderDetails.items.length > 0 && (
                <div className="mb-4 pb-4 border-b border-slate-600">
                  <h3 className="text-slate-400 text-sm mb-3">Items</h3>
                  <div className="space-y-2">
                    {orderDetails.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-white">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="text-slate-400">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Paid</span>
                <span className="text-emerald-400 text-xl font-bold">
                  {formatPrice(orderDetails.amount)}
                </span>
              </div>

              {orderDetails.email && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-slate-400 text-sm">
                    Confirmation sent to:{' '}
                    <span className="text-white">{orderDetails.email}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What's Next */}
          <div className="bg-slate-700/30 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs">1</span>
                </div>
                <p className="text-slate-400 text-sm">
                  You&apos;ll receive an email confirmation with your order details
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs">2</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Our team will carefully package your collectibles
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs">3</span>
                </div>
                <p className="text-slate-400 text-sm">
                  You&apos;ll receive tracking information once shipped
                </p>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-center px-6 py-3 rounded-lg font-semibold transition"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-center px-6 py-3 rounded-lg font-semibold transition"
            >
              View Order History
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-sm">
              Questions about your order?{' '}
              <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 transition">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-900 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-slate-800 rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
