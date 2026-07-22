-- =============================================================
--  배송/회수 대신 "직접 매장 픽업" / "직접 매장 회수" 옵션 토글
--  실행 순서: ... → db/product-unique-name-size.sql → db/store-pickup-return.sql
-- =============================================================

alter table customer add column if not exists delivery_in_store boolean not null default false; -- 배송 대신 매장에서 직접 픽업
alter table customer add column if not exists return_in_store boolean not null default false;    -- 회수 대신 매장에 직접 반납
