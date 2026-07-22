-- 주문 취소(배송 전 전액 환불) 기능: payment_order.status/fulfillment_status에 'CANCELLED' 값 허용.
alter table payment_order drop constraint if exists payment_order_status_check;
alter table payment_order add constraint payment_order_status_check
  check (status in ('PENDING','PAID','FAILED','CANCELLED'));

alter table payment_order drop constraint if exists payment_order_fulfillment_status_check;
alter table payment_order add constraint payment_order_fulfillment_status_check
  check (fulfillment_status in (
    'ORDERED','PRE_INSPECTING','READY','SHIPPED','DELIVERED','RETURN_INSPECTING','REFUNDED',
    'PRE_INSPECT_ISSUE','MISDELIVERED','RETURN_ISSUE','CANCELLED'
  ));
