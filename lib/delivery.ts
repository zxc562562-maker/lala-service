export interface DeliverySlot {
  id: string;
  label: string;
}

/**
 * 배송 시간대. "몇 시까지 받고 싶은지"를 오후 3~8시 사이 1시간 단위로 고르게 함.
 * 배열로 관리해서 시간 범위가 나중에 바뀌어도 이 배열만 수정하면 카트·주문·배송 화면에 전부 반영됨.
 */
export const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: '15', label: '3:00' },
  { id: '16', label: '4:00' },
  { id: '17', label: '5:00' },
  { id: '18', label: '6:00' },
  { id: '19', label: '7:00' },
  { id: '20', label: '8:00' },
];

export function getDeliverySlotLabel(id: string | null): string {
  const slot = DELIVERY_SLOTS.find((s) => s.id === id);
  return slot ? `오후 ${slot.label}까지` : '미지정';
}

export function isValidDeliverySlot(id: string): boolean {
  return DELIVERY_SLOTS.some((s) => s.id === id);
}

export interface DeliveryMethod {
  id: string;
  label: string;
}

/** 배송 방법. 재주문 시 같은 방법을 다시 고를 확률이 높아, 마지막 선택을 customer.preferred_delivery_method에 기억해뒀다가 다음 주문 때 기본 선택해준다. */
export const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'DIRECT', label: '직배송' },
  { id: 'QUICK', label: '퀵배송' },
  { id: 'PARCEL', label: '택배' },
];

export function isValidDeliveryMethod(id: string): boolean {
  return DELIVERY_METHODS.some((m) => m.id === id);
}
