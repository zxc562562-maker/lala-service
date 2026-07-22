-- 배송 방법(직배송/퀵배송/택배) 선택 기능: 주문에 실제 선택값을 기록하고,
-- 고객이 마지막으로 고른 방법을 기억해뒀다가 다음 주문 때 기본값으로 불러온다.
alter table payment_order add column if not exists delivery_method text;
alter table customer add column if not exists preferred_delivery_method text;
