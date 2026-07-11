'use server';

import { supabaseServer, supabaseAdmin } from './supabase/server';
import { sendPushToCustomer } from './push';

export interface Profile {
  username: string;
  name: string;
  phone: string | null;
  marketingLookbook: boolean;
  marketingPromotion: boolean;
  marketingDaily: boolean;
  // 피팅 정보
  heightCm: number | null;
  topSize: string | null;
  waistCm: number | null;
  shoeSize: string | null;
  // 배송 정보
  deliveryAddress: string | null;
  deliveryJibun: string | null;
  deliveryDetailAddress: string | null;
  entrancePassword: string | null;
  returnAddress: string | null;
  returnJibun: string | null;
  returnDetailAddress: string | null;
  returnEntrancePassword: string | null;
  deliveryPhone: string | null;
  workplace: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const userClient = supabaseServer();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;
  const { data } = await userClient
    .from('customer')
    .select(`
      username,name,phone,
      marketing_lookbook_consent,marketing_promotion_consent,marketing_daily_consent,
      height_cm,top_size,waist_cm,shoe_size,
      delivery_address,delivery_jibun_address,delivery_detail_address,entrance_password,
      return_address,return_jibun_address,return_detail_address,return_entrance_password,
      delivery_phone,workplace
    `)
    .eq('auth_user_id', user.id).maybeSingle();
  return {
    username: data?.username ?? '',
    name: data?.name ?? '',
    phone: data?.phone ?? null,
    marketingLookbook: data?.marketing_lookbook_consent ?? false,
    marketingPromotion: data?.marketing_promotion_consent ?? false,
    marketingDaily: data?.marketing_daily_consent ?? false,
    heightCm: data?.height_cm ?? null,
    topSize: data?.top_size ?? null,
    waistCm: data?.waist_cm ?? null,
    shoeSize: data?.shoe_size ?? null,
    deliveryAddress: data?.delivery_address ?? null,
    deliveryJibun: data?.delivery_jibun_address ?? null,
    deliveryDetailAddress: data?.delivery_detail_address ?? null,
    entrancePassword: data?.entrance_password ?? null,
    returnAddress: data?.return_address ?? null,
    returnJibun: data?.return_jibun_address ?? null,
    returnDetailAddress: data?.return_detail_address ?? null,
    returnEntrancePassword: data?.return_entrance_password ?? null,
    deliveryPhone: data?.delivery_phone ?? null,
    workplace: data?.workplace ?? null,
  };
}

export interface UpdateProfileInput {
  name: string;
  phone: string;
  marketingLookbook: boolean;
  marketingPromotion: boolean;
  marketingDaily: boolean;
  newPassword?: string; // 입력했을 때만 변경
  // 피팅 정보 (전부 선택)
  heightCm?: string;
  topSize?: string;
  waistCm?: string;
  shoeSize?: string;
  // 배송 정보 (전부 선택)
  deliveryAddress?: string;
  deliveryJibun?: string;
  deliveryDetailAddress?: string;
  entrancePassword?: string;
  returnAddress?: string;
  returnJibun?: string;
  returnDetailAddress?: string;
  returnEntrancePassword?: string;
  deliveryPhone?: string;
  workplace?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ ok: boolean; reason?: string }> {
  const userClient = supabaseServer();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, reason: '로그인이 필요합니다.' };
  if (!input.name.trim()) return { ok: false, reason: '이름을 입력해주세요.' };
  if (input.newPassword && input.newPassword.length < 4) {
    return { ok: false, reason: '비밀번호는 4자 이상이어야 해요.' };
  }

  // 각 카테고리 동의가 새로 켜진 경우에만 그 카테고리의 동의 시각을 갱신(철회 시엔 과거 동의 시점 기록을 보존)
  // + 배송지/회수지/근무지 관련 필드는 수시로 바뀔 수 있어 변경 이력을 남기므로, 이전 값도 함께 조회한다.
  const { data: before } = await userClient
    .from('customer')
    .select(`
      id, marketing_lookbook_consent,marketing_promotion_consent,marketing_daily_consent,
      delivery_address,delivery_jibun_address,delivery_detail_address,entrance_password,
      return_address,return_jibun_address,return_detail_address,return_entrance_password,
      delivery_phone,workplace
    `)
    .eq('auth_user_id', user.id).maybeSingle();
  const now = new Date().toISOString();
  const justLookbook = input.marketingLookbook && !before?.marketing_lookbook_consent;
  const justPromotion = input.marketingPromotion && !before?.marketing_promotion_consent;
  const justDaily = input.marketingDaily && !before?.marketing_daily_consent;

  const heightCm = input.heightCm?.trim() ? Number(input.heightCm) : null;
  const waistCm = input.waistCm?.trim() ? Number(input.waistCm) : null;

  // 이름/연락처/주소/마케팅 동의/피팅/배송 정보는 본인 세션(RLS "own customer update")으로 수정
  const { error: custError } = await userClient
    .from('customer')
    .update({
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      marketing_lookbook_consent: input.marketingLookbook,
      marketing_promotion_consent: input.marketingPromotion,
      marketing_daily_consent: input.marketingDaily,
      ...(justLookbook ? { marketing_lookbook_consent_at: now } : {}),
      ...(justPromotion ? { marketing_promotion_consent_at: now } : {}),
      ...(justDaily ? { marketing_daily_consent_at: now } : {}),
      height_cm: heightCm,
      top_size: input.topSize?.trim() || null,
      waist_cm: waistCm,
      shoe_size: input.shoeSize?.trim() || null,
      delivery_address: input.deliveryAddress?.trim() || null,
      delivery_jibun_address: input.deliveryJibun?.trim() || null,
      delivery_detail_address: input.deliveryDetailAddress?.trim() || null,
      entrance_password: input.entrancePassword?.trim() || null,
      return_address: input.returnAddress?.trim() || null,
      return_jibun_address: input.returnJibun?.trim() || null,
      return_detail_address: input.returnDetailAddress?.trim() || null,
      return_entrance_password: input.returnEntrancePassword?.trim() || null,
      delivery_phone: input.deliveryPhone?.trim() || null,
      workplace: input.workplace?.trim() || null,
    })
    .eq('auth_user_id', user.id);
  if (custError) return { ok: false, reason: '정보 저장에 실패했습니다.' };

  // 배송지/회수지/근무지 관련 필드가 바뀌었으면 변경 이력을 남긴다(관리자 앱에서 실시간 조회용)
  if (before?.id) {
    const trackedFields: { key: string; label: string; oldVal: string | null; newVal: string | null }[] = [
      { key: 'delivery_address', label: '배송지 주소', oldVal: before.delivery_address, newVal: input.deliveryAddress?.trim() || null },
      { key: 'delivery_jibun_address', label: '배송지 지번주소', oldVal: before.delivery_jibun_address, newVal: input.deliveryJibun?.trim() || null },
      { key: 'delivery_detail_address', label: '배송지 세부주소', oldVal: before.delivery_detail_address, newVal: input.deliveryDetailAddress?.trim() || null },
      { key: 'entrance_password', label: '배송지 공동현관 비밀번호', oldVal: before.entrance_password, newVal: input.entrancePassword?.trim() || null },
      { key: 'return_address', label: '회수지 주소', oldVal: before.return_address, newVal: input.returnAddress?.trim() || null },
      { key: 'return_jibun_address', label: '회수지 지번주소', oldVal: before.return_jibun_address, newVal: input.returnJibun?.trim() || null },
      { key: 'return_detail_address', label: '회수지 세부주소', oldVal: before.return_detail_address, newVal: input.returnDetailAddress?.trim() || null },
      { key: 'return_entrance_password', label: '회수지 공동현관 비밀번호', oldVal: before.return_entrance_password, newVal: input.returnEntrancePassword?.trim() || null },
      { key: 'workplace', label: '근무지', oldVal: before.workplace, newVal: input.workplace?.trim() || null },
      { key: 'delivery_phone', label: '배송 연락처', oldVal: before.delivery_phone, newVal: input.deliveryPhone?.trim() || null },
    ];
    const changed = trackedFields.filter((f) => (f.oldVal ?? null) !== (f.newVal ?? null));
    if (changed.length > 0) {
      const admin = supabaseAdmin();
      await admin.from('address_change_log').insert(
        changed.map((f) => ({
          customer_id: before.id,
          field: f.key,
          field_label: f.label,
          old_value: f.oldVal,
          new_value: f.newVal,
        })),
      );
    }
  }

  // 비밀번호는 입력했을 때만 Supabase Auth에 반영
  if (input.newPassword) {
    const { error: pwError } = await userClient.auth.updateUser({ password: input.newPassword });
    if (pwError) return { ok: false, reason: '비밀번호 변경에 실패했습니다.' };
  }

  return { ok: true };
}

export type WithdrawResult =
  | { ok: true }
  | { ok: false; reason: string; blockedByDispute?: boolean };

/**
 * 회원 탈퇴.
 * 1) 비밀번호 재확인 (본인 확인, signInWithPassword로 검증)
 * 2) 해결되지 않은 분쟁(payment_order.disputed=true, dispute_resolved_at is null) 주문이
 *    하나라도 있으면 탈퇴 차단
 * 3) 통과 시:
 *    - customer 행의 개인정보(이름·연락처)를 익명화 (결제/예약 이력은 회계·법적 사유로 보존)
 *    - customer.status = 'withdrawn'
 *    - Supabase Auth 사용자 삭제 (customer.auth_user_id는 ON DELETE SET NULL이라 로그인 불가 상태로 남음)
 */
export async function withdrawAccount(password: string): Promise<WithdrawResult> {
  const userClient = supabaseServer();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !user.email) return { ok: false, reason: '로그인이 필요합니다.' };

  // 1) 비밀번호 재확인
  const { error: pwError } = await userClient.auth.signInWithPassword({ email: user.email, password });
  if (pwError) return { ok: false, reason: '비밀번호가 일치하지 않습니다.' };

  const sb = supabaseAdmin();

  const { data: customer } = await sb.from('customer').select('id,name').eq('auth_user_id', user.id).maybeSingle();
  if (!customer) return { ok: false, reason: '고객 정보를 찾을 수 없습니다.' };

  // 2) 해결되지 않은 분쟁 주문이 있으면 차단
  const { data: disputed } = await sb
    .from('payment_order')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('disputed', true)
    .is('dispute_resolved_at', null)
    .limit(1);
  if (disputed && disputed.length > 0) {
    return {
      ok: false,
      blockedByDispute: true,
      reason: '해결되지 않은 분쟁 중인 주문이 있어 탈퇴할 수 없습니다. My 렌탈에서 해당 주문의 분쟁이 해결된 후 다시 시도해주세요.',
    };
  }

  // 탈퇴 완료 알림은 이름을 익명화하기 전(원래 이름)으로 먼저 보낸다.
  await sendPushToCustomer(customer.id, 'Lala', `${customer.name}님 탈퇴처리가 완료됐어요. 다시 볼 수 있으면 좋겠어요.`);

  // 3) 개인정보 익명화 (결제/예약 이력은 customer_id로 그대로 남아 보존됨)
  await sb.from('customer').update({ name: '탈퇴한 회원', phone: null, status: 'withdrawn' }).eq('id', customer.id);

  // 4) Auth 사용자 삭제
  const { error: delError } = await sb.auth.admin.deleteUser(user.id);
  if (delError) return { ok: false, reason: '탈퇴 처리 중 오류가 발생했습니다.' };

  await userClient.auth.signOut();
  return { ok: true };
}
