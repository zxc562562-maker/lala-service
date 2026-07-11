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
