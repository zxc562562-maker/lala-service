import { notFound, redirect } from 'next/navigation';
import { getLook, getLookImages } from '@/lib/looks';
import { getProductsByNames, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';
import { supabaseServer } from '@/lib/supabase/server';
import LookItems from '@/components/LookItems';
import LookGallery from '@/components/LookGallery';

export const dynamic = 'force-dynamic';

export default async function LookPage({ params }: { params: { id: string } }) {
  const look = getLook(params.id);
  if (!look) notFound();

  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/looks/${params.id}`)}`);

  const products = await getProductsByNames(look.items);
  const inCart = (await getCartItems()).map((c) => c.productId);
  const sizeMap = await getSizeAvailabilityByNames(look.items);

  const items = products.map((p) => ({
    id: p.id, name: p.name, size: p.size, dailyPrice: p.dailyPrice, c1: p.c1, c2: p.c2,
  }));

  return (
    <section className="look-detail">
      <LookGallery images={getLookImages(look)} />
      <div className="look-items-label">이 룩의 아이템</div>
      <LookItems items={items} isLoggedIn lookId={look.id} inCart={inCart} sizeMap={sizeMap} />
    </section>
  );
}
