import LookGrid from '@/components/LookGrid';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { getProducts, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';
import { getLooks } from '@/lib/looks';

export const dynamic = 'force-dynamic';

export default async function LooksPage() {
  const [user, products, looks] = await Promise.all([getCachedUser(), getProducts(), getLooks()]);
  const [inCartItems, sizeMap] = await Promise.all([
    user ? getCartItems() : Promise.resolve([]),
    getSizeAvailabilityByNames(products.map((p) => p.name)),
  ]);
  const inCart = inCartItems.map((c) => c.productId);
  return <LookGrid isLoggedIn={!!user} looks={looks} products={products} inCart={inCart} sizeMap={sizeMap} />;
}
