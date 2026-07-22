'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase/server';
import { getCachedUser } from './auth-cache';

export type DeliveryMode = 'home' | 'workplace' | 'pickup';

export interface AddressBookEntry {
  id: string;
  label: string;
  mode: DeliveryMode;
  address: string | null;
  jibun: string | null;
  zonecode: string | null;
  detailAddress: string | null;
  entrancePassword: string | null;
  workplace: string | null;
  phone: string | null;
  isDefault: boolean;
}

async function resolveCustomerId(): Promise<string | null> {
  const user = await getCachedUser();
  if (!user) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  return data?.id ?? null;
}

export async function listAddressBook(): Promise<AddressBookEntry[]> {
  const customerId = await resolveCustomerId();
  if (!customerId) return [];
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('delivery_address_book')
    .select('id,label,mode,address,jibun_address,zonecode,detail_address,entrance_password,workplace,phone,is_default')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  return (data ?? []).map((r: {
    id: string; label: string; mode: DeliveryMode; address: string | null; jibun_address: string | null;
    zonecode: string | null; detail_address: string | null; entrance_password: string | null; workplace: string | null;
    phone: string | null; is_default: boolean;
  }) => ({
    id: r.id,
    label: r.label,
    mode: r.mode,
    address: r.address,
    jibun: r.jibun_address,
    zonecode: r.zonecode,
    detailAddress: r.detail_address,
    entrancePassword: r.entrance_password,
    workplace: r.workplace,
    phone: r.phone,
    isDefault: r.is_default,
  }));
}

export interface SaveAddressBookInput {
  label: string;
  mode: DeliveryMode;
  address?: string;
  jibun?: string;
  zonecode?: string;
  detailAddress?: string;
  entrancePassword?: string;
  workplace?: string;
  phone?: string;
  isDefault?: boolean;
}

export async function saveToAddressBook(input: SaveAddressBookInput): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };
  if (!input.label.trim()) return { ok: false, reason: '주소 이름을 입력해주세요.' };

  const sb = supabaseAdmin();
  // 기본 배송지는 모드(자택/근무지)별로 각각 관리된다 — 자택 기본과 근무지 기본이 동시에 있을 수 있음.
  const { count } = await sb
    .from('delivery_address_book')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('mode', input.mode);
  // 명시적으로 기본으로 지정했거나, 이 모드로 주소록에 저장하는 첫 주소면 자동으로 그 모드의 기본 배송지가 된다.
  const shouldBeDefault = !!input.isDefault || (count ?? 0) === 0;
  if (shouldBeDefault) {
    await sb.from('delivery_address_book').update({ is_default: false }).eq('customer_id', customerId).eq('mode', input.mode);
  }

  const { data, error } = await sb.from('delivery_address_book').insert({
    customer_id: customerId,
    label: input.label.trim(),
    mode: input.mode,
    address: input.address?.trim() || null,
    jibun_address: input.jibun?.trim() || null,
    zonecode: input.zonecode?.trim() || null,
    detail_address: input.detailAddress?.trim() || null,
    entrance_password: input.entrancePassword?.trim() || null,
    workplace: input.workplace?.trim() || null,
    phone: input.phone?.trim() || null,
    is_default: shouldBeDefault,
  }).select('id').single();
  if (error || !data) return { ok: false, reason: '주소록 저장에 실패했습니다.' };

  revalidatePath('/profile');
  revalidatePath('/cart');
  return { ok: true, id: data.id };
}

export async function setDefaultAddressBookEntry(id: string): Promise<{ ok: boolean; reason?: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };
  const sb = supabaseAdmin();
  const { data: target } = await sb
    .from('delivery_address_book')
    .select('mode')
    .eq('id', id)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!target) return { ok: false, reason: '주소를 찾을 수 없습니다.' };
  // 같은 모드(자택/근무지) 안에서만 기본을 바꾼다 — 다른 모드의 기본 배송지는 그대로 유지됨.
  await sb.from('delivery_address_book').update({ is_default: false }).eq('customer_id', customerId).eq('mode', target.mode);
  const { error } = await sb
    .from('delivery_address_book')
    .update({ is_default: true })
    .eq('id', id)
    .eq('customer_id', customerId);
  if (error) return { ok: false, reason: '기본 배송지 설정에 실패했습니다.' };
  revalidatePath('/profile');
  revalidatePath('/cart');
  return { ok: true };
}

export async function deleteAddressBookEntry(id: string): Promise<{ ok: boolean }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false };
  const sb = supabaseAdmin();
  await sb.from('delivery_address_book').delete().eq('id', id).eq('customer_id', customerId);
  revalidatePath('/profile');
  revalidatePath('/cart');
  return { ok: true };
}

export interface UpdateAddressBookInput {
  label: string;
  address?: string;
  jibun?: string;
  zonecode?: string;
  detailAddress?: string;
  entrancePassword?: string;
  workplace?: string;
  phone?: string;
}

export async function updateAddressBookEntry(id: string, input: UpdateAddressBookInput): Promise<{ ok: boolean; reason?: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };
  if (!input.label.trim()) return { ok: false, reason: '주소 이름을 입력해주세요.' };
  const sb = supabaseAdmin();
  const { error } = await sb.from('delivery_address_book').update({
    label: input.label.trim(),
    address: input.address?.trim() || null,
    jibun_address: input.jibun?.trim() || null,
    zonecode: input.zonecode?.trim() || null,
    detail_address: input.detailAddress?.trim() || null,
    entrance_password: input.entrancePassword?.trim() || null,
    workplace: input.workplace?.trim() || null,
    phone: input.phone?.trim() || null,
  }).eq('id', id).eq('customer_id', customerId);
  if (error) return { ok: false, reason: '수정에 실패했습니다.' };
  revalidatePath('/profile');
  revalidatePath('/cart');
  return { ok: true };
}

