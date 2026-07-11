-- ============================================================
--  Lala - 스키마 (Supabase SQL Editor에 붙여넣어 실행)
--  1단계 schema.sql + 데모 스와치 색상 컬럼(color_1/2) 추가본
-- ============================================================

create extension if not exists btree_gist;

-- ---- 상품 ----
create table if not exists product (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text,
  category    text not null,
  size        text not null,
  daily_price integer not null,
  deposit     integer not null default 0,
  image_url   text,                 -- 실제 서비스용 (지금은 비워둠)
  color_1     text,                 -- 데모 스와치 (어두운 쪽)
  color_2     text,                 -- 데모 스와치 (밝은 쪽)
  created_at  timestamptz not null default now()
);

-- ---- 재고 개체 ----
do $$ begin
  create type item_status as enum
    ('AVAILABLE','RESERVED','RENTED','RETURNED','CLEANING','INSPECTING','REPAIRING','RETIRED');
exception when duplicate_object then null; end $$;

create table if not exists inventory_item (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references product(id) on delete cascade,
  barcode      text unique,
  status       item_status not null default 'AVAILABLE',
  condition    smallint not null default 100 check (condition between 0 and 100),
  rental_count integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_item_product on inventory_item (product_id, status);

-- ---- 고객 ----
create table if not exists customer (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null unique,
  address    text,
  created_at timestamptz not null default now()
);

-- ---- 예약 ----
do $$ begin
  create type reservation_status as enum ('ACTIVE','CANCELLED','COMPLETED');
exception when duplicate_object then null; end $$;

create table if not exists reservation (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references inventory_item(id),
  customer_id uuid not null references customer(id),
  checkout    date not null,
  return_date date not null,
  status      reservation_status not null default 'ACTIVE',

  -- 실제 점유 구간 = [checkout, 반납일 + 세탁버퍼(1일)). 앱의 buffer=1과 일치.
  occupied_range daterange generated always as (
    daterange(checkout, (return_date + interval '1 day')::date + 1, '[)')
  ) stored,

  created_at  timestamptz not null default now(),
  check (return_date >= checkout),

  -- ★ 같은 개체에 겹치는 ACTIVE 예약 금지 → 중복 대여를 DB가 원천 차단
  constraint no_double_booking
    exclude using gist (item_id with =, occupied_range with &&)
    where (status = 'ACTIVE')
);
create index if not exists idx_resv_item on reservation (item_id, status);

-- ============================================================
--  참고: 지금은 앱이 secret 키(서버 전용)로만 접근하므로 RLS 없이도 안전하다.
--  나중에 고객 로그인을 붙이면, publishable 키 + RLS 정책으로 전환할 것.
-- ============================================================
