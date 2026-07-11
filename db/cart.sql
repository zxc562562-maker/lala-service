-- =============================================================
--  장바구니(cart) — 로그인 계정(customer)에 귀속, 여러 기기 공유
--  예약일/반납일은 장바구니가 아니라 "예약 확정(체크아웃)" 시점에 선택.
--  실행 순서: schema.sql → seed.sql → auth.sql → cart.sql
-- =============================================================

create table if not exists cart_item (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customer(id) on delete cascade,
  product_id   uuid not null references product(id)  on delete cascade,
  created_at   timestamptz not null default now(),
  unique (customer_id, product_id)   -- 같은 상품 중복 담기 방지
);

create index if not exists cart_item_customer_idx on cart_item(customer_id);

-- RLS: 본인(customer) 장바구니만 접근
alter table cart_item enable row level security;

drop policy if exists "own cart select" on cart_item;
create policy "own cart select" on cart_item for select
  using (customer_id in (select id from customer where auth_user_id = auth.uid()));

drop policy if exists "own cart modify" on cart_item;
create policy "own cart modify" on cart_item for all
  using      (customer_id in (select id from customer where auth_user_id = auth.uid()))
  with check (customer_id in (select id from customer where auth_user_id = auth.uid()));
