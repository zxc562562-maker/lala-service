/**
 * 보증금은 상품별 금액이 아니라 "주문당 정액"으로 청구한다.
 * (product.deposit 컬럼은 남아있지만 현재 총액 계산에는 쓰지 않는다 — 추후 정책 변경 대비 보존)
 */
export const FLAT_DEPOSIT = 50000;

/** 멤버십 가입비(일회성) */
export const MEMBERSHIP_FEE = 100_000;

/** 택배 왕복 배송비(정액). */
export const PARCEL_ROUNDTRIP_FEE = 7000;

/**
 * 퀵배송 배송비. 거리별로 금액이 달라 아직 정액을 매기지 못해 0원으로 두되,
 * "배송비" 라벨 자체는 미리 노출해둔다(추후 거리 기반 정책이 정해지면 이 값만 바꾸면 됨).
 */
export const QUICK_DELIVERY_FEE = 0;
