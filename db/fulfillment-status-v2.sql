-- =============================================================
--  주문 이행 상태(fulfillment_status)를 7단계 정상 흐름 + 3개 문제 분기로 확장.
--  기존 6개 값(PREPARING/SHIPPED/DELIVERED/PICKUP/INSPECTING/REFUNDED)을
--  더 세분화된 값으로 교체(선주문 검수/배송대기 단계 신설, 반납검수 명확화).
--
--  정상 흐름: ORDERED(주문결제) → PRE_INSPECTING(주문검수중) → READY(배송대기중)
--            → SHIPPED(배송중) → DELIVERED(배송완료) → RETURN_INSPECTING(수거검수중)
--            → REFUNDED(완료)
--  문제 분기: PRE_INSPECT_ISSUE(주문검수중 오염/손상 발견)
--            MISDELIVERED(배송중 오배송)
--            RETURN_ISSUE(수거검수중 오염/손상 발견)
--
--  실행 순서: ... → db/reservation-order-link.sql → db/fulfillment-status-v2.sql
-- =============================================================

alter table payment_order drop constraint if exists payment_order_fulfillment_status_check;
alter table payment_order add constraint payment_order_fulfillment_status_check
  check (fulfillment_status in (
    'ORDERED','PRE_INSPECTING','READY','SHIPPED','DELIVERED','RETURN_INSPECTING','REFUNDED',
    'PRE_INSPECT_ISSUE','MISDELIVERED','RETURN_ISSUE'
  ));

-- 기존에 옛 값으로 저장된 행이 있다면(개발 중 시드 등) 새 값으로 옮겨준다.
update payment_order set fulfillment_status = 'ORDERED' where fulfillment_status = 'PREPARING';
update payment_order set fulfillment_status = 'RETURN_INSPECTING' where fulfillment_status = 'INSPECTING';
update payment_order set fulfillment_status = 'DELIVERED' where fulfillment_status = 'PICKUP';

alter table payment_order alter column fulfillment_status set default 'ORDERED';
