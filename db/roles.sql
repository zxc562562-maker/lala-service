-- =============================================================
--  역할 + 승인제 가입 + RLS (고객/관리자/배송 공유 백엔드)
--  역할: director(디렉터) · supervisor(슈퍼바이저) = 전권,  delivery(배송기사),  그 외=member(이용자)
--  가입은 승인제: customer.status = pending → 디렉터/슈퍼바이저 승인 시 approved
--  실행 순서: schema → seed → auth → cart → payments → roles
-- =============================================================

-- 직원(staff): 전권(director/supervisor) 또는 배송(delivery)
create table if not exists staff (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('director','supervisor','delivery')),
  name         text,
  created_at   timestamptz not null default now()
);
-- 기존에 다른 체크로 만들어졌던 경우 대비
alter table staff drop constraint if exists staff_role_check;
alter table staff add constraint staff_role_check check (role in ('director','supervisor','delivery'));

create or replace function my_staff_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from staff where auth_user_id = auth.uid();
$$;
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where auth_user_id = auth.uid());
$$;
-- 승인 권한자(전권): 디렉터/슈퍼바이저
create or replace function is_approver() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where auth_user_id = auth.uid() and role in ('director','supervisor'));
$$;

alter table staff enable row level security;
drop policy if exists "staff self or admin read" on staff;
drop policy if exists "staff read" on staff;
create policy "staff read" on staff for select
  using (auth_user_id = auth.uid() or is_approver());

-- 승인제 가입: customer 에 상태 (pending/approved/withdrawn)
alter table customer add column if not exists status text not null default 'pending';
alter table customer drop constraint if exists customer_status_check;
alter table customer add constraint customer_status_check check (status in ('pending','approved','withdrawn'));

-- 기존 설치본 보강: address 컬럼 (schema.sql에 이미 있으면 무시됨)
alter table customer add column if not exists address text;

-- 고객 RLS: 본인 또는 직원 조회 / 상태변경은 승인권자만
alter table customer enable row level security;
drop policy if exists "customer read (self or staff)" on customer;
create policy "customer read (self or staff)" on customer for select
  using (auth_user_id = auth.uid() or is_staff());
drop policy if exists "customer approve (approver)" on customer;
create policy "customer approve (approver)" on customer for update
  using (is_approver()) with check (is_approver());

-- 주문 이행상태 + 배송 담당자
alter table payment_order
  add column if not exists fulfillment_status text not null default 'PREPARING'
    check (fulfillment_status in ('PREPARING','SHIPPED','DELIVERED','PICKUP','INSPECTING','REFUNDED')),
  add column if not exists assigned_to uuid references staff(auth_user_id);

drop policy if exists "own order select" on payment_order;
drop policy if exists "order select (own or staff)" on payment_order;
create policy "order select (own or staff)" on payment_order for select
  using (
    customer_id in (select id from customer where auth_user_id = auth.uid())
    or is_staff()
  );

-- 이행상태 UPDATE: 디렉터/슈퍼바이저=전체, 배송기사=본인 배정분
drop policy if exists "order update (staff)" on payment_order;
create policy "order update (staff)" on payment_order for update
  using (is_approver() or (my_staff_role() = 'delivery' and assigned_to = auth.uid()))
  with check (is_approver() or (my_staff_role() = 'delivery' and assigned_to = auth.uid()));

-- 실시간(Realtime)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='payment_order') then
    alter publication supabase_realtime add table payment_order; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reservation') then
    alter publication supabase_realtime add table reservation; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='customer') then
    alter publication supabase_realtime add table customer; end if;
end $$;

-- 직원 계정 만들기(예): 앱에서 회원가입 후, 그 auth id로
--   insert into staff(auth_user_id, role, name) values ('<UUID>','director','562');   -- 또는 'supervisor' / 'delivery'
