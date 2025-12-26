'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CartItem, ShippingAddress } from '@/lib/stripe';
import { formatPrice, calculateTotal } from '@/lib/stripe';

type CheckoutStep = 'cart' | 'address' | 'payment';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const { subtotal, tax, total } = calculateTotal(cartItems);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }
    setCartItems((items) =>
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.productId !== productId));
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !shippingAddress.name || !shippingAddress.line1 ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep('payment');
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress,
          customerEmail: email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-slate-900 py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-slate-800 rounded-xl p-12">
            <svg
              className="w-24 h-24 mx-auto text-slate-600 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-white mb-4">Your cart is empty</h1>
            <p className="text-slate-400 mb-8">
              Looks like you haven&apos;t added any collectibles to your cart yet.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Browse Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {(['cart', 'address', 'payment'] as CheckoutStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => {
                  if (s === 'cart' || (s === 'address' && step !== 'cart') ||
                      (s === 'payment' && step === 'payment')) {
                    setStep(s);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  step === s
                    ? 'bg-emerald-500 text-white'
                    : s === 'cart' || (s === 'address' && step !== 'cart')
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                disabled={s !== 'cart' && !(s === 'address' && step !== 'cart') && !(s === 'payment' && step === 'payment')}
              >
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-900/30 text-sm">
                  {i + 1}
                </span>
                <span className="capitalize hidden sm:inline">{s === 'cart' ? 'Review Cart' : s}</span>
              </button>
              {i < 2 && (
                <div className="w-8 h-0.5 bg-slate-700 mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Cart Review Step */}
            {step === 'cart' && (
              <div className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Review Your Cart</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="relative w-20 h-20 bg-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{item.name}</h3>
                        <p className="text-emerald-400 font-semibold">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white rounded transition"
                        >
                          -
                        </button>
                        <span className="text-white w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white rounded transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-400 transition p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Link
                    href="/shop"
                    className="text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={() => setStep('address')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* Address Step */}
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Shipping Information</h2>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-slate-300 text-sm mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-slate-300 text-sm mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                      required
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="line1" className="block text-slate-300 text-sm mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      id="line1"
                      value={shippingAddress.line1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                      required
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label htmlFor="line2" className="block text-slate-300 text-sm mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="line2"
                      value={shippingAddress.line2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                      className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="Apt, Suite, Unit (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-slate-300 text-sm mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        required
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-slate-300 text-sm mb-2">
                        State *
                      </label>
                      <select
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        required
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postal_code" className="block text-slate-300 text-sm mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        id="postal_code"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                        required
                        pattern="[0-9]{5}(-[0-9]{4})?"
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-slate-300 text-sm mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        value="United States"
                        disabled
                        className="w-full bg-slate-600 text-slate-400 px-4 py-3 rounded-lg border border-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <div className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Payment</h2>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                {/* Shipping Address Summary */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-slate-300 text-sm font-medium">Shipping to:</h3>
                    <button
                      onClick={() => setStep('address')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm transition"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-white">{shippingAddress.name}</p>
                  <p className="text-slate-400 text-sm">
                    {shippingAddress.line1}
                    {shippingAddress.line2 && `, ${shippingAddress.line2}`}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">{email}</p>
                </div>

                {/* Stripe Notice */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Secure Payment with Stripe</p>
                      <p className="text-slate-400 text-sm">
                        You&apos;ll be redirected to Stripe to complete your purchase securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="text-slate-400 hover:text-white transition"
                  >
                    Back to Shipping
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay {formatPrice(total)}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6 sticky top-8">
              <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-emerald-400">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax (est.)</span>
                  <span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Security badges */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure SSL Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Buyer Protection Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
