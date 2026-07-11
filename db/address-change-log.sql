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
