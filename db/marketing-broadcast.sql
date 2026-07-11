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
