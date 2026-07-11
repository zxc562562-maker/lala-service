-- ============================================================
--  Lala - 시드 데이터 (schema.sql 실행 후 실행)
-- ============================================================

-- 상품(스타일별 여러 사이즈) — 렌탈 서비스라 "재고가 있는 사이즈"만 실제로 대여 가능해야 하므로,
-- 사이즈 중 일부는 의도적으로 재고(inventory_item)를 아예 만들지 않아 "품절(대여 불가)" 데모로 사용한다.
insert into product (name, brand, category, size, daily_price, deposit, color_1, color_2) values
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'S',    48000, 150000, '#3B2230', '#6B2737'),
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'M',    48000, 150000, '#3B2230', '#6B2737'),
  ('블랙 드레이프 원피스', 'Lala Atelier', '원피스',   'L',    48000, 150000, '#3B2230', '#6B2737'),
  ('벨벳 블레이저',        'Lala Atelier',   '자켓',     'S',    52000, 170000, '#26303F', '#3C5170'),
  ('벨벳 블레이저',        'Lala Atelier',   '자켓',     'M',    52000, 170000, '#26303F', '#3C5170'),
  ('실크 블라우스',        'Maison Lune',  '블라우스', 'S',    32000,  90000, '#7A6B4F', '#B89B6B'),
  ('실크 블라우스',        'Maison Lune',  '블라우스', 'M',    32000,  90000, '#7A6B4F', '#B89B6B'),
  ('플리츠 미디 스커트',   'Lala Atelier', '치마',     'S',    30000,  80000, '#3E4F45', '#4F6B5E'),
  ('플리츠 미디 스커트',   'Lala Atelier', '치마',     'M',    30000,  80000, '#3E4F45', '#4F6B5E'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '235',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '240',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('에나멜 하이힐',        'Maison Lune',  '구두',     '250',  26000,  70000, '#5A2A33', '#9A4A57'),
  ('레더 핸드백',          'Lala Atelier',   '백',       'FREE', 40000, 200000, '#5A4A36', '#9A7B52')
on conflict do nothing;

-- 재고 개체(사이즈별 1벌) — 아래 목록에 없는 (이름, 사이즈) 조합은 재고가 없어 "품절(대여 불가)"로 표시된다.
--   품절 데모: 블랙 드레이프 원피스-L, 실크 블라우스-M, 플리츠 미디 스커트-S, 에나멜 하이힐-250
insert into inventory_item (product_id, barcode, status, condition)
select p.id, p.name || '-' || p.size || '-1', 'AVAILABLE', 95
from product p
where (p.name, p.size) in (
  ('블랙 드레이프 원피스', 'S'), ('블랙 드레이프 원피스', 'M'),
  ('벨벳 블레이저', 'S'), ('벨벳 블레이저', 'M'),
  ('실크 블라우스', 'S'),
  ('플리츠 미디 스커트', 'M'),
  ('에나멜 하이힐', '235'), ('에나멜 하이힐', '240'),
  ('레더 핸드백', 'FREE')
)
on conflict (barcode) do nothing;

-- 데모 고객 1명
insert into customer (name, phone) values ('데모 고객', '010-0000-0000')
on conflict (phone) do nothing;

-- 기존 예약 (대여중 기간) — 재고가 있는 사이즈 중 일부에 예약을 걸어 카트 달력 가용성 데모로 사용
insert into reservation (item_id, customer_id, checkout, return_date, status)
select i.id, c.id, v.checkout::date, v.return_date::date, 'ACTIVE'
from (values
  ('블랙 드레이프 원피스', 'M',    '2026-07-04', '2026-07-07'),
  ('블랙 드레이프 원피스', 'M',    '2026-07-19', '2026-07-22'),
  ('벨벳 블레이저',        'M',    '2026-07-11', '2026-07-14'),
  ('플리츠 미디 스커트',   'M',    '2026-07-08', '2026-07-10'),
  ('에나멜 하이힐',        '240',  '2026-07-15', '2026-07-18'),
  ('레더 핸드백',          'FREE', '2026-07-02', '2026-07-03'),
  ('레더 핸드백',          'FREE', '2026-07-25', '2026-07-28')
) as v(pname, psize, checkout, return_date)
join product p on p.name = v.pname and p.size = v.psize
join inventory_item i on i.product_id = p.id
cross join (select id from customer where phone = '010-0000-0000') c
on conflict on constraint no_double_booking do nothing;
