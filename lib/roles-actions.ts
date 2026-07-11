'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer, supabaseAdmin } from './supabase/server';
import { getAccess, type Access } from './roles';
import { sendPushToCustomer } from './push';

/** 클라이언트 컴포넌트에서 로그인 직후 상태를 확인하기 위한 래퍼 */
export async function getMyAccess(): Promise<Access | null> {
  return getAccess();
}

/** 가입 폼에서 ID 입력 중 실시간 중복 확인용 (RLS 우회, 존재 여부만 반환) */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!username) return false;
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer').select('id').ilike('username', username).maybeSingle();
  return !data;
}

export interface FittingInfo {
  heightCm?: number;
  topSize?: string;
  waistCm?: number;
  shoeSize?: string;
}

export interface DeliveryInfo {
  deliveryAddress?: string;
  deliveryJibunAddress?: string;
  deliveryDetailAddress?: string;
  workplace?: string;
  deliveryPhone?: string;
  returnAddress?: string;
  returnJibunAddress?: string;
  returnDetailAddress?: string;
  entrancePassword?: string;
  returnEntrancePassword?: string;
}

export interface RegisterMembershipInput {
  username: string;
  marketingConsent: boolean;
  fitting?: FittingInfo;
  delivery?: DeliveryInfo;
}

/** 가입 직후 호출: 승인대기(customer pending) 멤버십 생성 */
export async function registerMembership(input: RegisterMembershipInput): Promise<{ ok: boolean; reason?: string }> {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' };
  const sb = supabaseAdmin();
  const { data: existing } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (existing) return { ok: true };
  const name = (user.user_metadata?.name as string) || '고객';
  const phone = (user.user_metadata?.phone as string) || null;
  const f = input.fitting ?? {};
  const d = input.delivery ?? {};
  const { error } = await sb.from('customer').insert({
    auth_user_id: user.id,
    username: input.username,
    name,
    phone,
    status: 'unpaid',
    marketing_consent: input.marketingConsent, // 레거시 컬럼(더 이상 소스로 사용 안 함, 하위호환 보존)
    marketing_consent_at: input.marketingConsent ? new Date().toISOString() : null,
    marketing_lookbook_consent: input.marketingConsent,
    marketing_lookbook_consent_at: input.marketingConsent ? new Date().toISOString() : null,
    marketing_promotion_consent: input.marketingConsent,
    marketing_promotion_consent_at: input.marketingConsent ? new Date().toISOString() : null,
    marketing_daily_consent: input.marketingConsent,
    marketing_daily_consent_at: input.marketingConsent ? new Date().toISOString() : null,
    terms_agreed_at: new Date().toISOString(), // 가입 버튼을 눌렀다는 것 자체가 필수 약관 동의를 의미
    height_cm: f.heightCm ?? null,
    top_size: f.topSize || null,
    waist_cm: f.waistCm ?? null,
    shoe_size: f.shoeSize || null,
    delivery_address: d.deliveryAddress || null,
    delivery_jibun_address: d.deliveryJibunAddress || null,
    delivery_detail_address: d.deliveryDetailAddress || null,
    workplace: d.workplace || null,
    delivery_phone: d.deliveryPhone || null,
    return_address: d.returnAddress || null,
    return_jibun_address: d.returnJibunAddress || null,
    return_detail_address: d.returnDetailAddress || null,
    entrance_password: d.entrancePassword || null,
    return_entrance_password: d.returnEntrancePassword || null,
  });
  if (error) {
    if (/unique|duplicate/i.test(error.message)) return { ok: false, reason: '이미 사용 중인 ID입니다.' };
    return { ok: false, reason: '가입 처리 중 오류가 발생했습니다.' };
  }
  return { ok: true };
}

export interface PendingMember { id: string; username: string | null; name: string; phone: string | null; createdAt: string }

/** 승인 대기 멤버 목록 (디렉터/슈퍼바이저) */
export async function listPendingMembers(): Promise<PendingMember[]> {
  const me = await getAccess();
  if (!me?.isApprover) return [];
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer')
    .select('id,username,name,phone,created_at').eq('status', 'pending').order('created_at', { ascending: true });
  return (data ?? []).map((r: { id: string; username: string | null; name: string; phone: string | null; created_at: string }) =>
    ({ id: r.id, username: r.username, name: r.name, phone: r.phone, createdAt: r.created_at }));
}

export async function approveMember(customerId: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me?.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { data: cust } = await sb.from('customer').select('name').eq('id', customerId).maybeSingle();
  const { error } = await sb.from('customer').update({ status: 'approved' }).eq('id', customerId);
  revalidatePath('/admin/approvals');
  if (!error && cust) {
    await sendPushToCustomer(customerId, 'Lala', `${cust.name}님 가입이 승인됐어요. 멤버십 회원이 되신 걸 환영해요 :)`);
  }
  return { ok: !error };
}

export async function rejectMember(customerId: string): Promise<{ ok: boolean }> {
  const me = await getAccess();
  if (!me?.isApprover) return { ok: false };
  const sb = supabaseAdmin();
  const { error } = await sb.from('customer').delete().eq('id', customerId).eq('status', 'pending');
  revalidatePath('/admin/approvals');
  return { ok: !error }; // 거절 시 알림 없음(정책)
}
