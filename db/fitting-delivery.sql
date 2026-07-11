-- =============================================================
--  가입 시 선택 입력: 피팅 정보 / 배송 정보
--  실행 순서: schema → seed → auth → cart → payments → roles → profile-fields → username-auth → fitting-delivery
-- =============================================================

-- 피팅 정보 (사이즈 참고용, 전부 선택)
alter table customer add column if not exists height_cm int;        -- 키 (cm)
alter table customer add column if not exists top_size text;        -- 상의 사이즈 (예: S, M, 66 등 자유 입력)
alter table customer add column if not exists waist_cm int;         -- 허리 (cm)
alter table customer add column if not exists shoe_size text;       -- 구두 사이즈 (예: 245)

-- 배송 정보 (전부 선택)
alter table customer add column if not exists delivery_address text;   -- 배송 장소 주소
alter table customer add column if not exists workplace text;          -- 근무지
alter table customer add column if not exists delivery_phone text;     -- 배송 관련 연락처 (계정 연락처와 별도일 수 있음)
alter table customer add column if not exists return_address text;     -- 회수 장소 주소
alter table customer add column if not exists entrance_password text;  -- 공동현관 비밀번호
