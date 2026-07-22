-- 주문검수/수거검수 중 오염·손상이 발견됐을 때, 여러 상품이 담긴 주문에서도 "어느 상품"이
-- 문제인지 관리자가 특정 지정할 수 있게 함(회원 상세 페이지에서 해당 상품에만 안내 문구 표시).
alter table reservation
  add column if not exists has_issue boolean not null default false;
