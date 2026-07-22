-- 즐겨찾기/기본 배송지로 저장한 주소를 불러올 때도 우편번호가 유지되도록 저장한다.
alter table delivery_address_book add column if not exists zonecode text;
