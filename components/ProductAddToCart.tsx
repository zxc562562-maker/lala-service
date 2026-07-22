'use client';

import { useState, useTransition } from 'react';
import { addCartItem } from '@/lib/cart-actions';
import type { SizeOption } from '@/lib/queries';

export default function ProductAddToCart({
  productName, fallbackId, options, inCart,
}: {
  productName: string;
  fallbackId: string;
  options: SizeOption[];
  inCart: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(inCart.map((id) => [id, true])),
  );

  const productId = selectedSize ? (options.find((s) => s.size === selectedSize)?.productId ?? fallbackId) : null;
  const isIn = !!productId && !!added[productId];

  function add() {
    if (!productId) return;
    startTransition(async () => {
      const res = await addCartItem(productId);
      if (res.ok) setAdded((a) => ({ ...a, [productId]: true }));
    });
  }

  return (
    <div className="li-row">
      <div className="size-chip-row">
        {options.map((s) => (
          <button
            key={s.size}
            type="button"
            disabled={!s.available}
            onClick={() => setSelectedSize(s.size)}
            className={`size-chip ${!s.available ? 'unavailable' : selectedSize === s.size ? 'chosen' : 'pickable'}`}
          >
            {s.size}
          </button>
        ))}
      </div>
      <button
        className={`li-add ${isIn ? 'added' : ''}`}
        disabled={!productId || isIn || pending}
        onClick={add}
      >
        {isIn ? '담김' : '담기'}
      </button>
    </div>
  );
}
