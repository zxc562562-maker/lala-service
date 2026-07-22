-- 택배 반납접수요청 이후, 고객이 직접 입력하는 반납 발송 택배사·송장번호.
alter table payment_order add column if not exists return_courier text;
alter table payment_order add column if not exists return_tracking_number text;
