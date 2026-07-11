-- ============================================================
--  Lala - 인증/RLS (schema.sql, seed.sql 다음에 실행)
-- ============================================================

-- 고객 ↔ Supabase Auth 사용자 연결
alter table customer add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
-- 이제 식별 기준은 auth_user_id. 전화번호 unique/not null 제약 완화
alter table customer alter column phone drop not null;
alter table customer drop constraint if exists customer_phone_key;

-- RLS 켜기 (secret 키 서버 접근은 RLS를 우회하므로 시드/예약처리엔 영향 없음)
alter table product        enable row level security;
alter table inventory_item enable row level security;
alter table customer       enable row level security;
alter table reservation    enable row level security;

-- 카탈로그는 누구나 읽기 가능
drop policy if exists "product public read" on product;
create policy "product public read" on product for select using (true);

drop policy if exists "item public read" on inventory_item;
create policy "item public read" on inventory_item for select using (true);

-- 고객은 "자기 자신"만 조회/수정
drop policy if exists "own customer select" on customer;
create policy "own customer select" on customer for select using (auth.uid() = auth_user_id);
drop policy if exists "own customer update" on customer;
create policy "own customer update" on customer for update using (auth.uid() = auth_user_id);

-- 예약은 "내 예약"만 조회 (생성은 서버가 secret 키로 처리)
drop policy if exists "own reservation select" on reservation;
create policy "own reservation select" on reservation for select
  using (customer_id in (select id from customer where auth_user_id = auth.uid()));

-- ============================================================
--  Supabase 대시보드에서 (개발 편의):
--   Authentication > Sign In / Providers > Email
--   → "Confirm email"을 끄면 가입 즉시 로그인 상태가 된다.
--   운영에선 켜두고 app/auth/confirm 라우트로 처리.
-- ============================================================
