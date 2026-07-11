/**
 * 예약 가용성 / 충돌 검사 엔진 (1단계와 동일 규칙)
 * 클라이언트 캘린더와 서버 예약 검증이 "같은 규칙"을 쓰도록 helper를 공유한다.
 */
import type { InventoryItem } from './inventory';

export type DateStr = string; // 'YYYY-MM-DD'
export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  itemId: string;
  checkout: DateStr;
  return: DateStr;
  status: ReservationStatus;
}

export interface RentalRequest {
  checkout: DateStr;
  return: DateStr;
}

// ---- 날짜 유틸 ----
export function toDate(s: DateStr): Date {
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) throw new Error(`잘못된 날짜: ${s}`);
  return d;
}
export function iso(d: Date): DateStr {
  return d.toISOString().slice(0, 10);
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function rangesOverlap(aS: Date, aE: Date, bS: Date, bE: Date): boolean {
  return aS.getTime() <= bE.getTime() && bS.getTime() <= aE.getTime();
}

/**
 * 요청 기간이 유효한지 검사(형식/날짜순/최소일수/과거날짜). 잘못되면 Error를 던진다.
 * 카트·결제 화면에서 이미 1차 검증하지만, 웹훅 등 세션 비의존 경로에서도 같은 규칙을
 * 한 번 더 강제하기 위한 서버측 최종 방어선.
 */
export function validateRequest(
  req: RentalRequest,
  opts: { minDays: number; today: DateStr },
): void {
  const checkout = toDate(req.checkout);
  const ret = toDate(req.return);
  if (checkout.getTime() < toDate(opts.today).getTime()) {
    throw new Error('예약일은 오늘 이후여야 합니다.');
  }
  const days = Math.round((ret.getTime() - checkout.getTime()) / 86_400_000);
  if (days < opts.minDays) {
    throw new Error('반납일은 예약일 이후여야 합니다.');
  }
}

/**
 * 특정 개체가 요청 기간에 대여 가능한지. (반납일 + 세탁버퍼까지 점유로 본다)
 */
export function isItemAvailable(
  itemId: string,
  req: RentalRequest,
  reservations: Reservation[],
  cleaningBufferDays = 1,
): boolean {
  const reqStart = toDate(req.checkout);
  const reqEnd = toDate(req.return);
  for (const r of reservations) {
    if (r.itemId !== itemId || r.status !== 'ACTIVE') continue;
    const existStart = toDate(r.checkout);
    const existEnd = addDays(toDate(r.return), cleaningBufferDays);
    if (rangesOverlap(reqStart, reqEnd, existStart, existEnd)) return false;
  }
  return true;
}

export function findAvailableItem(
  items: InventoryItem[],
  req: RentalRequest,
  reservations: Reservation[],
  cleaningBufferDays = 1,
): InventoryItem | null {
  const candidates = items
    .filter((it) => it.status !== 'RETIRED' && it.status !== 'REPAIRING')
    .sort((a, b) => b.condition - a.condition);
  for (const item of candidates) {
    if (isItemAvailable(item.id, req, reservations, cleaningBufferDays)) return item;
  }
  return null;
}

/**
 * ★ 캘린더 UI 공유 helper.
 * 한 상품의 예약들을 받아 "대여 불가 날짜" 집합을 펼쳐서 돌려준다.
 * (세탁 버퍼 포함) → 화면의 캘린더가 서버 규칙과 정확히 일치하게 된다.
 */
export function expandUnavailableDates(
  reservations: Reservation[],
  cleaningBufferDays = 1,
): Set<DateStr> {
  const set = new Set<DateStr>();
  for (const r of reservations) {
    if (r.status !== 'ACTIVE') continue;
    let cur = toDate(r.checkout);
    const end = addDays(toDate(r.return), cleaningBufferDays);
    while (cur.getTime() <= end.getTime()) {
      set.add(iso(cur));
      cur = addDays(cur, 1);
    }
  }
  return set;
}

/** 오늘 날짜를 'YYYY-MM-DD'(로컬 기준)로 반환 */
export function todayISO(): DateStr {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
