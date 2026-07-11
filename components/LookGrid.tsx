'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LOOKS } from '@/lib/looks';
import { addCartItem } from '@/lib/cart-actions';
import type { Product } from '@/lib/types';
import type { SizeOption } from '@/lib/queries';

type ViewMode = 'single' | 'triple' | 'products';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function LookGrid({
  isLoggedIn, products, inCart, sizeMap,
}: {
  isLoggedIn: boolean;
  products: Product[];
  inCart: string[];
  sizeMap: Record<string, SizeOption[]>;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [added, setAdded] = useState<Record<string, boolean>>(() => Object.fromEntries(inCart.map((id) => [id, true])));
  const [pending, startTransition] = useTransition();
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});

  function getSizeOptions(p: Product): SizeOption[] {
    const opts = sizeMap[p.name];
    if (opts && opts.length > 0) return opts;
    return [{ size: 'Free', available: true, productId: p.id }];
  }

  function resolveProductId(name: string, fallbackId: string, opts: SizeOption[]): string | null {
    const size = selectedSize[name];
    if (!size) return null;
    return opts.find((s) => s.size === size)?.productId ?? fallbackId;
  }

  useEffect(() => {
    const saved = localStorage.getItem('lala_look_view');
    if (saved === 'single' || saved === 'triple' || saved === 'products') {
      setViewMode(!isLoggedIn && saved === 'products' ? 'single' : saved);
    }
  }, [isLoggedIn]);
  function changeView(mode: ViewMode) {
    if (mode === 'products' && !isLoggedIn) { router.push('/signup'); return; }
    setViewMode(mode);
    localStorage.setItem('lala_look_view', mode);
  }

  function addProduct(name: string, fallbackId: string, opts: SizeOption[]) {
    if (!isLoggedIn) { router.push(`/login?next=/looks`); return; }
    const productId = resolveProductId(name, fallbackId, opts);
    if (!productId) return; // 사이즈를 아직 안 골랐으면 담기 자체를 막음
    startTransition(async () => {
      const res = await addCartItem(productId);
      if (res.ok) setAdded((a) => ({ ...a, [productId]: true }));
    });
  }

  const visible = isLoggedIn ? LOOKS : LOOKS.slice(0, 9);
  const locked = isLoggedIn ? [] : LOOKS.slice(9);
  const gridClass = viewMode === 'triple' ? 'look-grid look-grid-triple' : 'look-grid';

  const card = (l: (typeof LOOKS)[number]) => (
    <Link key={l.id} href={`/looks/${l.id}`} className="look-card">
      <div className="look-cover" style={{ background: `linear-gradient(160deg, ${l.c2}, ${l.c1})` }} />
    </Link>
  );

  return (
    <section className="catalog">
      <div className="look-view-toggle">
        <button
          type="button"
          className={`look-view-btn ${viewMode === 'single' ? 'on' : ''}`}
          aria-label="한 개씩 보기"
          onClick={() => changeView('single')}
        >
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" fill="currentColor" /></svg>
        </button>
        <button
          type="button"
          className={`look-view-btn ${viewMode === 'triple' ? 'on' : ''}`}
          aria-label="여러 개 한번에 보기"
          onClick={() => changeView('triple')}
        >
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" fill="currentColor" />
            <rect x="9" y="2" width="5" height="5" fill="currentColor" />
            <rect x="2" y="9" width="5" height="5" fill="currentColor" />
            <rect x="9" y="9" width="5" height="5" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={`look-view-btn ${viewMode === 'products' ? 'on' : ''} ${!isLoggedIn ? 'locked' : ''}`}
          aria-label={isLoggedIn ? '전체 상품 보기' : '가입하면 볼 수 있어요'}
          onClick={() => changeView('products')}
        >
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="3.3" height="3.3" fill="currentColor" />
            <rect x="6.7" y="2" width="7.3" height="3.3" fill="currentColor" />
            <rect x="2" y="6.35" width="3.3" height="3.3" fill="currentColor" />
            <rect x="6.7" y="6.35" width="7.3" height="3.3" fill="currentColor" />
            <rect x="2" y="10.7" width="3.3" height="3.3" fill="currentColor" />
            <rect x="6.7" y="10.7" width="7.3" height="3.3" fill="currentColor" />
          </svg>
        </button>
      </div>

      {viewMode === 'products' ? (
        <div className="product-list">
          {products.map((p) => {
            const opts = getSizeOptions(p);
            const productId = resolveProductId(p.name, p.id, opts);
            const isIn = !!productId && !!added[productId];
            const needsSize = !productId;
            return (
              <div className="product-row" key={p.id}>
                <div className="product-row-thumb" style={{ background: `linear-gradient(160deg, ${p.c2}, ${p.c1})` }} />
                <div className="product-row-info">
                  <div className="product-row-name">{p.name}</div>
                  <span className="product-row-price">{won(p.dailyPrice)} /일</span>
                </div>
                {needsSize ? (
                  <div className="size-chip-row size-chip-row-slot">
                    {opts.map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSize((m) => ({ ...m, [p.name]: s.size }))}
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
                    onClick={() => addProduct(p.name, p.id, opts)}
                  >
                    {isIn ? '담김' : '담기'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className={gridClass}>{visible.map(card)}</div>

          {locked.length > 0 && (
            <div className="lock-wrap">
              <div className={`${gridClass} lock-blur`}>{locked.map(card)}</div>
              <div className="lock-overlay">
                <div className="lock-msg">가입하면 모든 룩북을 볼 수 있어요</div>
                <Link href="/signup" className="cta" style={{ width: 'auto', padding: '12px 26px', marginTop: 14 }}>
                  가입하고 모두 보기
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
