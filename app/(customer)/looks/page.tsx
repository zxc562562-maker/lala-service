import LookGrid from '@/components/LookGrid';
import { supabaseServer } from '@/lib/supabase/server';
import { getProducts, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';

export const dynamic = 'force-dynamic';

export default async function LooksPage() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  const products = await getProducts();
  const inCart = user ? (await getCartItems()).map((c) => c.productId) : [];
  const sizeMap = await getSizeAvailabilityByNames(products.map((p) => p.name));
  return <LookGrid isLoggedIn={!!user} products={products} inCart={inCart} sizeMap={sizeMap} />;
}
