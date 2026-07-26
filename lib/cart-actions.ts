'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@lala/shared/lib/supabase/server';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { getClosedDates } from '@lala/shared/lib/closure-actions';
import { getReservationsForProductIds, getSizeAvailabilityForRange as _getSizeAvailabilityForRange, getSizeAvailabilityByNames as _getSizeAvailabilityByNames, type SizeOption } from './queries';
import { expandUnavailableDates } from '@lala/shared/lib/domain/reservation';
import type { Profile } from './account-actions';

export interface CartLine {
  id: string;        // cart_item id
  productId: string;
  name: string;
  size: string;
  dailyPrice: number;
  deposit: number;
  c1: string;
  c2: string;
}

/** 현재 로그인 사용자의 customer.id 를 찾거나 생성 */
async function resolveCustomerId(): Promise<string | null> {
  const user = await getCachedUser();
  if (!user) return null;

  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (existing) return existing.id;

  const name = (user.user_metadata?.name as string) || '고객';
  const phone = (user.user_metadata?.phone as string) || null;
  // status를 컬럼 기본값에 맡기지 않고 명시적으로 지정(마이그레이션 순서와 무관하게 항상 결제 전 상태로 생성)
  const { data: created, error } = await sb
    .from('customer').insert({ auth_user_id: user.id, name, phone, status: 'unpaid' }).select('id').single();
  if (error) return null;
  return created.id;
}

export async function addCartItem(
  productId: string,
): Promise<{ ok: true } | { ok: false; reason: string; needLogin?: boolean }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '장바구니에 담으려면 로그인이 필요합니다.', needLogin: true };

  const sb = supabaseAdmin();
  const { error } = await sb.from('cart_item').insert({ customer_id: customerId, product_id: productId });
  // 이미 담긴 상품이면(unique 위반) 무시
  if (error && !/duplicate|unique/i.test(error.message)) {
    return { ok: false, reason: '장바구니 저장에 실패했습니다.' };
  }
  revalidatePath('/cart');
  return { ok: true };
}

export async function getCartItems(): Promise<CartLine[]> {
  const customerId = await resolveCustomerId();
  if (!customerId) return [];

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('cart_item')
    .select('id,product:product_id(id,name,size,daily_price,deposit,color_1,color_2)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];

  return (data as unknown as {
    id: string;
    product: { id: string; name: string; size: string; daily_price: number; deposit: number; color_1: string | null; color_2: string | null };
  }[]).map((r) => ({
    id: r.id,
    productId: r.product.id,
    name: r.product.name,
    size: r.product.size,
    dailyPrice: r.product.daily_price,
    deposit: r.product.deposit,
    c1: r.product.color_1 ?? '#3B2230',
    c2: r.product.color_2 ?? '#6B2737',
  }));
}

export async function removeCartItem(id: string): Promise<{ ok: boolean }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false };
  const sb = supabaseAdmin();
  await sb.from('cart_item').delete().eq('id', id).eq('customer_id', customerId);
  revalidatePath('/cart');
  return { ok: true };
}

/**
 * 지금 내 카트에 있는 상품(productId)들 중, 다른 회원의 카트에도 동시에 담겨 있는 것들을 찾는다.
 * 빠른 결제를 유도하기 위해 카트 페이지에 "다른 회원님의 카트에도 담겨 있어요" 안내로 사용.
 */
export async function getOtherCartConflicts(productIds: string[]): Promise<Set<string>> {
  const customerId = await resolveCustomerId();
  if (!customerId || productIds.length === 0) return new Set();
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('cart_item')
    .select('product_id')
    .in('product_id', productIds)
    .neq('customer_id', customerId);
  return new Set((data ?? []).map((r: { product_id: string }) => r.product_id));
}

/** 카트에 담긴 아이템을 같은 스타일의 다른 사이즈(productId)로 교체 */
export async function swapCartItemSize(cartItemId: string, newProductId: string): Promise<{ ok: boolean; reason?: string }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, reason: '로그인이 필요합니다.' };
  const sb = supabaseAdmin();

  const { error } = await sb
    .from('cart_item')
    .update({ product_id: newProductId })
    .eq('id', cartItemId)
    .eq('customer_id', customerId);

  if (error) {
    // 이미 그 사이즈가 카트에 따로 담겨 있으면(unique 위반) 지금 것만 지움
    if (/duplicate|unique/i.test(error.message)) {
      await sb.from('cart_item').delete().eq('id', cartItemId).eq('customer_id', customerId);
      revalidatePath('/cart');
      return { ok: true };
    }
    return { ok: false, reason: '사이즈 변경에 실패했습니다.' };
  }
  revalidatePath('/cart');
  return { ok: true };
}

/** 클라이언트 컴포넌트(카트 페이지)에서 호출하기 위한 서버 액션 래퍼 */
export async function getSizeAvailabilityForRange(
  names: string[], checkout: string, returnDate: string,
): Promise<Record<string, SizeOption[]>> {
  return _getSizeAvailabilityForRange(names, checkout, returnDate);
}

/** 날짜 선택 전 기본(지금 재고 기준) 사이즈 옵션 — 카트에 담긴 사이즈를 예약일 선택 전에도 보여주기 위함 */
export async function getSizeAvailabilityByNames(names: string[]): Promise<Record<string, SizeOption[]>> {
  return _getSizeAvailabilityByNames(names);
}

/**
 * 카트에 담긴 모든 상품의 예약을 합친 "예약 불가 날짜"(YYYY-MM-DD) 목록.
 * 호출하는 쪽이 이미 getCartItems()로 받아둔 목록이 있으면 넘겨서 중복 조회를 피할 수 있다.
 */
export async function getCartBusyDates(items?: CartLine[]): Promise<string[]> {
  const cartItems = items ?? await getCartItems();
  const reservations = await getReservationsForProductIds(cartItems.map((i) => i.productId));
  return Array.from(expandUnavailableDates(reservations));
}

export interface CartPageData {
  items: CartLine[];
  busyDates: string[];
  closedDates: string[];
  otherConflicts: Set<string>;
  profile: Profile | null;
}

/**
 * 카트 페이지가 처음 열릴 때 필요한 데이터를 한 번에 가져온다. getCartItems/getOtherCartConflicts/
 * getProfile을 따로따로 부르면 로그인 확인(auth.getUser, 실제 네트워크 왕복)이 각 서버 액션 호출마다
 * 중복으로 나가서(React cache()는 같은 요청 안에서만 적용되고, 클라이언트에서 쏘는 별도의 서버 액션
 * 호출끼리는 묶이지 않음) 체감 로딩이 눈에 띄게 느려진다 — 로그인 확인은 한 번만 하고 나머지 조회를
 * 병렬로 묶는다.
 */
export async function getCartPageData(): Promise<CartPageData> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { items: [], busyDates: [], closedDates: [], otherConflicts: new Set(), profile: null };

  const sb = supabaseAdmin();
  const [{ data: cartRows }, { data: profileRow }, closedDates] = await Promise.all([
    sb.from('cart_item')
      .select('id,product:product_id(id,name,size,daily_price,deposit,color_1,color_2)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true }),
    sb.from('customer').select(`
      username,name,phone,
      marketing_lookbook_consent,marketing_promotion_consent,marketing_daily_consent,
      delivery_address,delivery_jibun_address,delivery_zonecode,delivery_detail_address,entrance_password,
      delivery_message,delivery_ring_bell,delivery_knock,delivery_leave_at_handle,
      return_address,return_jibun_address,return_detail_address,return_entrance_password,
      delivery_phone,delivery_recipient_name,workplace,delivery_in_store,return_in_store,preferred_delivery_method
    `).eq('id', customerId).maybeSingle(),
    getClosedDates(),
  ]);

  const items: CartLine[] = ((cartRows ?? []) as unknown as {
    id: string;
    product: { id: string; name: string; size: string; daily_price: number; deposit: number; color_1: string | null; color_2: string | null };
  }[]).map((r) => ({
    id: r.id,
    productId: r.product.id,
    name: r.product.name,
    size: r.product.size,
    dailyPrice: r.product.daily_price,
    deposit: r.product.deposit,
    c1: r.product.color_1 ?? '#3B2230',
    c2: r.product.color_2 ?? '#6B2737',
  }));

  const productIds = items.map((i) => i.productId);
  const [reservations, conflictRows] = await Promise.all([
    getReservationsForProductIds(productIds),
    productIds.length
      ? sb.from('cart_item').select('product_id').in('product_id', productIds).neq('customer_id', customerId).then((r) => r.data ?? [])
      : Promise.resolve([] as { product_id: string }[]),
  ]);

  const profile: Profile = {
    username: profileRow?.username ?? '',
    name: profileRow?.name ?? '',
    phone: profileRow?.phone ?? null,
    marketingLookbook: profileRow?.marketing_lookbook_consent ?? false,
    marketingPromotion: profileRow?.marketing_promotion_consent ?? false,
    marketingDaily: profileRow?.marketing_daily_consent ?? false,
    deliveryAddress: profileRow?.delivery_address ?? null,
    deliveryJibun: profileRow?.delivery_jibun_address ?? null,
    deliveryZonecode: profileRow?.delivery_zonecode ?? null,
    deliveryDetailAddress: profileRow?.delivery_detail_address ?? null,
    entrancePassword: profileRow?.entrance_password ?? null,
    deliveryMessage: profileRow?.delivery_message ?? null,
    deliveryRingBell: profileRow?.delivery_ring_bell ?? false,
    deliveryKnock: profileRow?.delivery_knock ?? false,
    deliveryLeaveAtHandle: profileRow?.delivery_leave_at_handle ?? false,
    returnAddress: profileRow?.return_address ?? null,
    returnJibun: profileRow?.return_jibun_address ?? null,
    returnDetailAddress: profileRow?.return_detail_address ?? null,
    returnEntrancePassword: profileRow?.return_entrance_password ?? null,
    deliveryPhone: profileRow?.delivery_phone ?? null,
    deliveryRecipientName: profileRow?.delivery_recipient_name ?? null,
    workplace: profileRow?.workplace ?? null,
    deliveryInStore: profileRow?.delivery_in_store ?? false,
    returnInStore: profileRow?.return_in_store ?? false,
    preferredDeliveryMethod: profileRow?.preferred_delivery_method ?? null,
  };

  return {
    items,
    busyDates: Array.from(expandUnavailableDates(reservations)),
    closedDates,
    otherConflicts: new Set((conflictRows as { product_id: string }[]).map((r) => r.product_id)),
    profile,
  };
}
