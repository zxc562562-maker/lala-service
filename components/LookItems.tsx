'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addCartItem } from '@/lib/cart-actions';
import type { SizeOption } from '@/lib/queries';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

interface Item {
  id: string;
  name: string;
  size: string;
  dailyPrice: number;
  c1: string;
  c2: string;
}

export default function LookItems({
  items, isLoggedIn, lookId, inCart, sizeMap,
}: {
  items: Item[];
  isLoggedIn: boolean;
  lookId: string;
  inCart: string[];
  sizeMap: Record<string, SizeOption[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(inCart.map((id) => [id, true])),
  );
  // 아이템(스타일)별로 지금 선택된 사이즈. 무조건 직접 골라야 함(기본 선택 없음) — 사이즈 옵션이 아예 없으면 "Free" 하나만 보여줌.
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const autoRan = useRef(false);

  function getSizeOptions(g: Item): SizeOption[] {
    const opts = sizeMap[g.name];
    if (opts && opts.length > 0) return opts;
    return [{ size: 'Free', available: true, productId: g.id }];
  }

  function resolveProductId(name: string, fallbackId: string, opts: SizeOption[]): string | null {
    const size = selectedSize[name];
    if (!size) return null;
    return opts.find((s) => s.size === size)?.productId ?? fallbackId;
  }

  // 로그인 후 복귀: ?add=<productId> 가 있으면 자동으로 담기
  useEffect(() => {
    if (autoRan.current) return;
    const addId = searchParams.get('add');
    if (addId && isLoggedIn) {
      autoRan.current = true;
      startTransition(async () => {
        const res = await addCartItem(addId);
        if (res.ok) setAdded((a) => ({ ...a, [addId]: true }));
        router.replace(`/looks/${lookId}`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoggedIn, lookId]);

  function add(name: string, fallbackId: string, opts: SizeOption[]) {
    const productId = resolveProductId(name, fallbackId, opts);
    if (!productId) return; // 사이즈를 아직 안 골랐으면 담기 자체를 막음
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/looks/${lookId}?add=${productId}`)}`);
      return;
    }
    startTransition(async () => {
      const res = await addCartItem(productId);
      if (res.ok) setAdded((a) => ({ ...a, [productId]: true }));
    });
  }

  return (
    <>
      <div className="look-items">
        {items.map((g) => {
          const opts = getSizeOptions(g);
          const productId = resolveProductId(g.name, g.id, opts);
          const isIn = !!productId && !!added[productId];
          const needsSize = !productId;
          return (
            <div className="look-item" key={g.id}>
              <div className="li-thumb" style={{ background: `linear-gradient(160deg, ${g.c2}, ${g.c1})` }} />
              <div className="li-info">
                <div className="li-name">{g.name}</div>
                <span className="li-price">{won(g.dailyPrice)} /일</span>
              </div>
              {needsSize ? (
                <div className="size-chip-row size-chip-row-slot">
                  {opts.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSelectedSize((m) => ({ ...m, [g.name]: s.size }))}
                      className={!s.available ? 'size-chip unavailable' : 'size-chip pickable'}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className={`li-add ${isIn ? 'added' : ''}`}
                  disabled={isIn || pending}
                  onClick={() => add(g.name, g.id, opts)}
                >
                  {isIn ? '담김' : '담기'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <a className="cta" href="/cart" style={{ display: 'block', textAlign: 'center', marginBottom: 15 }}>
        CHECK THE CART
      </a>
    </>
  );
}
