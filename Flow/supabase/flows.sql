-- =============================================================================
-- Bảng lưu Flow lên Supabase (chia sẻ / cho tool Remote đọc)
-- Cách dùng: mở Supabase Dashboard > SQL Editor > dán toàn bộ file này > Run.
-- =============================================================================

-- 1) Bảng -----------------------------------------------------------------------
create table if not exists public.flows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  document    jsonb not null,                 -- FlowDocument: { version, nodes, edges, globals }
  is_public   boolean not null default false, -- true = ai có id cũng đọc được (share / remote)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists flows_user_id_idx on public.flows (user_id);

-- 2) Tự cập nhật updated_at ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists flows_set_updated_at on public.flows;
create trigger flows_set_updated_at
  before update on public.flows
  for each row execute function public.set_updated_at();

-- 3) Bật Row Level Security ------------------------------------------------------
alter table public.flows enable row level security;

-- SELECT: chủ sở hữu đọc flow của mình; HOẶC bất kỳ ai đọc flow công khai
drop policy if exists "flows_select_own_or_public" on public.flows;
create policy "flows_select_own_or_public" on public.flows
  for select
  using ( (select auth.uid()) = user_id or is_public = true );

-- INSERT: chỉ user đã đăng nhập, và bản ghi phải thuộc về chính họ
drop policy if exists "flows_insert_own" on public.flows;
create policy "flows_insert_own" on public.flows
  for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- UPDATE: chỉ chủ sở hữu (cả USING lẫn WITH CHECK để không đổi chủ được)
drop policy if exists "flows_update_own" on public.flows;
create policy "flows_update_own" on public.flows
  for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- DELETE: chỉ chủ sở hữu
drop policy if exists "flows_delete_own" on public.flows;
create policy "flows_delete_own" on public.flows
  for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- 4) Cấp quyền cho Data API (REST) ----------------------------------------------
--   authenticated: CRUD (RLS vẫn giới hạn theo từng dòng)
--   anon: chỉ SELECT (để remote/khách đọc flow công khai)
grant select, insert, update, delete on public.flows to authenticated;
grant select on public.flows to anon;
