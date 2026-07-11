import { listOrders, listDeliveryStaff } from '@/lib/staff-actions';
import AdminOrders from '@/components/AdminOrders';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [orders, staff] = await Promise.all([listOrders(), listDeliveryStaff()]);
  return <AdminOrders orders={orders} staff={staff} />;
}
