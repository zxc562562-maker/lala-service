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
