-- =============================================================
--  ID 기반 로그인: customer.username 추가
--  Supabase Auth 자체는 이메일 기반이라(내부적으로 가상 이메일 사용),
--  화면/조회에 쓰는 실제 식별자는 이 username 컬럼이다.
--  실행 순서: schema → seed → auth → cart → payments → roles → profile-fields → username-auth
-- =============================================================

alter table customer add column if not exists username text;

-- 대소문자 구분 없이 유니크 (아래 unique index가 사실상의 제약)
create unique index if not exists customer_username_unique on customer (lower(username));

-- ⚠️ 중요: Supabase 대시보드에서 Authentication > Sign In / Providers > Email
--   → "Confirm email"을 반드시 꺼두어야 한다. ID 로그인은 가상 이메일
--   (users.lala.internal)을 쓰므로 실제 확인 메일을 받을 수 없다.
