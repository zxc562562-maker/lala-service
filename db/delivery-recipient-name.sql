-- 퀵배송·택배는 실제 주문자와 받는 사람이 다를 수 있어, 배송용 수취인 이름을 별도로 저장한다
-- (deliveryPhone과 동일한 패턴 — 지정 안 하면 회원 이름을 기본값으로 사용).
alter table customer add column if not exists delivery_recipient_name text;
