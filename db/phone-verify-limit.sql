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
