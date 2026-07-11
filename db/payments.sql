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
