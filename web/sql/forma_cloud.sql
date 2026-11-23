-- Forma Fitness cloud workspace. Physically hosted alongside ContaFlux, but with separate RLS-protected tables.
-- No modification of existing cf_* tables or policies.
create table if not exists public.forma_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.forma_members (
  workspace_id uuid not null references public.forma_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create table if not exists public.forma_data (
  workspace_id uuid primary key references public.forma_workspaces(id) on delete cascade,
  document jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check(revision>=0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint forma_payload_size check (octet_length(document::text) <= 4194304)
);
create table if not exists public.forma_invites (
  token_hash text primary key check (length(token_hash)=64),
  workspace_id uuid not null references public.forma_workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  constraint forma_invite_time check (expires_at <= created_at + interval '8 days')
);
create index if not exists forma_members_user_ix on public.forma_members(user_id);
create index if not exists forma_invites_workspace_ix on public.forma_invites(workspace_id);
alter table public.forma_workspaces enable row level security;
alter table public.forma_members enable row level security;
alter table public.forma_data enable row level security;
alter table public.forma_invites enable row level security;
revoke all on public.forma_workspaces,public.forma_members,public.forma_data,public.forma_invites from anon,authenticated;
grant select,insert on public.forma_workspaces to authenticated;
grant select,insert on public.forma_members to authenticated;
grant select,insert,update on public.forma_data to authenticated;
grant select,insert on public.forma_invites to authenticated;

create policy forma_workspaces_owner_or_member_read on public.forma_workspaces for select to authenticated
using (owner_id = (select auth.uid()) or exists(
  select 1 from public.forma_members fm where fm.workspace_id=id and fm.user_id=(select auth.uid())
));
create policy forma_workspaces_owner_insert on public.forma_workspaces for insert to authenticated
with check (owner_id=(select auth.uid()));
create policy forma_members_self_read on public.forma_members for select to authenticated
using(user_id=(select auth.uid()));
create policy forma_members_owner_self_insert on public.forma_members for insert to authenticated
with check (
  user_id=(select auth.uid()) and role='owner' and exists(
   select 1 from public.forma_workspaces fw where fw.id=workspace_id and fw.owner_id=(select auth.uid())
  )
);
create policy forma_data_member_read on public.forma_data for select to authenticated
using(exists(select 1 from public.forma_members fm where fm.workspace_id=forma_data.workspace_id and fm.user_id=(select auth.uid())));
create policy forma_data_owner_insert on public.forma_data for insert to authenticated
with check(exists(select 1 from public.forma_members fm where fm.workspace_id=forma_data.workspace_id and fm.user_id=(select auth.uid()) and fm.role='owner'));
create policy forma_data_member_update on public.forma_data for update to authenticated
using(exists(select 1 from public.forma_members fm where fm.workspace_id=forma_data.workspace_id and fm.user_id=(select auth.uid())))
with check(exists(select 1 from public.forma_members fm where fm.workspace_id=forma_data.workspace_id and fm.user_id=(select auth.uid())));
create policy forma_invites_owner_read on public.forma_invites for select to authenticated
using(created_by=(select auth.uid()) and exists(select 1 from public.forma_workspaces fw where fw.id=workspace_id and fw.owner_id=(select auth.uid())));
create policy forma_invites_owner_insert on public.forma_invites for insert to authenticated
with check(created_by=(select auth.uid()) and expires_at<=(now()+interval '8 days')
  and exists(select 1 from public.forma_workspaces fw where fw.id=workspace_id and fw.owner_id=(select auth.uid())));

create or replace function public.forma_accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_invite public.forma_invites%rowtype;
 v_uid uuid;
begin
 v_uid := (select auth.uid());
 if v_uid is null then
   raise exception 'É necessário estar autenticado.' using errcode='28000';
 end if;
 if invite_token is null or length(invite_token)<40 or length(invite_token)>128 then
   raise exception 'Código inválido.' using errcode='22023';
 end if;
 select * into v_invite from public.forma_invites
   where token_hash=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(invite_token,'UTF8')),'hex')
     and used_at is null and expires_at>now()
   for update;
 if not found then
   raise exception 'Convite inválido ou expirado.' using errcode='22023';
 end if;
 insert into public.forma_members(workspace_id,user_id,role)
 values(v_invite.workspace_id,v_uid,'member')
 on conflict(workspace_id,user_id) do nothing;
 update public.forma_invites set used_at=now() where token_hash=v_invite.token_hash;
 return v_invite.workspace_id;
end;
$$;
revoke execute on function public.forma_accept_invite(text) from public,anon;
grant execute on function public.forma_accept_invite(text) to authenticated;
