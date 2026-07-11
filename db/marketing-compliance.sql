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
