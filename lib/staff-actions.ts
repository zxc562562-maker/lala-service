'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase/server';
import { getAccess } from './roles';
import { sendPushToCustomer } from './push';

export type Fulfillment =
  | 'ORDERED' | 'PRE_INSPECTING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'RETURN_INSPECTING' | 'REFUNDED'
  | 'PRE_INSPECT_ISSUE' | 'MISDELIVERED' | 'RETURN_ISSUE';

export interface AddressChangeRow {
  id: string;
  customerName: string;
  customerUsername: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

/** 회원의 배송지/회수지/근무지 정보 변경 이력 (직원 전용) */
export async function listAddressChanges(): Promise<AddressChangeRow[]> {
  const me = await getAccess();
  if (!me) return [];
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('address_change_log')
    .select('id,field_label,old_value,new_value,changed_at,customer:customer_id(name,username)')
    .order('changed_at', { ascending: false })
    .limit(100);
  return ((data ?? []) as unknown as {
    id: string; field_label: string; old_value: string | null; new_value: string | null; changed_at: string;
    customer: { name: string; username: string } | null;
  }[]).map((r) => ({
    id: r.id,
    customerName: r.customer?.name ?? '알 수 없음',
    customerUsername: r.customer?.username ?? '',
    fieldLabel: r.field_label,
    oldValue: r.old_value,
    newValue: r.new_value,
    changedAt: r.changed_at,
  }));
}

export interface OrderRow {
  id: string;
  customerName: string;
  checkout: string;
  return: string;
  amount: number;
  fulfillment: Fulfillment;
  assignedTo: string | null;
  disputed: boolean;
  disputeReason: string | null;
}

function map(r: {
  id: string; checkout: string; return_date: string; amount: number;
  fulfillment_status: Fulfillment; assigned_to: string | null;
  disputed: boolean; dispute_reason: string | null;
  customer: { name: string | null } | null;
}): OrderRow {
  return {
    id: r.id,
    customerName: r.customer?.name ?? '고객',
    checkout: r.checkout,
    return: r.return_date,
    amount: r.amount,
    fulfillment: r.fulfillment_status,
    assignedTo: r.assigned_to,
    disputed: r.disputed,
    disputeReason: r.dispute_reason,
  };
}

const SELECT = 'id,checkout,return_date,amount,fulfillment_status,assigned_to,disputed,dispute_reason,customer:customer_id(name)';

/** 결제완료(PAID) 주문 목록. 관리자=전체, 배송기사=본인 배정분. */
export async function listOrders(): Promise<OrderRow[]> {
  const me = await getAccess();
  if (!me || me.role === 'member') return [];

  const sb = supabaseAdmin();
  let q = sb.from('payment_order').select(SELECT).eq('status', 'PAID').order('created_at', { ascending: false });
  if (me.role === 'delivery') q = q.eq('assigned_to', me.userId);

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as unknown as Parameters<typeof map>[0][]).map(map);
}

/** 이행상태 변경 (관리자 전체 / 배송기사 본인 배정분) */
export async function updateFulfillment(orderId: string, status: Fulfillment): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || me.role === 'member') return { ok: false };

  const sb = supabaseAdmin();
  let q = sb.from('payment_order').update({ fulfillment_status: status }).eq('id', orderId);
  if (me.role === 'delivery') q = q.eq('assigned_to', me.userId);
  const { error } = await q;
  if (error) return { ok: false };

  const PUSH_MSG: Partial<Record<Fulfillment, string>> = {
    SHIPPED: '배송이 시작됐어요 :)',
    DELIVERED: '배송이 완료됐어요 :)',
    REFUNDED: '보증금 환불이 완료됐어요 :)',
    RETURN_INSPECTING: '반납하신 상품을 검수하고 있어요.',
    PRE_INSPECT_ISSUE: '주문하신 상품에서 확인할 사항이 있어 검수가 보류됐어요. 곧 연락드릴게요.',
    MISDELIVERED: '배송 중 문제가 확인됐어요. 빠르게 확인 후 안내드릴게요.',
    RETURN_ISSUE: '반납하신 상품에서 확인할 사항이 있어요. 확인 후 안내드릴게요.',
  };
  const msg = PUSH_MSG[status];
  if (msg) {
    const { data: order } = await sb.from('payment_order').select('customer_id').eq('id', orderId).maybeSingle();
    if (order) await sendPushToCustomer(order.customer_id, 'Lala', msg);
  }

  revalidatePath('/admin');
  revalidatePath('/delivery');
  return { ok: true };
}

/** 배송기사 배정/해제 (관리자만). 빈 문자열이면 배정 해제. */
export async function assignOrder(orderId: string, staffUserId: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('payment_order').update({ assigned_to: staffUserId || null }).eq('id', orderId);
  if (error) return { ok: false };
  revalidatePath('/admin');
  revalidatePath('/delivery');
  return { ok: true };
}

/** 분쟁 지정/해제 (디렉터·슈퍼바이저만) */
export async function openDispute(orderId: string, reason: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('payment_order')
    .update({ disputed: true, dispute_reason: reason, dispute_opened_at: new Date().toISOString(), dispute_resolved_at: null })
    .eq('id', orderId);
  if (error) return { ok: false };
  revalidatePath('/admin');
  return { ok: true };
}

export async function resolveDispute(orderId: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('payment_order')
    .update({ disputed: false, dispute_resolved_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) return { ok: false };
  revalidatePath('/admin');
  return { ok: true };
}

/** 배송기사 목록 (관리자 배정용) */
export async function listDeliveryStaff(): Promise<{ id: string; name: string }[]> {
  const me = await getAccess();
  if (!me || !me.isApprover) return [];
  const sb = supabaseAdmin();
  const { data } = await sb.from('staff').select('auth_user_id,name').eq('role', 'delivery');
  return (data ?? []).map((s: { auth_user_id: string; name: string | null }) => ({ id: s.auth_user_id, name: s.name ?? '기사' }));
}
