import { notFound, redirect } from 'next/navigation';
import { getProduct, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';
import { getCachedUser } from '@/lib/auth-cache';
import ProductStickyBar from '@/components/ProductStickyBar';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/products/${params.id}`)}`);

  const product = await getProduct(params.id);
  if (!product) notFound();

  const [sizeMap, cartItems] = await Promise.all([
    getSizeAvailabilityByNames([product.name]),
    getCartItems(),
  ]);
  const options = sizeMap[product.name]?.length ? sizeMap[product.name] : [{ size: product.size, available: true, productId: product.id }];
  const inCart = cartItems.map((c) => c.productId);
  const gradient = `linear-gradient(160deg, ${product.c2}, ${product.c1})`;

  return (
    <section className="detail product-detail-scroll">
      <div className="product-detail-photo" style={{ background: gradient }} />
      <h1 className="product-detail-name">{product.name}</h1>
      <div className="order-detail-plain" style={{ marginTop: 8 }}>
        <div className="row"><span>카테고리</span><span>{product.category}</span></div>
      </div>

      <div className="field-section" style={{ marginTop: 22 }}>룩북</div>
      <div className="product-gallery-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="product-detail-photo" key={`look-${i}`} style={{ background: gradient }} />
        ))}
      </div>

      <div className="field-section" style={{ marginTop: 22 }}>상세 이미지</div>
      <div className="product-gallery-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="product-detail-photo" key={`detail-${i}`} style={{ background: gradient }} />
        ))}
      </div>

      <ProductStickyBar
        dailyPrice={product.dailyPrice}
        deposit={product.deposit}
        productName={product.name}
        fallbackId={product.id}
        options={options}
        inCart={inCart}
      />
    </section>
  );
}
