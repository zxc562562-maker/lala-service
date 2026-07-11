-- =============================================================
--  회수 장소의 공동현관 비밀번호 (배송 장소와 동일 체크 시 그 값을 그대로 사용)
--  실행 순서: ... → db/jibun-address.sql → db/entrance-password.sql
-- =============================================================

alter table customer add column if not exists return_entrance_password text;
-- 기존 entrance_password 컬럼은 이제 "배송 장소"의 공동현관 비밀번호를 의미한다.
