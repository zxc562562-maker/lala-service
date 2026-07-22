import LookGrid from '@/components/LookGrid';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { getProducts, getSizeAvailabilityByNames } from '@/lib/queries';
import { getCartItems } from '@/lib/cart-actions';

export const dynamic = 'force-dynamic';

export default async function LooksPage() {
  const [user, products] = await Promise.all([getCachedUser(), getProducts()]);
  const [inCartItems, sizeMap] = await Promise.all([
    user ? getCartItems() : Promise.resolve([]),
    getSizeAvailabilityByNames(products.map((p) => p.name)),
  ]);
  const inCart = inCartItems.map((c) => c.productId);
  return <LookGrid isLoggedIn={!!user} products={products} inCart={inCart} sizeMap={sizeMap} />;
}
