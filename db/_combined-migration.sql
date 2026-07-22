-- ============================================================
-- FILE: db/schema.sql
-- ============================================================
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


-- ============================================================
-- FILE: db/seed.sql
-- ============================================================
-- ============================================================
--  Lala - 시드 데이터 (schema.sql 실행 후 실행)
-- ============================================================

-- 상품(스타일별 여러 사이즈) — 렌탈 서비스라 "재고가 있는 사이즈"만 실제로 대여 가능해야 하므로,
-- 사이즈 중 일부는 의도적으로 재고(inventory_item)를 아예 만들지 않아 "품절(대여 불가)" 데모로 사용한다.
insert into product (name, brand, category, size, daily_price, deposit, color_1, color_2) values
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'S',    48000, 150000, '#3B2230', '#6B2737'),
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'M',    48000, 150000, '#3B2230', '#6B2737'),
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'L',    48000, 150000, '#3B2230', '#6B2737'),
  ('벨벳 블레이저',        'Lala Atelier',   '자켓',     'S',    52000, 170000, '#26303F', '#3C5170'),
  ('벨벳 블레이저',        'Lala Atelier',   '자켓',     'M',    52000, 170000, '#26303F', '#3C5170'),
  ('실크 블라우스',        'Maison Lune',  '블라우스', 'S',    32000,  90000, '#7A6B4F', '#B89B6B'),
  ('실크 블라우스',        'Maison Lune',  '블라우스', 'M',    32000,  90000, '#7A6B4F', '#B89B6B'),
  ('플리츠 미디 스커트',   'Lala Atelier', '치마',     'S',    30000,  80000, '#3E4F45', '#4F6B5E'),
  ('플리츠 미디 스커트',   'Lala Atelier', '치마',     'M',    30000,  80000, '#3E4F45', '#4F6B5E'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '235',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '240',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '250',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('레더 핸드백',          'Lala Atelier',   '백',       'FREE', 40000, 200000, '#5A4A36', '#9A7B52')
on conflict do nothing;

-- 재고 개체(사이즈별 1벌) — 아래 목록에 없는 (이름, 사이즈) 조합은 재고가 없어 "품절(대여 불가)"로 표시된다.
--   품절 데모: 블랙 드레이프 원피스-L, 실크 블라우스-M, 플리츠 미디 스커트-S, 에나멜 하이힐-250
insert into inventory_item (product_id, barcode, status, condition)
select p.id, p.name || '-' || p.size || '-1', 'AVAILABLE', 95
from product p
where (p.name, p.size) in (
  ('블랙 드레이프 원피스', 'S'), ('블랙 드레이프 원피스', 'M'),
  ('벨벳 블레이저', 'S'), ('벨벳 블레이저', 'M'),
  ('실크 블라우스', 'S'),
  ('플리츠 미디 스커트', 'M'),
  ('에나멜 하이힐', '235'), ('에나멜 하이힐', '240'),
  ('레더 핸드백', 'FREE')
)
on conflict (barcode) do nothing;

-- 데모 고객 1명
insert into customer (name, phone) values ('데모 고객', '010-0000-0000')
on conflict (phone) do nothing;

-- 기존 예약 (대여중 기간) — 재고가 있는 사이즈 중 일부에 예약을 걸어 카트 달력 가용성 데모로 사용
insert into reservation (item_id, customer_id, checkout, return_date, status)
select i.id, c.id, v.checkout::date, v.return_date::date, 'ACTIVE'
from (values
  ('블랙 드레이프 원피스', 'M',    '2026-07-04', '2026-07-07'),
  ('블랙 드레이프 원피스', 'M',    '2026-07-19', '2026-07-22'),
  ('벨벳 블레이저',        'M',    '2026-07-11', '2026-07-14'),
  ('플리츠 미디 스커트',   'M',    '2026-07-08', '2026-07-10'),
  ('에나멜 하이힐',        '240',  '2026-07-15', '2026-07-18'),
  ('레더 핸드백',          'FREE', '2026-07-02', '2026-07-03'),
  ('레더 핸드백',          'FREE', '2026-07-25', '2026-07-28')
) as v(pname, psize, checkout, return_date)
join product p on p.name = v.pname and p.size = v.psize
join inventory_item i on i.product_id = p.id
cross join (select id from customer where phone = '010-0000-0000') c
on conflict on constraint no_double_booking do nothing;


-- ============================================================
-- FILE: db/auth.sql
-- ============================================================
-- ============================================================
--  Lala - 인증/RLS (schema.sql, seed.sql 다음에 실행)
-- ============================================================

-- 고객 ↔ Supabase Auth 사용자 연결
alter table customer add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
-- 이제 식별 기준은 auth_user_id. 전화번호 unique/not null 제약 완화
alter table customer alter column phone drop not null;
alter table customer drop constraint if exists customer_phone_key;

-- RLS 켜기 (secret 키 서버 접근은 RLS를 우회하므로 시드/예약처리엔 영향 없음)
alter table product        enable row level security;
alter table inventory_item enable row level security;
alter table customer       enable row level security;
alter table reservation    enable row level security;

-- 카탈로그는 누구나 읽기 가능
drop policy if exists "product public read" on product;
create policy "product public read" on product for select using (true);

drop policy if exists "item public read" on inventory_item;
create policy "item public read" on inventory_item for select using (true);

-- 고객은 "자기 자신"만 조회/수정
drop policy if exists "own customer select" on customer;
create policy "own customer select" on customer for select using (auth.uid() = auth_user_id);
drop policy if exists "own customer update" on customer;
create policy "own customer update" on customer for update using (auth.uid() = auth_user_id);

-- 예약은 "내 예약"만 조회 (생성은 서버가 secret 키로 처리)
drop policy if exists "own reservation select" on reservation;
create policy "own reservation select" on reservation for select
  using (customer_id in (select id from customer where auth_user_id = auth.uid()));

-- ============================================================
--  Supabase 대시보드에서 (개발 편의):
--   Authentication > Sign In / Providers > Email
--   → "Confirm email"을 끄면 가입 즉시 로그인 상태가 된다.
--   운영에선 켜두고 app/auth/confirm 라우트로 처리.
-- ============================================================


-- ============================================================
-- FILE: db/cart.sql
-- ============================================================
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


-- ============================================================
-- FILE: db/payments.sql
-- ============================================================
-- =============================================================
--  결제 주문(payment_order) — 토스페이먼츠 결제/승인 추적
--  실행 순서: schema → seed → auth → cart → payments
-- =============================================================
create table if not exists payment_order (
  id           text primary key,                 -- orderId (앱에서 생성)
  customer_id  uuid not null references customer(id) on delete cascade,
  checkout     date not null,
  return_date  date not null,
  days         int  not null,
  amount       int  not null,                     -- 결제 금액(렌탈비용+보증금)
  status       text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED')),
  payment_key  text,
  -- 분쟁(고객 이의제기 등): 결제/이행 상태와 별개로 추적. 분쟁 중에는 탈퇴 불가.
  disputed        boolean not null default false,
  dispute_reason  text,
  dispute_opened_at    timestamptz,
  dispute_resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists payment_order_customer_idx on payment_order(customer_id);

-- 기존에 테이블이 이미 있던 경우를 대비한 멱등 보강
alter table payment_order add column if not exists disputed boolean not null default false;
alter table payment_order add column if not exists dispute_reason text;
alter table payment_order add column if not exists dispute_opened_at timestamptz;
alter table payment_order add column if not exists dispute_resolved_at timestamptz;
create index if not exists payment_order_disputed_idx on payment_order(customer_id) where disputed and dispute_resolved_at is null;

alter table payment_order enable row level security;
drop policy if exists "own order select" on payment_order;
create policy "own order select" on payment_order for select
  using (customer_id in (select id from customer where auth_user_id = auth.uid()));
-- INSERT/UPDATE는 서버(secret 키, RLS 우회)에서만 수행


-- ============================================================
-- FILE: db/roles.sql
-- ============================================================
-- =============================================================
--  역할 + 승인제 가입 + RLS (고객/관리자/배송 공유 백엔드)
--  역할: director(디렉터) · supervisor(슈퍼바이저) = 전권,  delivery(배송기사),  그 외=member(이용자)
--  가입은 승인제: customer.status = pending → 디렉터/슈퍼바이저 승인 시 approved
--  실행 순서: schema → seed → auth → cart → payments → roles
-- =============================================================

-- 직원(staff): 전권(director/supervisor) 또는 배송(delivery)
create table if not exists staff (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('director','supervisor','delivery')),
  name         text,
  created_at   timestamptz not null default now()
);
-- 기존에 다른 체크로 만들어졌던 경우 대비
alter table staff drop constraint if exists staff_role_check;
alter table staff add constraint staff_role_check check (role in ('director','supervisor','delivery'));

create or replace function my_staff_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from staff where auth_user_id = auth.uid();
$$;
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where auth_user_id = auth.uid());
$$;
-- 승인 권한자(전권): 디렉터/슈퍼바이저
create or replace function is_approver() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where auth_user_id = auth.uid() and role in ('director','supervisor'));
$$;

alter table staff enable row level security;
drop policy if exists "staff self or admin read" on staff;
drop policy if exists "staff read" on staff;
create policy "staff read" on staff for select
  using (auth_user_id = auth.uid() or is_approver());

-- 승인제 가입: customer 에 상태 (pending/approved/withdrawn)
alter table customer add column if not exists status text not null default 'pending';
alter table customer drop constraint if exists customer_status_check;
alter table customer add constraint customer_status_check check (status in ('pending','approved','withdrawn'));

-- 기존 설치본 보강: address 컬럼 (schema.sql에 이미 있으면 무시됨)
alter table customer add column if not exists address text;

-- 고객 RLS: 본인 또는 직원 조회 / 상태변경은 승인권자만
alter table customer enable row level security;
drop policy if exists "customer read (self or staff)" on customer;
create policy "customer read (self or staff)" on customer for select
  using (auth_user_id = auth.uid() or is_staff());
drop policy if exists "customer approve (approver)" on customer;
create policy "customer approve (approver)" on customer for update
  using (is_approver()) with check (is_approver());

-- 주문 이행상태 + 배송 담당자
alter table payment_order
  add column if not exists fulfillment_status text not null default 'PREPARING'
    check (fulfillment_status in ('PREPARING','SHIPPED','DELIVERED','PICKUP','INSPECTING','REFUNDED')),
  add column if not exists assigned_to uuid references staff(auth_user_id);

drop policy if exists "own order select" on payment_order;
drop policy if exists "order select (own or staff)" on payment_order;
create policy "order select (own or staff)" on payment_order for select
  using (
    customer_id in (select id from customer where auth_user_id = auth.uid())
    or is_staff()
  );

-- 이행상태 UPDATE: 디렉터/슈퍼바이저=전체, 배송기사=본인 배정분
drop policy if exists "order update (staff)" on payment_order;
create policy "order update (staff)" on payment_order for update
  using (is_approver() or (my_staff_role() = 'delivery' and assigned_to = auth.uid()))
  with check (is_approver() or (my_staff_role() = 'delivery' and assigned_to = auth.uid()));

-- 실시간(Realtime)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='payment_order') then
    alter publication supabase_realtime add table payment_order; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reservation') then
    alter publication supabase_realtime add table reservation; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='customer') then
    alter publication supabase_realtime add table customer; end if;
end $$;

-- 직원 계정 만들기(예): 앱에서 회원가입 후, 그 auth id로
--   insert into staff(auth_user_id, role, name) values ('<UUID>','director','562');   -- 또는 'supervisor' / 'delivery'


-- ============================================================
-- FILE: db/profile-fields.sql
-- ============================================================
-- =============================================================
--  가입 폼 확장: 비밀번호 확인은 클라이언트에서만 검증(저장 대상 아님).
--  약관 동의(필수) 기록, 마케팅 수신 동의(선택), 생년월일/성별(선택)
--  실행 순서: schema → seed → auth → cart → payments → roles → profile-fields
-- =============================================================

alter table customer add column if not exists marketing_consent boolean not null default false;
alter table customer add column if not exists terms_agreed_at timestamptz;
alter table customer add column if not exists birth_date date;
alter table customer add column if not exists gender text;

alter table customer drop constraint if exists customer_gender_check;
alter table customer add constraint customer_gender_check check (gender is null or gender in ('M','F','N'));


-- ============================================================
-- FILE: db/username-auth.sql
-- ============================================================
-- =============================================================
--  ID 기반 로그인: customer.username 추가
--  Supabase Auth 자체는 이메일 기반이라(내부적으로 가상 이메일 사용),
--  화면/조회에 쓰는 실제 식별자는 이 username 컬럼이다.
--  실행 순서: schema → seed → auth → cart → payments → roles → profile-fields → username-auth
-- =============================================================

alter table customer add column if not exists username text;

-- 대소문자 구분 없이 유니크 (아래 unique index가 사실상의 제약)
create unique index if not exists customer_username_unique on customer (lower(username));

-- ⚠️ 중요: Supabase 대시보드에서 Authentication > Sign In / Providers > Email
--   → "Confirm email"을 반드시 꺼두어야 한다. ID 로그인은 가상 이메일
--   (users.lala.internal)을 쓰므로 실제 확인 메일을 받을 수 없다.


-- ============================================================
-- FILE: db/fitting-delivery.sql
-- ============================================================
-- =============================================================
--  가입 시 선택 입력: 피팅 정보 / 배송 정보
--  실행 순서: schema → seed → auth → cart → payments → roles → profile-fields → username-auth → fitting-delivery
-- =============================================================

-- 피팅 정보 (사이즈 참고용, 전부 선택)
alter table customer add column if not exists height_cm int;        -- 키 (cm)
alter table customer add column if not exists top_size text;        -- 상의 사이즈 (예: S, M, 66 등 자유 입력)
alter table customer add column if not exists waist_cm int;         -- 허리 (cm)
alter table customer add column if not exists shoe_size text;       -- 구두 사이즈 (예: 245)

-- 배송 정보 (전부 선택)
alter table customer add column if not exists delivery_address text;   -- 배송 장소 주소
alter table customer add column if not exists workplace text;          -- 근무지
alter table customer add column if not exists delivery_phone text;     -- 배송 관련 연락처 (계정 연락처와 별도일 수 있음)
alter table customer add column if not exists return_address text;     -- 회수 장소 주소
alter table customer add column if not exists entrance_password text;  -- 공동현관 비밀번호


-- ============================================================
-- FILE: db/address-detail.sql
-- ============================================================
-- =============================================================
--  배송/회수 장소의 세부 주소(건물명, 호수 등)
--  실행 순서: ... → db/fitting-delivery.sql → db/address-detail.sql
-- =============================================================

alter table customer add column if not exists delivery_detail_address text;
alter table customer add column if not exists return_detail_address text;


-- ============================================================
-- FILE: db/jibun-address.sql
-- ============================================================
-- =============================================================
--  지번 주소도 도로명 주소와 함께 실제로 저장 (배송 시 활용)
--  실행 순서: ... → db/address-detail.sql → db/jibun-address.sql
-- =============================================================

alter table customer add column if not exists address_jibun text;           -- 내 정보(주소)의 지번 주소
alter table customer add column if not exists delivery_jibun_address text;  -- 배송 장소의 지번 주소
alter table customer add column if not exists return_jibun_address text;    -- 회수 장소의 지번 주소


-- ============================================================
-- FILE: db/entrance-password.sql
-- ============================================================
-- =============================================================
--  회수 장소의 공동현관 비밀번호 (배송 장소와 동일 체크 시 그 값을 그대로 사용)
--  실행 순서: ... → db/jibun-address.sql → db/entrance-password.sql
-- =============================================================

alter table customer add column if not exists return_entrance_password text;
-- 기존 entrance_password 컬럼은 이제 "배송 장소"의 공동현관 비밀번호를 의미한다.


-- ============================================================
-- FILE: db/membership-fee.sql
-- ============================================================
-- =============================================================
--  멤버십 가입비 (일회성 100,000원) — 결제해야 승인 대기로 진입
--  실행 순서: ... → db/entrance-password.sql → db/membership-fee.sql
-- =============================================================

-- customer.status 흐름: unpaid(가입비 미결제) → pending(결제완료, 승인대기) → approved / withdrawn
alter table customer alter column status drop default;
alter table customer alter column status set default 'unpaid';
alter table customer drop constraint if exists customer_status_check;
alter table customer add constraint customer_status_check check (status in ('unpaid','pending','approved','withdrawn'));

create table if not exists membership_payment (
  id           text primary key,                 -- orderId
  customer_id  uuid not null references customer(id) on delete cascade,
  amount       int  not null,
  status       text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED')),
  payment_key  text,
  created_at   timestamptz not null default now()
);
create index if not exists membership_payment_customer_idx on membership_payment(customer_id);

alter table membership_payment enable row level security;
drop policy if exists "own membership payment select" on membership_payment;
create policy "own membership payment select" on membership_payment for select
  using (customer_id in (select id from customer where auth_user_id = auth.uid()));
-- INSERT/UPDATE는 서버(secret 키)에서만


-- ============================================================
-- FILE: db/push-subscriptions.sql
-- ============================================================
-- =============================================================
--  웹 푸시 구독 저장 (필수/거래 알림용 — 마케팅 동의와는 별개)
--  실행 순서: ... → db/membership-fee.sql → db/push-subscriptions.sql
-- =============================================================

create table if not exists push_subscription (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customer(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists push_subscription_customer_idx on push_subscription(customer_id);

alter table push_subscription enable row level security;
drop policy if exists "own push subscription" on push_subscription;
create policy "own push subscription" on push_subscription for all
  using      (customer_id in (select id from customer where auth_user_id = auth.uid()))
  with check (customer_id in (select id from customer where auth_user_id = auth.uid()));


-- ============================================================
-- FILE: db/phone-verify-limit.sql
-- ============================================================
-- =============================================================
--  휴대폰 인증 어뷰징 방지: 1개 번호당 하루 인증 시도 5회 제한
--  실행 순서: ... → db/push-subscriptions.sql → db/phone-verify-limit.sql
--  ※ 벤더(포트원 등) 무관하게 동작하는 백엔드 가드. "인증요청" 클릭마다 1회로 카운트.
-- =============================================================

create table if not exists phone_verify_attempt (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists phone_verify_attempt_phone_idx on phone_verify_attempt (phone, attempted_at);

-- 오래된 기록은 주기적으로 정리(선택, 운영 시 cron으로 실행 권장)
-- delete from phone_verify_attempt where attempted_at < now() - interval '7 days';


-- ============================================================
-- FILE: db/marketing-broadcast.sql
-- ============================================================
-- =============================================================
--  마케팅 알림 발송 이력 (선택 동의자 대상, 관리자가 직접 작성해 발송)
--  실행 순서: ... → db/phone-verify-limit.sql → db/marketing-broadcast.sql
-- =============================================================

create table if not exists marketing_broadcast (
  id               uuid primary key default gen_random_uuid(),
  category         text not null check (category in ('lookbook', 'promotion', 'season')),
  title            text not null,
  body             text not null,
  sent_by          uuid references staff(auth_user_id),
  recipient_count  int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists marketing_broadcast_created_idx on marketing_broadcast(created_at desc);

alter table marketing_broadcast enable row level security;
drop policy if exists "staff read broadcasts" on marketing_broadcast;
create policy "staff read broadcasts" on marketing_broadcast for select
  using (is_staff());
-- INSERT는 서버(secret 키)에서만, 디렉터/슈퍼바이저 권한 체크 후


-- ============================================================
-- FILE: db/marketing-compliance.sql
-- ============================================================
-- =============================================================
--  마케팅 알림 보완: 동의 시각 기록 + 발송 대상자 개별 로그
--  실행 순서: ... → db/marketing-broadcast.sql → db/marketing-compliance.sql
-- =============================================================

-- 마케팅 동의 시각 (동의/철회 시점 추적, 재동의 요구·분쟁 대응용)
alter table customer add column if not exists marketing_consent_at timestamptz;

-- 발송 대상자 개별 로그 (감사·CS 대응용: "이 알림 못 받았어요" 문의에 답할 수 있게)
create table if not exists marketing_broadcast_recipient (
  broadcast_id  uuid not null references marketing_broadcast(id) on delete cascade,
  customer_id   uuid not null references customer(id) on delete cascade,
  primary key (broadcast_id, customer_id)
);
create index if not exists marketing_recipient_customer_idx on marketing_broadcast_recipient(customer_id);

alter table marketing_broadcast_recipient enable row level security;
drop policy if exists "own broadcast receipt" on marketing_broadcast_recipient;
create policy "own broadcast receipt" on marketing_broadcast_recipient for select
  using (
    customer_id in (select id from customer where auth_user_id = auth.uid())
    or is_staff()
  );


-- ============================================================
-- FILE: db/marketing-schedule.sql
-- ============================================================
-- =============================================================
--  마케팅 알림 예약 발송
--  실행 순서: ... → db/marketing-compliance.sql → db/marketing-schedule.sql
-- =============================================================

alter table marketing_broadcast add column if not exists status text not null default 'sent'
  check (status in ('scheduled','sent','cancelled','failed'));
alter table marketing_broadcast add column if not exists scheduled_at timestamptz;
alter table marketing_broadcast add column if not exists sent_at timestamptz;

-- 이 컬럼들이 생기기 전에 만들어진 기존 발송 기록(있다면) 보정: 즉시 발송된 것으로 간주
update marketing_broadcast set sent_at = created_at where sent_at is null and status = 'sent';
update marketing_broadcast set scheduled_at = created_at where scheduled_at is null;

create index if not exists marketing_broadcast_due_idx on marketing_broadcast (status, scheduled_at);


-- ============================================================
-- FILE: db/marketing-granular-consent.sql
-- ============================================================
-- =============================================================
--  1) 마케팅 카테고리 교체: '시즌 추천 룩'(season) → '데일리 코디 추천'(daily)
--  2) 마케팅 동의를 카테고리별로 세분화 (룩북/프로모션/데일리 각각 별도 동의)
--  실행 순서: ... → db/marketing-schedule.sql → db/marketing-granular-consent.sql
-- =============================================================

-- 1) 카테고리 교체
update marketing_broadcast set category = 'daily' where category = 'season';
alter table marketing_broadcast drop constraint if exists marketing_broadcast_category_check;
alter table marketing_broadcast add constraint marketing_broadcast_category_check
  check (category in ('lookbook', 'promotion', 'daily'));

-- 2) 카테고리별 세분화 동의 (+ 각각 동의 시각)
alter table customer add column if not exists marketing_lookbook_consent boolean not null default false;
alter table customer add column if not exists marketing_lookbook_consent_at timestamptz;
alter table customer add column if not exists marketing_promotion_consent boolean not null default false;
alter table customer add column if not exists marketing_promotion_consent_at timestamptz;
alter table customer add column if not exists marketing_daily_consent boolean not null default false;
alter table customer add column if not exists marketing_daily_consent_at timestamptz;

-- 기존에 (분리 이전) marketing_consent=true 였던 회원은 세 항목 모두 동의한 것으로 이관(동의 유실 방지)
update customer
set marketing_lookbook_consent = true, marketing_lookbook_consent_at = coalesce(marketing_consent_at, now()),
    marketing_promotion_consent = true, marketing_promotion_consent_at = coalesce(marketing_consent_at, now()),
    marketing_daily_consent = true, marketing_daily_consent_at = coalesce(marketing_consent_at, now())
where marketing_consent = true
  and marketing_lookbook_consent = false and marketing_promotion_consent = false and marketing_daily_consent = false;

-- 참고: 기존 marketing_consent / marketing_consent_at 컬럼은 이제 더 이상 소스로 사용하지 않음(레거시로 보존, 삭제하지 않음).


-- ============================================================
-- FILE: db/address-change-log.sql
-- ============================================================
-- =============================================================
--  배송지·회수지·근무지 정보는 수시로 바뀔 수 있어 변경 이력을 남긴다.
--  (일반 "주소"(customer.address) 필드는 가입 시 입력란 자체가 없어 사용된 적이 없으므로 대상에서 제외)
--  실행 순서: ... → db/marketing-granular-consent.sql → db/address-change-log.sql
-- =============================================================

create table if not exists address_change_log (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customer(id) on delete cascade,
  field        text not null,   -- 예: delivery_address, return_address, workplace 등
  field_label  text not null,   -- 관리자 화면 표시용 한글 라벨 (예: "배송지 주소")
  old_value    text,
  new_value    text,
  changed_at   timestamptz not null default now()
);
create index if not exists address_change_log_customer_idx on address_change_log(customer_id, changed_at desc);
create index if not exists address_change_log_changed_idx on address_change_log(changed_at desc);

alter table address_change_log enable row level security;
drop policy if exists "staff read address changes" on address_change_log;
create policy "staff read address changes" on address_change_log for select
  using (is_staff());
-- INSERT는 서버(secret 키)에서 updateProfile 실행 시에만 수행됨

-- 실시간 조회(Supabase Realtime)를 위해 publication에 포함
alter publication supabase_realtime add table address_change_log;


-- ============================================================
-- FILE: db/reservation-order-link.sql
-- ============================================================
-- =============================================================
--  예약(reservation)을 실제 주문(payment_order)과 직접 연결.
--  기존엔 (고객, 예약일, 반납일)이 같으면 같은 주문으로 "추정"했는데,
--  하루에 같은 기간으로 두 번 결제하는 경우 서로 다른 주문이 섞여 보이는 문제가 있어 FK로 명확히 함.
--  실행 순서: ... → db/address-change-log.sql → db/reservation-order-link.sql
-- =============================================================

alter table reservation add column if not exists payment_order_id text references payment_order(id);
create index if not exists idx_resv_order on reservation(payment_order_id);

-- 참고: 이 컬럼 추가 이전에 생성된 기존 예약은 payment_order_id가 NULL로 남는다.
-- 회원용 렌탈기록 화면은 이 경우 예약일/반납일 기준으로 묶는 기존 방식으로 대체 표시한다.


-- ============================================================
-- FILE: db/fulfillment-status-v2.sql
-- ============================================================
-- =============================================================
--  주문 이행 상태(fulfillment_status)를 7단계 정상 흐름 + 3개 문제 분기로 확장.
--  기존 6개 값(PREPARING/SHIPPED/DELIVERED/PICKUP/INSPECTING/REFUNDED)을
--  더 세분화된 값으로 교체(선주문 검수/배송대기 단계 신설, 반납검수 명확화).
--
--  정상 흐름: ORDERED(주문결제) → PRE_INSPECTING(주문검수중) → READY(배송대기중)
--            → SHIPPED(배송중) → DELIVERED(배송완료) → RETURN_INSPECTING(수거검수중)
--            → REFUNDED(완료)
--  문제 분기: PRE_INSPECT_ISSUE(주문검수중 오염/손상 발견)
--            MISDELIVERED(배송중 오배송)
--            RETURN_ISSUE(수거검수중 오염/손상 발견)
--
--  실행 순서: ... → db/reservation-order-link.sql → db/fulfillment-status-v2.sql
-- =============================================================

-- 옛 제약(6개 값)부터 먼저 제거해야 아래 UPDATE가 새 값(예: 'ORDERED')을 넣을 수 있음.
-- (제약을 먼저 새로 걸면 기존 행이 아직 옛 값을 갖고 있어 제약 추가 자체가 거부됨 — 실제로 겪은 순서 버그)
alter table payment_order drop constraint if exists payment_order_fulfillment_status_check;

-- 기존에 옛 값으로 저장된 행이 있다면(개발 중 시드 등) 새 값으로 옮겨준다.
update payment_order set fulfillment_status = 'ORDERED' where fulfillment_status = 'PREPARING';
update payment_order set fulfillment_status = 'RETURN_INSPECTING' where fulfillment_status = 'INSPECTING';
update payment_order set fulfillment_status = 'DELIVERED' where fulfillment_status = 'PICKUP';

-- 모든 행이 새 값으로 정리된 뒤에 새 제약(10개 값)을 건다.
alter table payment_order add constraint payment_order_fulfillment_status_check
  check (fulfillment_status in (
    'ORDERED','PRE_INSPECTING','READY','SHIPPED','DELIVERED','RETURN_INSPECTING','REFUNDED',
    'PRE_INSPECT_ISSUE','MISDELIVERED','RETURN_ISSUE'
  ));

alter table payment_order alter column fulfillment_status set default 'ORDERED';


-- ============================================================
-- FILE: db/product-unique-name-size.sql
-- ============================================================
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


-- ============================================================
-- FILE: db/store-pickup-return.sql
-- ============================================================
-- =============================================================
--  배송/회수 대신 "직접 매장 픽업" / "직접 매장 회수" 옵션 토글
--  실행 순서: ... → db/product-unique-name-size.sql → db/store-pickup-return.sql
-- =============================================================

alter table customer add column if not exists delivery_in_store boolean not null default false; -- 배송 대신 매장에서 직접 픽업
alter table customer add column if not exists return_in_store boolean not null default false;    -- 회수 대신 매장에 직접 반납


-- ============================================================
-- FILE: db/delivery-time-slot.sql
-- ============================================================
-- 배송 시간대. 지금은 "오후 3시~8시" 한 종류뿐이라 값의 종류를 강제하는 check 제약은 걸지 않음
-- (lib/delivery.ts의 DELIVERY_SLOTS가 나중에 늘어나도 매번 마이그레이션할 필요 없게, 검증은 앱 레이어에서)
alter table payment_order
  add column if not exists delivery_slot text;


-- ============================================================
-- FILE: db/store-closures.sql
-- ============================================================
-- 관리자(디렉터/슈퍼바이저)가 지정하는 임시 휴무일(휴가 기간 등). 법정 공휴일은 lib/holidays.ts에
-- 코드로 관리하고, 이 테이블은 그 외 사내 사정으로 추가되는 휴무일만 담는다.
create table if not exists store_closure (
  date       date primary key,
  reason     text,
  created_by uuid references staff(auth_user_id),
  created_at timestamptz not null default now()
);


-- ============================================================
-- FILE: db/reservation-item-issue.sql
-- ============================================================
-- 주문검수/수거검수 중 오염·손상이 발견됐을 때, 여러 상품이 담긴 주문에서도 "어느 상품"이
-- 문제인지 관리자가 특정 지정할 수 있게 함(회원 상세 페이지에서 해당 상품에만 안내 문구 표시).
alter table reservation
  add column if not exists has_issue boolean not null default false;


-- ============================================================
-- FILE: db/drop-fitting-info.sql
-- ============================================================
-- 앞으로 안 쓰기로 한 사이즈(피팅) 정보 — UI는 이미 제거됨, 컬럼과 기존 데이터도 완전히 삭제.
alter table customer
  drop column if exists height_cm,
  drop column if exists top_size,
  drop column if exists waist_cm,
  drop column if exists shoe_size;


-- ============================================================
-- FILE: db/address-book.sql
-- ============================================================
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


