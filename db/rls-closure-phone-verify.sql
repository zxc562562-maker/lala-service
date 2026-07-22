-- =============================================================
--  보안 감사에서 발견: store_closure, phone_verify_attempt 두 테이블에 RLS가 꺼져있었음.
--  둘 다 지금까지 앱 코드에서는 항상 service role(supabaseAdmin)로만 접근해왔지만,
--  RLS가 꺼져있으면 공개된 anon key로 Supabase REST API에 직접 요청해 우회 접근이 가능하므로
--  방어선을 하나 더 세운다.
--  실행 순서: ... → db/packaging-photo.sql → db/rls-closure-phone-verify.sql
-- =============================================================

-- store_closure: 휴무일 조회는 로그인 없이도 카트 캘린더에 필요(공개 정보라 문제 없음),
--                등록/수정/삭제는 디렉터·슈퍼바이저만.
alter table store_closure enable row level security;

drop policy if exists "anyone read store closure" on store_closure;
create policy "anyone read store closure" on store_closure for select
  using (true);

drop policy if exists "approver write store closure" on store_closure;
create policy "approver write store closure" on store_closure for insert
  with check (is_approver());

drop policy if exists "approver update store closure" on store_closure;
create policy "approver update store closure" on store_closure for update
  using (is_approver()) with check (is_approver());

drop policy if exists "approver delete store closure" on store_closure;
create policy "approver delete store closure" on store_closure for delete
  using (is_approver());

-- phone_verify_attempt: 순수 내부 어뷰징 방지 로그(전화번호 포함) — 클라이언트가 직접 읽거나 쓸 이유가
-- 전혀 없으므로, 정책을 하나도 만들지 않고 RLS만 켠다. service role(supabaseAdmin)은 RLS를 우회하므로
-- 기존 checkPhoneVerifyRateLimit 동작에는 영향 없음.
alter table phone_verify_attempt enable row level security;
