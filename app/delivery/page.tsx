import { listOrders } from '@lala/shared/lib/staff-actions';
import DeliveryList from '@/components/DeliveryList';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const orders = await listOrders();
  return <DeliveryList orders={orders} />;
}
