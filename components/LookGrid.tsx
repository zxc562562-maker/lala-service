'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Look } from '@/lib/looks';
import { addCartItem } from '@/lib/cart-actions';
import type { Product } from '@lala/shared/lib/types';
import type { SizeOption } from '@/lib/queries';

type ViewMode = 'single' | 'triple' | 'products';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function LookGrid({
  isLoggedIn, name, looks, products, inCart, sizeMap,
}: {
  isLoggedIn: boolean;
  name: string;
  looks: Look[];
  products: Product[];
  inCart: string[];
  sizeMap: Record<string, SizeOption[]>;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [added, setAdded] = useState<Record<string, boolean>>(() => Object.fromEntries(inCart.map((id) => [id, true])));
  const [pending, startTransition] = useTransition();
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    // localStorage는 서버 렌더에 없어 여기(마운트 후)에서만 읽을 수 있음
    const saved = localStorage.getItem('lala_look_view');
    if (saved === 'single' || saved === 'triple' || saved === 'products') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode(!isLoggedIn && saved === 'products' ? 'single' : saved);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // 헤더가 로그인 여부에 따라 높이가 달라져서(로그인 시 아래 nav가 없어짐), "한 개씩 보기"의
    // 스크롤 스냅 기준값을 고정 px로 하드코딩하면 또 어긋난다 — 실제 렌더 높이를 재서 CSS 변수로
    // 흘려보낸다(헤더/툴바 실측 102.4px+51px = 154px가 예전 하드코딩값이었던 자리).
    const header = document.querySelector<HTMLElement>('.site-header');
    const toggle = document.querySelector<HTMLElement>('.look-view-toggle');
    const footer = document.querySelector<HTMLElement>('.site-footer-nav');
    if (!header || !toggle) return;
    const update = () => {
      const headerH = header.getBoundingClientRect().height;
      const toggleH = toggle.getBoundingClientRect().height;
      const footerH = footer?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty('--header-h', `${headerH}px`);
      document.documentElement.style.setProperty('--scroll-offset', `${headerH + toggleH}px`);
      document.documentElement.style.setProperty('--footer-h', `${footerH}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    ro.observe(toggle);
    if (footer) ro.observe(footer);
    return () => ro.disconnect();
  }, []);
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

  const visible = isLoggedIn ? looks : looks.slice(0, 9);
  const locked = isLoggedIn ? [] : looks.slice(9);
  const gridClass = viewMode === 'triple' ? 'look-grid look-grid-triple' : 'look-grid';

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const visibleProducts = selectedCategory ? products.filter((p) => p.category === selectedCategory) : products;

  const card = (l: Look) => (
    <Link key={l.id} href={`/looks/${l.id}`} className="look-card">
      {l.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.coverUrl} alt="" className="look-cover" />
      ) : (
        <div className="look-cover" style={{ background: 'linear-gradient(160deg, #6B2737, #3B2230)' }} />
      )}
    </Link>
  );

  return (
    <section className="catalog">
      <div className="look-view-toggle">
        {isLoggedIn && <span className="who">{name}님</span>}
        <div className="look-view-btns">
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
      </div>

      {viewMode === 'products' && (
        <div className="category-filter-row">
          <button
            type="button"
            className={`category-filter-link ${!selectedCategory ? 'on' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            전체
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`category-filter-link ${selectedCategory === c ? 'on' : ''}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'products' ? (
        <div className="product-list">
          {visibleProducts.map((p) => {
            const opts = getSizeOptions(p);
            const productId = resolveProductId(p.name, p.id, opts);
            const isIn = !!productId && !!added[productId];
            return (
              <div className="product-row" key={p.id}>
                <div className="product-row-thumb" style={{ background: `linear-gradient(160deg, ${p.c2}, ${p.c1})` }} />
                <div className="product-row-info">
                  <div className="product-row-name">{p.name}</div>
                  <span className="product-row-price">{won(p.dailyPrice)} /일</span>
                </div>
                <div className="li-row">
                  <div className="size-chip-row">
                    {opts.map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSize((m) => ({ ...m, [p.name]: s.size }))}
                        className={`size-chip ${!s.available ? 'unavailable' : selectedSize[p.name] === s.size ? 'chosen' : 'pickable'}`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  <button
                    className={`li-add ${isIn ? 'added' : ''}`}
                    disabled={!productId || isIn || pending}
                    onClick={() => addProduct(p.name, p.id, opts)}
                  >
                    {isIn ? '담김' : '담기'}
                  </button>
                </div>
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
