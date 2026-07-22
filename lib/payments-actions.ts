'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin, supabaseServer } from '@lala/shared/lib/supabase/server';
import { getCartItems } from './cart-actions';
import { tossConfirm, tossCancel, finalizeOrderById } from '@lala/shared/lib/payments';
import { FLAT_DEPOSIT, PARCEL_ROUNDTRIP_FEE, QUICK_DELIVERY_FEE } from './pricing';
import { isValidDeliverySlot, isValidDeliveryMethod } from '@lala/shared/lib/delivery';
import { getClosedDates } from '@lala/shared/lib/closure-actions';
import { billableDays } from '@lala/shared/lib/domain/reservation';
import { sendPushToCustomer } from '@lala/shared/lib/push';

// 배송(SHIPPED) 시작 전까지만 고객이 직접 취소·전액 환불할 수 있다.
const CANCELLABLE_FULFILLMENT_STATUSES = ['ORDERED', 'PRE_INSPECTING', 'READY'];

async function resolveCustomerId(): Promise<string | null> {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  return data?.id ?? null;
}

/** 카트 + 선택한 기간으로 결제 주문(PENDING) 생성 → 토스 결제창에 넘길 정보 반환 */
export async function createOrder(
  checkout: string,
  ret: string,
  deliverySlot: string | null,
  deliveryMethod: string,
): Promise<
  | { ok: true; orderId: string; amount: number; orderName: string }
  | { ok: false; reason: string }
> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };

  if (!isValidDeliveryMethod(deliveryMethod)) return { ok: false, reason: '배송 방법을 선택해주세요.' };
  // 직배송만 배송 시간을 맞출 수 있어 시간 선택이 필요하고, 퀵배송·택배는 시간 지정 없이 진행한다.
  const needsSlot = deliveryMethod === 'DIRECT';
  if (needsSlot && !isValidDeliverySlot(deliverySlot ?? '')) return { ok: false, reason: '배송 시간을 선택해주세요.' };
  const finalSlot = needsSlot ? deliverySlot : null;

  const items = await getCartItems();
  if (items.length === 0) return { ok: false, reason: '장바구니가 비어 있습니다.' };

  const closedDates = new Set(await getClosedDates());
  if (closedDates.has(checkout) || closedDates.has(ret)) {
    return { ok: false, reason: '선택하신 날짜는 휴무일이라 배송/반납이 불가능합니다. 카트에서 다시 선택해주세요.' };
  }

  const days = billableDays(checkout, ret, closedDates);
  if (days < 1) return { ok: false, reason: '반납일은 예약일 이후여야 합니다.' };

  const rental = items.reduce((a, i) => a + i.dailyPrice * days, 0);
  const deposit = items.length ? FLAT_DEPOSIT : 0;
  // 택배는 왕복 배송비 정액 부과, 퀵배송은 거리별로 달라 우선 0원.
  const deliveryFee = deliveryMethod === 'PARCEL' ? PARCEL_ROUNDTRIP_FEE : deliveryMethod === 'QUICK' ? QUICK_DELIVERY_FEE : 0;
  const amount = rental + deposit + deliveryFee;

  const orderId = `lala_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const orderName = items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`;

  const sb = supabaseAdmin();
  // 재주문 시 같은 배송 방법을 다시 고를 확률이 높아, 이번 선택을 다음 주문의 기본값으로 기억해둔다.
  await sb.from('customer').update({ preferred_delivery_method: deliveryMethod }).eq('id', customerId);

  const { error } = await sb.from('payment_order').insert({
    id: orderId, customer_id: customerId, checkout, return_date: ret, days, amount, status: 'PENDING',
    delivery_slot: finalSlot, delivery_method: deliveryMethod,
  });
  if (error) {
    // 같은 고객이 같은 기간으로 미결제(PENDING) 주문을 이미 만들어둔 경우(예: 화면이 같은 요청을
    // 중복으로 보냈거나, 결제를 완료하지 않고 같은 날짜로 다시 시도한 경우) — 새로 만들지 못하게
    // DB가 막는데, 실패로 끝내지 않고 기존 PENDING 주문을 그대로 재사용한다.
    if (error.code === '23505') {
      const { data: existing } = await sb
        .from('payment_order')
        .select('id,amount')
        .eq('customer_id', customerId).eq('checkout', checkout).eq('return_date', ret)
        .eq('status', 'PENDING').maybeSingle();
      if (existing) {
        // 카트로 돌아가 배송 시간/방법을 다시 골랐을 수 있으니 최신 선택으로 갱신
        await sb.from('payment_order').update({ delivery_slot: finalSlot, delivery_method: deliveryMethod }).eq('id', existing.id);
        return { ok: true, orderId: existing.id, amount: existing.amount, orderName };
      }
    }
    return { ok: false, reason: '주문 생성에 실패했습니다.' };
  }

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

/** 배송 시작 전까지 고객이 직접 주문을 취소하고 전액 환불받는다. */
export async function cancelOrder(orderId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };

  const sb = supabaseAdmin();
  const { data: order } = await sb.from('payment_order').select('*').eq('id', orderId).eq('customer_id', customerId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.status !== 'PAID') return { ok: false, reason: '취소할 수 없는 주문이에요.' };
  if (order.disputed) return { ok: false, reason: '분쟁 처리 중인 주문은 취소할 수 없어요.' };
  if (!CANCELLABLE_FULFILLMENT_STATUSES.includes(order.fulfillment_status)) {
    return { ok: false, reason: '배송이 시작되어 더 이상 취소할 수 없어요.' };
  }
  if (!order.payment_key) return { ok: false, reason: '결제 정보를 확인할 수 없어요.' };

  const cancel = await tossCancel(order.payment_key, '고객 요청에 의한 주문 취소(배송 전 전액 환불)');
  if (!cancel.ok) return { ok: false, reason: cancel.data?.message || '환불 처리에 실패했어요. 잠시 후 다시 시도해주세요.' };

  await sb.from('payment_order').update({ status: 'CANCELLED', fulfillment_status: 'CANCELLED' }).eq('id', orderId);
  await sb.from('reservation').update({ status: 'CANCELLED' }).eq('payment_order_id', orderId);
  await sendPushToCustomer(customerId, 'Lala', '주문이 취소되고 전액 환불 처리됐어요.');

  revalidatePath(`/account/${orderId}`);
  revalidatePath('/account');
  return { ok: true };
}

/** 택배 배송 건에 한해, 배송완료 후 고객이 직접 "반납 발송했어요"를 알리는 반납접수요청. */
export async function requestReturn(orderId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };

  const sb = supabaseAdmin();
  const { data: order } = await sb.from('payment_order').select('*').eq('id', orderId).eq('customer_id', customerId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.delivery_method !== 'PARCEL') return { ok: false, reason: '택배 배송 주문만 반납접수요청을 할 수 있어요.' };
  if (order.status !== 'PAID') return { ok: false, reason: '반납접수요청을 할 수 없는 주문이에요.' };
  if (order.disputed) return { ok: false, reason: '분쟁 처리 중인 주문은 반납접수요청을 할 수 없어요.' };
  if (order.fulfillment_status !== 'DELIVERED') {
    return { ok: false, reason: '배송완료 상태에서만 반납접수요청을 할 수 있어요.' };
  }

  await sb.from('payment_order').update({ fulfillment_status: 'RETURN_REQUESTED', return_requested_at: new Date().toISOString() }).eq('id', orderId);

  // 여기서는 일부러 revalidatePath를 호출하지 않는다 — 호출하면 이 서버 액션이 끝나는 즉시
  // Next.js가 자동으로 페이지를 새로고침해, "반납접수 완료" 안내를 보여주기도 전에 버튼이
  // 사라져버린다. 새로고침은 안내 모달을 닫을 때 클라이언트에서 router.refresh()로 직접 트리거한다.
  return { ok: true };
}
