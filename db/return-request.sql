-- 택배(PARCEL) 배송 반납 접수 요청: 고객이 직접 반납 발송을 알리는 새 이행상태.
-- 정상 흐름에 DELIVERED와 RETURN_INSPECTING 사이 단계로 삽입(직배송·퀵배송은 기사가 직접 수거하므로 해당 없음).
alter table payment_order drop constraint if exists payment_order_fulfillment_status_check;
alter table payment_order add constraint payment_order_fulfillment_status_check
  check (fulfillment_status in (
    'ORDERED','PRE_INSPECTING','READY','SHIPPED','DELIVERED','RETURN_REQUESTED','RETURN_INSPECTING','REFUNDED',
    'PRE_INSPECT_ISSUE','MISDELIVERED','RETURN_ISSUE','CANCELLED'
  ));

alter table payment_order add column if not exists return_requested_at timestamptz;
