-- 배송 시간대. 지금은 "오후 3시~8시" 한 종류뿐이라 값의 종류를 강제하는 check 제약은 걸지 않음
-- (lib/delivery.ts의 DELIVERY_SLOTS가 나중에 늘어나도 매번 마이그레이션할 필요 없게, 검증은 앱 레이어에서)
alter table payment_order
  add column if not exists delivery_slot text;
