-- =============================================================
--  배송/회수 장소의 세부 주소(건물명, 호수 등)
--  실행 순서: ... → db/fitting-delivery.sql → db/address-detail.sql
-- =============================================================

alter table customer add column if not exists delivery_detail_address text;
alter table customer add column if not exists return_detail_address text;
