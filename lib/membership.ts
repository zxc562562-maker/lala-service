import 'server-only';
import { supabaseAdmin } from './supabase/server';
import { tossConfirm, tossGetPayment } from './payments';
import { sendPushToCustomer } from './push';

export { tossConfirm, tossGetPayment };

/**
 * 멤버십 가입비 결제를 확정한다. 세션에 의존하지 않으며(주문의 customer_id 사용),
 * 결제 성공 리다이렉트와 웹훅 양쪽에서 호출될 수 있어 원자적으로 1회만 처리한다.
 * customer.status 는 unpaid 였을 때만 pending(승인 대기)으로 전환한다.
 */
export async function finalizeMembershipById(
  orderId: string,
  paymentKey?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabaseAdmin();

  const { data: order } = await sb.from('membership_payment').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.status === 'PAID') return { ok: true };

  // PENDING -> PAID 를 원자적으로 선점 (동시 호출 시 하나만 진행)
  const { data: claimed } = await sb
    .from('membership_payment')
    .update({ status: 'PAID', payment_key: paymentKey ?? order.payment_key })
    .eq('id', orderId)
    .eq('status', 'PENDING')
    .select('id');
  if (!claimed || claimed.length === 0) return { ok: true }; // 이미 다른 경로에서 처리됨

  // unpaid -> pending (승인 대기). 이미 다른 상태로 진행됐다면 건드리지 않는다.
  await sb.from('customer').update({ status: 'pending' }).eq('id', order.customer_id).eq('status', 'unpaid');

  const { data: cust } = await sb.from('customer').select('name').eq('id', order.customer_id).maybeSingle();
  if (cust) await sendPushToCustomer(order.customer_id, 'Lala', `${cust.name}님 멤버십 결제가 완료됐어요 :)`);

  return { ok: true };
}
