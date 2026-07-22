-- 패키징 완료 사진(누락 확인·회수 후 분실 분쟁 대응용 증빙).
-- 비공개(private) Storage 버킷에 저장하고, payment_order엔 오브젝트 경로만 저장한다.
-- 조회는 항상 서버(secret 키)에서 만료 있는 서명 URL(signed URL)을 발급해서 보여준다.
insert into storage.buckets (id, name, public)
values ('packaging-photos', 'packaging-photos', false)
on conflict (id) do nothing;

alter table payment_order add column if not exists packaging_photo_path text;
