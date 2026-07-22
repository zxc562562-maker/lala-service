'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase/server';
import { getAccess } from './roles';
import { sendPushToCustomer } from './push';
import { PACKAGING_PHOTO_BUCKET, getPackagingPhotoUrls } from './storage';

export type Fulfillment =
  | 'ORDERED' | 'PRE_INSPECTING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'RETURN_REQUESTED' | 'RETURN_INSPECTING' | 'REFUNDED'
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
  if (!me || me.role === 'member') return [];
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

export interface OrderItemRow {
  id: string; // reservation id
  productName: string;
  hasIssue: boolean;
}

export interface OrderRow {
  id: string;
  customerName: string;
  checkout: string;
  return: string;
  deliverySlot: string | null;
  deliveryMethod: string | null;
  amount: number;
  fulfillment: Fulfillment;
  assignedTo: string | null;
  disputed: boolean;
  disputeReason: string | null;
  returnCourier: string | null;
  returnTrackingNumber: string | null;
  packagingPhotoPath: string | null;
  packagingPhotoUrl: string | null;
  items: OrderItemRow[];
}

function map(r: {
  id: string; checkout: string; return_date: string; delivery_slot: string | null; delivery_method: string | null; amount: number;
  fulfillment_status: Fulfillment; assigned_to: string | null;
  disputed: boolean; dispute_reason: string | null;
  return_courier: string | null; return_tracking_number: string | null;
  packaging_photo_path: string | null;
  customer: { name: string | null } | null;
  reservation: { id: string; has_issue: boolean; inventory_item: { product: { name: string | null } | null } | null }[] | null;
}): OrderRow {
  return {
    id: r.id,
    customerName: r.customer?.name ?? '고객',
    checkout: r.checkout,
    return: r.return_date,
    deliverySlot: r.delivery_slot,
    deliveryMethod: r.delivery_method,
    amount: r.amount,
    fulfillment: r.fulfillment_status,
    assignedTo: r.assigned_to,
    disputed: r.disputed,
    disputeReason: r.dispute_reason,
    returnCourier: r.return_courier,
    returnTrackingNumber: r.return_tracking_number,
    packagingPhotoPath: r.packaging_photo_path,
    packagingPhotoUrl: null,
    items: (r.reservation ?? []).map((res) => ({
      id: res.id,
      productName: res.inventory_item?.product?.name ?? '상품',
      hasIssue: res.has_issue,
    })),
  };
}

const SELECT = 'id,checkout,return_date,delivery_slot,delivery_method,amount,fulfillment_status,assigned_to,disputed,dispute_reason,return_courier,return_tracking_number,packaging_photo_path,customer:customer_id(name),reservation!payment_order_id(id,has_issue,inventory_item(product(name)))';

/** 결제완료(PAID) 주문 목록. 관리자=전체, 배송기사=본인 배정분. */
export async function listOrders(): Promise<OrderRow[]> {
  const me = await getAccess();
  if (!me || me.role === 'member') return [];

  const sb = supabaseAdmin();
  let q = sb.from('payment_order').select(SELECT).eq('status', 'PAID').order('created_at', { ascending: false });
  if (me.role === 'delivery') q = q.eq('assigned_to', me.userId);

  const { data, error } = await q;
  if (error || !data) return [];
  const orders = (data as unknown as Parameters<typeof map>[0][]).map(map);

  const photoPaths = orders.map((o) => o.packagingPhotoPath).filter((p): p is string => !!p);
  const urlByPath = await getPackagingPhotoUrls(photoPaths);
  for (const o of orders) {
    if (o.packagingPhotoPath) o.packagingPhotoUrl = urlByPath.get(o.packagingPhotoPath) ?? null;
  }
  return orders;
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

/**
 * 반납접수요청 건에 대해 직원이 반납 픽업을 잡은 뒤(현재는 CJ대한통운 등과 전화·웹사이트로 직접 예약),
 * 그 택배사·송장번호를 입력해 회원에게 안내. 현재는 수동 입력이며, 향후 CJ대한통운(또는 대행 API사)과
 * 계약·API 키가 확보되면 이 자리를 자동 픽업예약·송장발급 API 호출로 교체할 예정 — 그 전까지는 이 수동
 * 입력 흐름을 유지할 것 (HANDOFF.md "[설계 방침 기록] 반납 택배 자동화" 참고).
 */
export async function saveReturnTracking(
  orderId: string,
  courier: string,
  trackingNumber: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const me = await getAccess();
  if (!me || me.role === 'member') return { ok: false, reason: '권한이 없습니다.' };
  if (!courier.trim() || !trackingNumber.trim()) return { ok: false, reason: '택배사와 송장번호를 모두 입력해주세요.' };

  const sb = supabaseAdmin();
  const { data: order } = await sb.from('payment_order').select('delivery_method,fulfillment_status').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };
  if (order.delivery_method !== 'PARCEL') return { ok: false, reason: '택배 배송 주문만 반납정보를 입력할 수 있어요.' };
  if (order.fulfillment_status !== 'RETURN_REQUESTED') {
    return { ok: false, reason: '반납접수요청 상태에서만 반납정보를 입력할 수 있어요.' };
  }

  const { error } = await sb.from('payment_order').update({
    return_courier: courier.trim(),
    return_tracking_number: trackingNumber.trim(),
  }).eq('id', orderId);
  if (error) return { ok: false, reason: '반납정보 저장에 실패했어요.' };

  revalidatePath('/admin');
  revalidatePath('/account');
  return { ok: true };
}

const MAX_PACKAGING_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

// 저장 경로의 확장자는 클라이언트가 보낸 파일명을 그대로 쓰지 않고(경로 조작 방지),
// 이미 검증된 MIME 타입에서만 도출한다.
const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

/**
 * 주문 검수 후 패키징을 마치면, 담긴 상품을 모아 찍은 사진 한 장을 업로드.
 * "누락없이 보냈다"는 증빙이자, 회수 후 분실 분쟁이 생겼을 때 대응 근거로 쓰임.
 * 회원 쪽엔 주문 상세 페이지의 주문 상품 목록 맨 끝에 읽기전용으로 노출됨.
 */
export async function savePackagingPhoto(orderId: string, formData: FormData): Promise<{ ok: true } | { ok: false; reason: string }> {
  const me = await getAccess();
  if (!me || me.role === 'member') return { ok: false, reason: '권한이 없습니다.' };

  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { ok: false, reason: '사진을 선택해주세요.' };
  if (!file.type.startsWith('image/')) return { ok: false, reason: '이미지 파일만 업로드할 수 있어요.' };
  if (file.size > MAX_PACKAGING_PHOTO_BYTES) return { ok: false, reason: '파일 크기는 8MB 이하로 올려주세요.' };

  const sb = supabaseAdmin();
  const { data: order } = await sb.from('payment_order').select('packaging_photo_path').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, reason: '주문을 찾을 수 없습니다.' };

  const ext = IMAGE_MIME_EXT[file.type] ?? '';
  const path = `${orderId}/${Date.now()}${ext}`;
  const { error: uploadErr } = await sb.storage.from(PACKAGING_PHOTO_BUCKET).upload(path, file, { contentType: file.type });
  if (uploadErr) return { ok: false, reason: '사진 업로드에 실패했어요.' };

  const { error } = await sb.from('payment_order').update({ packaging_photo_path: path }).eq('id', orderId);
  if (error) return { ok: false, reason: '저장에 실패했어요.' };

  if (order.packaging_photo_path && order.packaging_photo_path !== path) {
    await sb.storage.from(PACKAGING_PHOTO_BUCKET).remove([order.packaging_photo_path]);
  }

  revalidatePath('/admin');
  revalidatePath('/delivery');
  revalidatePath(`/account/${orderId}`);
  return { ok: true };
}

/** 주문검수/수거검수 오염·손상 상품 지정(디렉터·슈퍼바이저만) — 여러 상품이 담긴 주문에서 어느 상품이 문제인지 특정 */
export async function setItemIssue(reservationId: string, hasIssue: boolean): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me || !me.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('reservation').update({ has_issue: hasIssue }).eq('id', reservationId);
  if (error) return { ok: false };
  revalidatePath('/admin');
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
