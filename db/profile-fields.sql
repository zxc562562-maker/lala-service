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
