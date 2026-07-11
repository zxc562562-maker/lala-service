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
