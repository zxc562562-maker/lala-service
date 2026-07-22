import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@lala/shared/lib/supabase/server';
import type { Product } from '@lala/shared/lib/types';
import type { Reservation } from '@lala/shared/lib/domain/reservation';
import type { InventoryItem, ItemStatus } from '@lala/shared/lib/domain/inventory';

// ---- DB row → 도메인 타입 매핑 ----
type ProductRow = {
  id: string; name: string; brand: string | null; category: string; size: string;
  daily_price: number; deposit: number; color_1: string | null; color_2: string | null;
};
type ItemRow = {
  id: string; product_id: string; status: ItemStatus; condition: number; rental_count: number;
};
type ResvRow = {
  id: string; item_id: string; checkout: string; return_date: string; status: Reservation['status'];
};

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id, name: r.name, brand: r.brand ?? '', category: r.category, size: r.size,
    dailyPrice: r.daily_price, deposit: r.deposit,
    c1: r.color_1 ?? '#3B2230', c2: r.color_2 ?? '#6B2737',
  };
}
function mapItem(r: ItemRow): InventoryItem {
  return { id: r.id, productId: r.product_id, status: r.status, condition: r.condition, rentalCount: r.rental_count };
}
function mapResv(r: ResvRow): Reservation {
  return { id: r.id, itemId: r.item_id, checkout: r.checkout, return: r.return_date, status: r.status };
}

// ---- 카탈로그 ----
// 카탈로그(상품 목록)·사이즈 재고는 특정 회원 것이 아니라 모든 방문자가 동일하게 보는 데이터라
// 짧은 시간(30초) 동안은 캐시해서 재사용한다 — 부하 테스트에서 /looks 페이지가 동시접속마다
// 매번 실 DB를 새로 조회해 심각하게 느려지는 문제(동시접속 20 기준 중앙값 3957ms)를 발견해서 추가함.
// 여기 나오는 "대여 가능 여부"는 어디까지나 화면 표시용이고, 실제 예약 충돌 방지는 이 캐시와
// 무관하게 예약 생성 시점에 별도로 처리되므로 30초 지연이 생겨도 예약 정합성엔 영향 없음.
async function fetchProducts(): Promise<Product[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('product')
    .select('id,name,brand,category,size,daily_price,deposit,color_1,color_2')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data as ProductRow[]).map(mapProduct);
  // 같은 스타일(이름)에 사이즈별 여러 행이 있어도 목록엔 대표로 1개만 노출
  const seen = new Set<string>();
  return rows.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
}
export const getProducts = unstable_cache(fetchProducts, ['catalog-products'], { revalidate: 30 });

/** 카탈로그의 "다음 가능일" 계산용: 모든 ACTIVE 예약을 상품별로 묶어서 반환 */
export async function getReservationsByProduct(): Promise<Record<string, Reservation[]>> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('reservation')
    .select('id,item_id,checkout,return_date,status,inventory_item(product_id)')
    .eq('status', 'ACTIVE');
  if (error) throw error;
  const out: Record<string, Reservation[]> = {};
  for (const row of data as unknown as (ResvRow & { inventory_item: { product_id: string } })[]) {
    const pid = row.inventory_item.product_id;
    (out[pid] ??= []).push(mapResv(row));
  }
  return out;
}

// ---- 상세 ----
export async function getProduct(id: string): Promise<Product | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('product')
    .select('id,name,brand,category,size,daily_price,deposit,color_1,color_2')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

/** 한 상품의 개체들 + 그 개체들의 ACTIVE 예약 */
export async function getItemsAndReservations(
  productId: string,
): Promise<{ items: InventoryItem[]; reservations: Reservation[] }> {
  const sb = supabaseAdmin();
  const { data: itemRows, error: e1 } = await sb
    .from('inventory_item')
    .select('id,product_id,status,condition,rental_count')
    .eq('product_id', productId);
  if (e1) throw e1;
  const items = (itemRows as ItemRow[]).map(mapItem);
  const itemIds = items.map((i) => i.id);

  if (itemIds.length === 0) return { items, reservations: [] };

  const { data: resvRows, error: e2 } = await sb
    .from('reservation')
    .select('id,item_id,checkout,return_date,status')
    .in('item_id', itemIds)
    .eq('status', 'ACTIVE');
  if (e2) throw e2;
  return { items, reservations: (resvRows as ResvRow[]).map(mapResv) };
}

// ---- 룩북(lookbook) ----
/** 상품명 배열로 상품들을 조회 (룩 구성 순서 유지). 같은 이름(스타일)에 사이즈별 여러 행이 있어도 대표로 1개만 반환. */
export async function getProductsByNames(names: string[]): Promise<Product[]> {
  if (names.length === 0) return [];
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('product')
    .select('id,name,brand,category,size,daily_price,deposit,color_1,color_2')
    .in('name', names);
  if (error) throw error;
  const rows = (data as ProductRow[]).map(mapProduct);
  return names
    .map((n) => rows.find((p) => p.name === n)) // 이름당 첫 번째(대표 사이즈)만
    .filter((p): p is Product => !!p);
}

export interface SizeOption { size: string; available: boolean; productId: string }

/**
 * 스타일(이름)별로 보유한 모든 사이즈 + "선택한 기간" 기준 대여 가능 여부.
 * 그 사이즈의 재고(inventory_item) 중 하나라도 해당 기간과 겹치는 ACTIVE 예약이 없으면 대여 가능으로 판단.
 * (반납일 당일은 겹침 계산에서 제외 — 다른 예약 로직과 동일한 규칙)
 */
export async function getSizeAvailabilityForRange(
  names: string[],
  checkout: string,
  returnDate: string,
): Promise<Record<string, SizeOption[]>> {
  if (names.length === 0) return {};
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('product')
    .select('id,name,size,inventory_item(id,status,reservation(checkout,return_date,status))')
    .in('name', names);
  if (error) throw error;

  const SIZE_ORDER = ['FREE', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const sizeKey = (s: string) => {
    const n = Number(s);
    if (!Number.isNaN(n)) return 1000 + n;
    const i = SIZE_ORDER.indexOf(s);
    return i >= 0 ? i : 500;
  };
  const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

  type Row = {
    id: string; name: string; size: string;
    inventory_item: { id: string; status: string; reservation: { checkout: string; return_date: string; status: string }[] }[];
  };

  const out: Record<string, SizeOption[]> = {};
  for (const row of data as Row[]) {
    // 이 사이즈의 재고 중, 선택한 기간과 겹치는 ACTIVE 예약이 하나도 없는 개체가 있으면 대여 가능
    const available = row.inventory_item.some((it) =>
      !it.reservation.some((r) => r.status === 'ACTIVE' && overlaps(checkout, returnDate, r.checkout, r.return_date)));
    (out[row.name] ??= []).push({ size: row.size, available, productId: row.id });
  }
  for (const name of Object.keys(out)) {
    out[name].sort((a, b) => sizeKey(a.size) - sizeKey(b.size));
  }
  return out;
}

/** 스타일(이름)별로 보유한 모든 사이즈 + 사이즈별 대여 가능 여부(재고 1개 이상 AVAILABLE인지) + 각 사이즈의 productId */
async function fetchSizeAvailabilityByNames(names: string[]): Promise<Record<string, SizeOption[]>> {
  if (names.length === 0) return {};
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('product')
    .select('id,name,size,inventory_item(status)')
    .in('name', names);
  if (error) throw error;

  const SIZE_ORDER = ['FREE', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const sizeKey = (s: string) => {
    const n = Number(s);
    if (!Number.isNaN(n)) return 1000 + n; // 숫자 사이즈(신발 등)는 숫자 순
    const i = SIZE_ORDER.indexOf(s);
    return i >= 0 ? i : 500;
  };

  const out: Record<string, SizeOption[]> = {};
  for (const row of data as { id: string; name: string; size: string; inventory_item: { status: string }[] }[]) {
    const available = row.inventory_item.some((it) => it.status === 'AVAILABLE');
    (out[row.name] ??= []).push({ size: row.size, available, productId: row.id });
  }
  for (const name of Object.keys(out)) {
    out[name].sort((a, b) => sizeKey(a.size) - sizeKey(b.size));
  }
  return out;
}
export const getSizeAvailabilityByNames = unstable_cache(
  fetchSizeAvailabilityByNames, ['catalog-size-availability'], { revalidate: 30 },
);

/** 여러 상품(id)의 ACTIVE 예약을 합쳐 반환 (카트 달력 가용성 계산용) */
export async function getReservationsForProductIds(productIds: string[]): Promise<Reservation[]> {
  if (productIds.length === 0) return [];
  const sb = supabaseAdmin();
  const { data: items, error: e1 } = await sb
    .from('inventory_item').select('id,product_id').in('product_id', productIds);
  if (e1) throw e1;
  const itemIds = (items as { id: string }[]).map((i) => i.id);
  if (itemIds.length === 0) return [];
  const { data: resv, error: e2 } = await sb
    .from('reservation').select('id,item_id,checkout,return_date,status')
    .in('item_id', itemIds).eq('status', 'ACTIVE');
  if (e2) throw e2;
  return (resv as ResvRow[]).map(mapResv);
}
