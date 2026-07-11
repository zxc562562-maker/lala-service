import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { reserveItemForCustomer } from './reservations';
import { sendPushToCustomer } from './push';

const TOSS_API = 'https://api.tosspayments.com/v1/payments';

function authHeader(): string {
  const secret = process.env.TOSS_SECRET_KEY || '';
  return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
}

export async function tossConfirm(paymentKey: string, orderId: string, amount: number) {
  const res = await fetch(`${TOSS_API}/confirm`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  return { ok: res.ok, data: await res.json() };
}

export async function tossGetPayment(paymentKey: string) {
  const res = await fetch(`${TOSS_API}/${paymentKey}`, { headers: { Authorization: authHeader() } });
  return { ok: res.ok, data: await res.json() };
}

/**
 * 결제 완료된 주문을 예약으로 확정한다. 세션에 의존하지 않으며(주문의 customer_id 사용),
 * 결제 성공 리다이렉트 처리와 웹훅 양쪽에서 호출될 수 있어 원자적으로 1회만 처리한다.
 */
export async function finalizeOrderById(
  orderId: string,
  paymentKey?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabaseAdmin();

  const { data: order } = await sb.from('payment_order').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.status === 'PAID') return { ok: true };

  // PENDING -> PAID 를 원자적으로 선점 (동시 호출 시 하나만 진행)
  const { data: claimed } = await sb
    .from('payment_order')
    .update({ status: 'PAID', payment_key: paymentKey ?? order.payment_key })
    .eq('id', orderId)
    .eq('status', 'PENDING')
    .select('id');
  if (!claimed || claimed.length === 0) return { ok: true }; // 이미 다른 경로에서 처리됨

  // 이 주문 고객의 카트 상품들을 주문 기간으로 예약
  const { data: cartRows } = await sb.from('cart_item').select('product_id').eq('customer_id', order.customer_id);
  const productIds = (cartRows ?? []).map((r: { product_id: string }) => r.product_id);

  for (const pid of productIds) {
    const r = await reserveItemForCustomer(order.customer_id, pid, order.checkout, order.return_date, orderId);
    if (!r.ok) return { ok: false, reason: r.reason };
  }

  await sb.from('cart_item').delete().eq('customer_id', order.customer_id);
  await sendPushToCustomer(order.customer_id, 'Lala', '예약 확정 및 렌탈 결제가 완료됐어요 :)');
  return { ok: true };
}
