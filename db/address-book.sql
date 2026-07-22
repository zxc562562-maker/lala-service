-- =============================================================
--  배송 주소록 — 회원이 여러 배송 정보를 이름 붙여 저장해두고 골라 쓸 수 있게 한다.
--  customer.delivery_* 컬럼("현재 활성 배송 정보", 프로필/카트에 실제 반영된 값)과는 별개로,
--  재사용을 위한 "저장된 템플릿" 목록. 그중 하나를 기본 배송지(is_default)로 지정해두면,
--  아직 활성 배송 정보가 없는 회원이 배송 정보 입력 화면을 처음 열었을 때 자동으로 채워진다.
--  실행 순서: ... → db/drop-fitting-info.sql → db/address-book.sql
-- =============================================================

create table if not exists delivery_address_book (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references customer(id) on delete cascade,
  label              text not null,
  mode               text not null check (mode in ('home','workplace','pickup')),
  address            text,
  jibun_address      text,
  detail_address     text,
  entrance_password  text,
  workplace          text,
  phone              text,
  is_default         boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists delivery_address_book_customer_idx on delivery_address_book(customer_id);

-- RLS: 본인(customer) 주소록만 접근
alter table delivery_address_book enable row level security;

drop policy if exists "own address book" on delivery_address_book;
create policy "own address book" on delivery_address_book for all
  using      (customer_id in (select id from customer where auth_user_id = auth.uid()))
  with check (customer_id in (select id from customer where auth_user_id = auth.uid()));
