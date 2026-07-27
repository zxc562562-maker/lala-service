/**
 * 주문 상태 알약 문구 — 배송 방법마다 실제로 거치는 단계가 달라서(예: 직접 픽업은 배송 자체가
 * 없고, 택배만 "반납접수 요청" 단계가 있음) 배송 방법별로 문구를 다르게 보여준다.
 * 내 렌탈 주문 목록(account/page.tsx)과 주문 상세(account/[orderId]/page.tsx)가 공유해서 쓴다.
 */

// 배송 방법과 무관하게 공통으로 쓰이는 기본 문구(아래 METHOD_LABEL에 없는 조합의 안전한 대체값).
const SHARED_LABEL: Record<string, string> = {
  ORDERED: '결제 완료', PRE_INSPECTING: '상품 검수중', READY: '배송 대기중', SHIPPED: '배송중', DELIVERED: '배송 완료',
  RETURN_REQUESTED: '반납접수 요청됨', RETURN_INSPECTING: '반납 검수중', REFUNDED: '반납 완료',
  DEPOSIT_REFUNDED: '보증금 환불 완료', CANCELLED: '주문 취소',
};

// 배송 방법별로 문구가 달라지는 항목만 덮어쓴다.
const METHOD_LABEL: Record<string, Partial<Record<string, string>>> = {
  DIRECT: { SHIPPED: '배송중', DELIVERED: '배송 완료' },
  QUICK: { SHIPPED: '퀵 배송중' },
  PARCEL: { READY: '택배사 전달중', SHIPPED: '택배 배송중', DELIVERED: '배송 완료', RETURN_REQUESTED: '반납 요청 완료' },
  PICKUP: { RETURN_REQUESTED: '반납 요청 완료' },
};

export function getOrderStatusLabel(fulfillmentStatus: string, deliveryMethod: string | null): string {
  const override = deliveryMethod ? METHOD_LABEL[deliveryMethod]?.[fulfillmentStatus] : undefined;
  return override ?? SHARED_LABEL[fulfillmentStatus] ?? fulfillmentStatus;
}

// 택배·퀵은 상품검수중까지만 취소 가능(그 다음 READY부터는 택배사에 이미 넘어가/픽업 기사가 이미
// 배정돼 되돌릴 수 없음). 직배송·직접 픽업은 기존대로 배송 대기중까지 취소 가능.
const STRICT_CANCEL_CUTOFF_METHODS = new Set(['PARCEL', 'QUICK']);

export function isCancellableStatus(fulfillmentStatus: string, deliveryMethod: string | null): boolean {
  const allowed = deliveryMethod && STRICT_CANCEL_CUTOFF_METHODS.has(deliveryMethod)
    ? ['ORDERED', 'PRE_INSPECTING']
    : ['ORDERED', 'PRE_INSPECTING', 'READY'];
  return allowed.includes(fulfillmentStatus);
}

// 문제 발생 분기(레드 계열로 구분 표시) — 배송 방법과 무관하게 공통.
export const PROBLEM_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '상품 검수중 오염·손상 확인', MISDELIVERED: '오배송', RETURN_ISSUE: '반납 검수중 오염·손상 확인',
};

// 문제 발생 시 상태 알약 아래에 한 번 더 보여줄 "우리 쪽 대응" 문구.
export const RESPONSE_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '꼼꼼히 수선·세탁 후 보내드릴게요.', MISDELIVERED: '오배송 확인되어 처리중이에요.', RETURN_ISSUE: '확인·처리 중이에요.',
};
