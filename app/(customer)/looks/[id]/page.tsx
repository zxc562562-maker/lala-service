import { notFound, redirect } from 'next/navigation';
import { getLook, getLookImages } from '@/lib/looks';
import { getProductsByNames, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import LookItems from '@/components/LookItems';
import LookGallery from '@/components/LookGallery';

export const dynamic = 'force-dynamic';

export default async function LookPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const look = getLook(params.id);
  if (!look) notFound();

  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/looks/${params.id}`)}`);

  const [products, cartItems, sizeMap] = await Promise.all([
    getProductsByNames(look.items),
    getCartItems(),
    getSizeAvailabilityByNames(look.items),
  ]);
  const inCart = cartItems.map((c) => c.productId);

  const items = products.map((p) => ({
    id: p.id, name: p.name, size: p.size, dailyPrice: p.dailyPrice, c1: p.c1, c2: p.c2,
  }));

  return (
    <section className="look-detail">
      <LookGallery images={getLookImages(look)} />
      <div className="look-items-label">이 룩의 아이템</div>
      <LookItems items={items} inCart={inCart} sizeMap={sizeMap} />
    </section>
  );
}
