-- 택배 배송 시 정확한 주소 확인을 위해 자택 배송지의 우편번호를 함께 저장한다.
alter table customer add column if not exists delivery_zonecode text;
