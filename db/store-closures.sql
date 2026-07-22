-- 관리자(디렉터/슈퍼바이저)가 지정하는 임시 휴무일(휴가 기간 등). 법정 공휴일은 lib/holidays.ts에
-- 코드로 관리하고, 이 테이블은 그 외 사내 사정으로 추가되는 휴무일만 담는다.
create table if not exists store_closure (
  date       date primary key,
  reason     text,
  created_by uuid references staff(auth_user_id),
  created_at timestamptz not null default now()
);
