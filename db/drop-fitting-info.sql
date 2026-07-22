-- 앞으로 안 쓰기로 한 사이즈(피팅) 정보 — UI는 이미 제거됨, 컬럼과 기존 데이터도 완전히 삭제.
alter table customer
  drop column if exists height_cm,
  drop column if exists top_size,
  drop column if exists waist_cm,
  drop column if exists shoe_size;
