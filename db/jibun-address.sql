-- =============================================================
--  지번 주소도 도로명 주소와 함께 실제로 저장 (배송 시 활용)
--  실행 순서: ... → db/address-detail.sql → db/jibun-address.sql
-- =============================================================

alter table customer add column if not exists address_jibun text;           -- 내 정보(주소)의 지번 주소
alter table customer add column if not exists delivery_jibun_address text;  -- 배송 장소의 지번 주소
alter table customer add column if not exists return_jibun_address text;    -- 회수 장소의 지번 주소
