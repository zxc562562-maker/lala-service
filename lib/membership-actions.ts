'use server';

import { supabaseAdmin, supabaseServer } from './supabase/server';
import { tossConfirm, finalizeMembershipById } from './membership';
import { sendPushToCustomer } from './push';
import { MEMBERSHIP_FEE } from './pricing';

/** 현재 로그인 사용자의 customer 행을 찾는다(역할 무관, 상태 무관). */
async function resolveCustomer(): Promise<{ id: string; status: string } | null> {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer').select('id,status').eq('auth_user_id', user.id).maybeSingle();
  return data ?? null;
}

/** 가입비 결제 주문(PENDING) 생성 → 토스 결제창에 넘길 정보 반환 */
export async function createMembershipOrder(): Promise<
  | { ok: true; orderId: string; amount: number; orderName: string }
  | { ok: false; reason: string }
> {
  const customer = await resolveCustomer();
  if (!customer) return { ok: false, reason: '로그인이 필요합니다.' };
  if (customer.status !== 'unpaid') return { ok: false, reason: '이미 결제되었거나 처리된 계정입니다.' };

  const orderId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sb = supabaseAdmin();
  const { error } = await sb.from('membership_payment').insert({
    id: orderId, customer_id: customer.id, amount: MEMBERSHIP_FEE, status: 'PENDING',
  });
  if (error) return { ok: false, reason: '주문 생성에 실패했습니다.' };

  return { ok: true, orderId, amount: MEMBERSHIP_FEE, orderName: 'Lala 멤버십 가입비' };
}

/** 토스 결제 승인 → 승인 대기(pending) 전환. 결제창 성공 리다이렉트 후 호출 */
export async function confirmMembershipPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabaseAdmin();
  const { data: order } = await sb.from('membership_payment').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.status === 'PAID') return { ok: true };
  if (order.amount !== amount) return { ok: false, reason: '결제 금액이 일치하지 않습니다.' };
  if (!process.env.TOSS_SECRET_KEY) return { ok: false, reason: '결제 설정(TOSS_SECRET_KEY)이 없습니다.' };

  const conf = await tossConfirm(paymentKey, orderId, amount);
  if (!conf.ok) {
    await sb.from('membership_payment').update({ status: 'FAILED' }).eq('id', orderId);
    const { data: cust } = await sb.from('customer').select('name').eq('id', order.customer_id).maybeSingle();
    if (cust) await sendPushToCustomer(order.customer_id, 'Lala', `${cust.name}님 멤버십 결제가 이뤄지지 않았어요.`);
    return { ok: false, reason: conf.data?.message || '결제 승인에 실패했습니다.' };
  }

  return finalizeMembershipById(orderId, paymentKey);
}
