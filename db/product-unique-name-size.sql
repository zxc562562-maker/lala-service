-- =============================================================
--  product(name, size) 조합에 유니크 제약 추가.
--  seed.sql의 상품 INSERT가 "on conflict do nothing"(대상 지정 없음)을 쓰는데,
--  이 제약이 없으면 걸릴 대상 자체가 없어 seed.sql을 두 번 실행하면 상품이 그대로 중복 생성됨
--  (실제로 겪은 문제 — 사이즈 선택 UI에서 React key 중복 경고로 발견됨).
--  실행 순서: ... → db/fulfillment-status-v2.sql → db/product-unique-name-size.sql
-- =============================================================

-- 기존 설치본에 이미 중복 상품이 있다면 제약 추가 자체가 실패하므로,
-- 먼저 생성된 행을 "대표"로 삼아 나중 생긴 중복 행의 재고/장바구니 참조를 대표로 옮긴 뒤 삭제한다.
do $$
declare
  r record;
  keeper uuid;
begin
  for r in
    select name, size, min(created_at) as first_created
    from product
    group by name, size
    having count(*) > 1
  loop
    select id into keeper from product where name = r.name and size = r.size and created_at = r.first_created limit 1;

    update inventory_item set product_id = keeper
    where product_id in (select id from product where name = r.name and size = r.size and id <> keeper);

    -- cart_item은 (customer_id, product_id) 유니크라, 대표 상품이 이미 그 고객 장바구니에 있으면 중복 행만 지우고 나머진 대표로 옮긴다.
    delete from cart_item
    where product_id in (select id from product where name = r.name and size = r.size and id <> keeper)
      and customer_id in (select customer_id from cart_item where product_id = keeper);
    update cart_item set product_id = keeper
    where product_id in (select id from product where name = r.name and size = r.size and id <> keeper);

    delete from product where name = r.name and size = r.size and id <> keeper;
  end loop;
end $$;

alter table product drop constraint if exists product_name_size_unique;
alter table product add constraint product_name_size_unique unique (name, size);
