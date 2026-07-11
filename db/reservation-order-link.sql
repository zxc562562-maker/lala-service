-- =============================================================
--  예약(reservation)을 실제 주문(payment_order)과 직접 연결.
--  기존엔 (고객, 예약일, 반납일)이 같으면 같은 주문으로 "추정"했는데,
--  하루에 같은 기간으로 두 번 결제하는 경우 서로 다른 주문이 섞여 보이는 문제가 있어 FK로 명확히 함.
--  실행 순서: ... → db/address-change-log.sql → db/reservation-order-link.sql
-- =============================================================

alter table reservation add column if not exists payment_order_id text references payment_order(id);
create index if not exists idx_resv_order on reservation(payment_order_id);

-- 참고: 이 컬럼 추가 이전에 생성된 기존 예약은 payment_order_id가 NULL로 남는다.
-- 회원용 렌탈기록 화면은 이 경우 예약일/반납일 기준으로 묶는 기존 방식으로 대체 표시한다.
