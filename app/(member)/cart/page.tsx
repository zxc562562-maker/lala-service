import { getCartPageData } from '@/lib/cart-actions';
import CartClient from '@/components/CartClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const data = await getCartPageData();
  return <CartClient initialData={data} />;
}
