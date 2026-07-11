/**
 * 보증금은 상품별 금액이 아니라 "주문당 정액"으로 청구한다.
 * (product.deposit 컬럼은 남아있지만 현재 총액 계산에는 쓰지 않는다 — 추후 정책 변경 대비 보존)
 */
export const FLAT_DEPOSIT = 50000;

/** 멤버십 가입비(일회성) */
export const MEMBERSHIP_FEE = 100_000;
