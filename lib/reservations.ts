import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { validateRequest, findAvailableItem, todayISO, type Reservation } from './domain/reservation';
import type { InventoryItem, ItemStatus } from './domain/inventory';

/** 세션에 의존하지 않고 customerId 로 한 상품을 예약(재고 1개 배정). 웹훅/승인 공용. */
export async function reserveItemForCustomer(
  customerId: string,
  productId: string,
  checkout: string,
  ret: string,
  orderId?: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  try {
    validateRequest({ checkout, return: ret }, { minDays: 1, today: todayISO() });
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }

  const sb = supabaseAdmin();

  const { data: itemRows, error: e1 } = await sb
    .from('inventory_item')
    .select('id,product_id,status,condition,rental_count')
    .eq('product_id', productId);
  if (e1) return { ok: false, reason: '재고를 불러오지 못했습니다.' };

  const items: InventoryItem[] = (itemRows ?? []).map((r: {
    id: string; product_id: string; status: ItemStatus; condition: number; rental_count: number;
  }) => ({ id: r.id, productId: r.product_id, status: r.status, condition: r.condition, rentalCount: r.rental_count }));

  const itemIds = items.map((i) => i.id);
  const { data: resvRows, error: e2 } = await sb
    .from('reservation')
    .select('id,item_id,checkout,return_date,status')
    .in('item_id', itemIds)
    .eq('status', 'ACTIVE');
  if (e2) return { ok: false, reason: '예약 정보를 불러오지 못했습니다.' };

  const reservations: Reservation[] = (resvRows ?? []).map((r: {
    id: string; item_id: string; checkout: string; return_date: string; status: Reservation['status'];
  }) => ({ id: r.id, itemId: r.item_id, checkout: r.checkout, return: r.return_date, status: r.status }));

  const picked = findAvailableItem(items, { checkout, return: ret }, reservations);
  if (!picked) return { ok: false, reason: '해당 기간에 대여 가능한 재고가 없습니다.' };

  const { data: inserted, error: ie } = await sb
    .from('reservation')
    .insert({ item_id: picked.id, customer_id: customerId, checkout, return_date: ret, status: 'ACTIVE', payment_order_id: orderId ?? null })
    .select('id')
    .single();

  if (ie) {
    if (ie.code === '23P01') return { ok: false, reason: '해당 기간이 방금 예약되었습니다.' };
    return { ok: false, reason: '예약 처리 중 오류가 발생했습니다.' };
  }
  return { ok: true, id: inserted.id };
}
