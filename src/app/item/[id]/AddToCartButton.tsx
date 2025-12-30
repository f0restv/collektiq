'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem } from '@/lib/checkout';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
}

export function AddToCartButton({ productId, name, price, image }: AddToCartButtonProps) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const items: CartItem[] = JSON.parse(cart);
        setInCart(items.some(item => item.productId === productId));
      } catch {
        setInCart(false);
      }
    }
  }, [productId]);

  const addToCart = () => {
    const cart = localStorage.getItem('cart');
    let items: CartItem[] = [];

    if (cart) {
      try {
        items = JSON.parse(cart);
      } catch {
        items = [];
      }
    }

    const existingIndex = items.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      items[existingIndex].quantity += 1;
    } else {
      items.push({
        productId,
        name,
        price,
        image,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(items));
    setAdded(true);
    setInCart(true);

    setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = () => {
    const items: CartItem[] = [{
      productId,
      name,
      price,
      image,
      quantity: 1,
    }];
    localStorage.setItem('cart', JSON.stringify(items));
    router.push('/checkout');
  };

  return (
    <div className="space-y-3 mb-6">
      <button
        onClick={buyNow}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition"
      >
        Buy Now
      </button>
      <button
        onClick={addToCart}
        disabled={added}
        className={`w-full font-semibold py-3 rounded-lg transition border ${
          added
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : inCart
            ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
        }`}
      >
        {added ? 'Added to Cart!' : inCart ? 'Add Another' : 'Add to Cart'}
      </button>
      {inCart && !added && (
        <button
          onClick={() => router.push('/checkout')}
          className="w-full text-emerald-400 hover:text-emerald-300 text-sm transition"
        >
          View Cart →
        </button>
      )}
    </div>
  );
}
