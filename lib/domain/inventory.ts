/**
 * 재고 개체(Inventory Item) 상태머신
 * --------------------------------------------------
 * 일반 쇼핑몰과 렌탈의 결정적 차이:
 *   쇼핑몰  = "SKU 1개 + 재고 수량 N"
 *   렌탈    = "옷 한 벌 한 벌이 고유한 개체이고, 각자 상태(lifecycle)를 가진다"
 *
 * 옷 한 벌(=하나의 InventoryItem)은 아래 상태들을 순환한다.
 * 잘못된 상태 전이(예: 세탁중인 옷을 바로 대여)를 코드가 막아준다.
 */

export type ItemStatus =
  | 'AVAILABLE'   // 대여 가능
  | 'RESERVED'    // 예약됨 (아직 출고 전)
  | 'RENTED'      // 대여중 (고객이 가지고 있음)
  | 'RETURNED'    // 회수됨 (검수/세탁 대기)
  | 'CLEANING'    // 세탁/소독 중
  | 'INSPECTING'  // 검수 중
  | 'REPAIRING'   // 수선 중
  | 'RETIRED';    // 폐기 (더 이상 대여 안 함)

/**
 * 각 상태에서 갈 수 있는 다음 상태 목록.
 * 여기에 없는 전이는 무조건 에러로 막힌다.
 */
const TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  AVAILABLE:  ['RESERVED', 'REPAIRING', 'RETIRED'],
  RESERVED:   ['RENTED', 'AVAILABLE'],            // 출고 / 예약취소
  RENTED:     ['RETURNED'],                       // 회수
  RETURNED:   ['CLEANING', 'INSPECTING'],         // 보통 세탁 → 검수
  CLEANING:   ['INSPECTING'],
  INSPECTING: ['AVAILABLE', 'REPAIRING', 'RETIRED'],
  REPAIRING:  ['INSPECTING', 'AVAILABLE', 'RETIRED'],
  RETIRED:    [],                                 // 폐기는 종착지
};

export interface InventoryItem {
  id: string;            // 물리적 개체 고유 ID (옷에 붙은 QR/바코드와 1:1)
  productId: string;     // 어떤 상품(디자인/사이즈)인지
  status: ItemStatus;
  condition: number;     // 0~100, 상태 점수 (훼손/노후 추적)
  rentalCount: number;   // 총 대여 횟수 (감가/회전율 분석용)
}

export function canTransition(from: ItemStatus, to: ItemStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * 상태를 전이시킨다. 불가능한 전이면 예외를 던진다.
 * 새 객체를 반환(불변성 유지)해서 예측 가능하게 만든다.
 */
export function transition(item: InventoryItem, to: ItemStatus): InventoryItem {
  if (!canTransition(item.status, to)) {
    throw new Error(
      `잘못된 상태 전이: ${item.status} → ${to} (${item.id})`
    );
  }
  return {
    ...item,
    status: to,
    // 대여 시작 시점에 누적 대여 횟수 +1
    rentalCount: to === 'RENTED' ? item.rentalCount + 1 : item.rentalCount,
  };
}

/** 지금 새 예약을 받을 수 있는 상태인지 (상태머신 관점) */
export function isRentable(item: InventoryItem): boolean {
  return item.status === 'AVAILABLE';
}
