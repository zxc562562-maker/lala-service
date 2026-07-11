'use server';

import { supabaseAdmin, supabaseServer } from './supabase/server';
import { getCartItems } from './cart-actions';
import { tossConfirm, finalizeOrderById } from './payments';
import { FLAT_DEPOSIT } from './pricing';

async function resolveCustomerId(): Promise<string | null> {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  return data?.id ?? null;
}

const dayMs = 86_400_000;

/** 카트 + 선택한 기간으로 결제 주문(PENDING) 생성 → 토스 결제창에 넘길 정보 반환 */
export async function createOrder(
  checkout: string,
  ret: string,
): Promise<
  | { ok: true; orderId: string; amount: number; orderName: string }
  | { ok: false; reason: string }
> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };

  const items = await getCartItems();
  if (items.length === 0) return { ok: false, reason: '장바구니가 비어 있습니다.' };

  const days = Math.round((Date.parse(`${ret}T00:00:00Z`) - Date.parse(`${checkout}T00:00:00Z`)) / dayMs);
  if (days < 1) return { ok: false, reason: '반납일은 예약일 이후여야 합니다.' };

  const rental = items.reduce((a, i) => a + i.dailyPrice * days, 0);
  const deposit = items.length ? FLAT_DEPOSIT : 0;
  const amount = rental + deposit;

  const orderId = `lala_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const orderName = items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`;

  const sb = supabaseAdmin();
  const { error } = await sb.from('payment_order').insert({
    id: orderId, customer_id: customerId, checkout, return_date: ret, days, amount, status: 'PENDING',
  });
  if (error) return { ok: false, reason: '주문 생성에 실패했습니다.' };

  return { ok: true, orderId, amount, orderName };
}

/** 토스 결제 승인 → 예약 확정. 결제창 성공 리다이렉트 후 호출 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabaseAdmin();
  const { data: order } = await sb.from('payment_order').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.status === 'PAID') return { ok: true }; // 멱등 처리
  if (order.amount !== amount) return { ok: false, reason: '결제 금액이 일치하지 않습니다.' };

  if (!process.env.TOSS_SECRET_KEY) return { ok: false, reason: '결제 설정(TOSS_SECRET_KEY)이 없습니다.' };

  // 1) 토스 결제 승인
  const conf = await tossConfirm(paymentKey, orderId, amount);
  if (!conf.ok) {
    await sb.from('payment_order').update({ status: 'FAILED' }).eq('id', orderId);
    return { ok: false, reason: conf.data?.message || '결제 승인에 실패했습니다.' };
  }

  // 2) 예약 확정(세션 비의존, 웹훅과 공용) + 카트 비우기
  return finalizeOrderById(orderId, paymentKey);
}
