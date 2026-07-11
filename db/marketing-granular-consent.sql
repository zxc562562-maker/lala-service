-- =============================================================
--  1) 마케팅 카테고리 교체: '시즌 추천 룩'(season) → '데일리 코디 추천'(daily)
--  2) 마케팅 동의를 카테고리별로 세분화 (룩북/프로모션/데일리 각각 별도 동의)
--  실행 순서: ... → db/marketing-schedule.sql → db/marketing-granular-consent.sql
-- =============================================================

-- 1) 카테고리 교체
update marketing_broadcast set category = 'daily' where category = 'season';
alter table marketing_broadcast drop constraint if exists marketing_broadcast_category_check;
alter table marketing_broadcast add constraint marketing_broadcast_category_check
  check (category in ('lookbook', 'promotion', 'daily'));

-- 2) 카테고리별 세분화 동의 (+ 각각 동의 시각)
alter table customer add column if not exists marketing_lookbook_consent boolean not null default false;
alter table customer add column if not exists marketing_lookbook_consent_at timestamptz;
alter table customer add column if not exists marketing_promotion_consent boolean not null default false;
alter table customer add column if not exists marketing_promotion_consent_at timestamptz;
alter table customer add column if not exists marketing_daily_consent boolean not null default false;
alter table customer add column if not exists marketing_daily_consent_at timestamptz;

-- 기존에 (분리 이전) marketing_consent=true 였던 회원은 세 항목 모두 동의한 것으로 이관(동의 유실 방지)
update customer
set marketing_lookbook_consent = true, marketing_lookbook_consent_at = coalesce(marketing_consent_at, now()),
    marketing_promotion_consent = true, marketing_promotion_consent_at = coalesce(marketing_consent_at, now()),
    marketing_daily_consent = true, marketing_daily_consent_at = coalesce(marketing_consent_at, now())
where marketing_consent = true
  and marketing_lookbook_consent = false and marketing_promotion_consent = false and marketing_daily_consent = false;

-- 참고: 기존 marketing_consent / marketing_consent_at 컬럼은 이제 더 이상 소스로 사용하지 않음(레거시로 보존, 삭제하지 않음).
