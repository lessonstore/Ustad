create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  school text not null default '',
  district text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.wallets (
  user_id uuid primary key,
  tokens integer not null default 0,
  plan text,
  plan_month date,
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "own wallet" on public.wallets for select to authenticated using (user_id = auth.uid());

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  plan text not null,
  amount integer not null default 0,
  tokens integer not null default 0,
  txn_id text not null,
  sender_phone text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert on public.payment_requests to authenticated;
grant all on public.payment_requests to service_role;
alter table public.payment_requests enable row level security;
create policy "own or admin read payments" on public.payment_requests for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own insert payments" on public.payment_requests for insert to authenticated with check (user_id = auth.uid());

create table public.unlocks (
  user_id uuid not null,
  lesson_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
grant select on public.unlocks to authenticated;
grant all on public.unlocks to service_role;
alter table public.unlocks enable row level security;
create policy "own unlocks" on public.unlocks for select to authenticated using (user_id = auth.uid());

-- monthly reset helper
create or replace function public.refresh_wallet(_uid uuid)
returns public.wallets language plpgsql security definer set search_path = public as $$
declare w public.wallets;
begin
  insert into public.wallets(user_id) values (_uid) on conflict do nothing;
  update public.wallets set tokens = 0, plan = null, plan_month = null, updated_at = now()
    where user_id = _uid and (plan_month is null or plan_month < date_trunc('month', now())::date) and (tokens <> 0 or plan is not null);
  select * into w from public.wallets where user_id = _uid;
  return w;
end $$;

create or replace function public.get_my_wallet()
returns public.wallets language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  return public.refresh_wallet(auth.uid());
end $$;

create or replace function public.unlock_lesson(_lesson_id text)
returns integer language plpgsql security definer set search_path = public as $$
declare w public.wallets;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  w := public.refresh_wallet(auth.uid());
  if exists (select 1 from public.unlocks where user_id = auth.uid() and lesson_id = _lesson_id) then
    return w.tokens;
  end if;
  if w.tokens < 10 then raise exception 'Not enough tokens'; end if;
  update public.wallets set tokens = tokens - 10, updated_at = now() where user_id = auth.uid();
  insert into public.unlocks(user_id, lesson_id) values (auth.uid(), _lesson_id);
  return w.tokens - 10;
end $$;

-- validate payment request on insert
create or replace function public.prepare_payment_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare w public.wallets;
begin
  new.user_id := auth.uid();
  new.status := 'pending';
  new.reviewed_at := null;
  if new.plan = 'basic' then new.amount := 150; new.tokens := 500;
  elsif new.plan = 'standard' then new.amount := 300; new.tokens := 1100;
  elsif new.plan = 'pro' then new.amount := 450; new.tokens := 1700;
  elsif new.plan = 'addon' then
    new.amount := 50; new.tokens := 150;
    w := public.refresh_wallet(auth.uid());
    if w.plan is null then raise exception 'Add-on needs an active plan this month'; end if;
  else raise exception 'Unknown plan'; end if;
  if length(trim(new.txn_id)) < 4 then raise exception 'Enter a valid transaction ID'; end if;
  return new;
end $$;
create trigger payment_request_prepare before insert on public.payment_requests
for each row execute function public.prepare_payment_request();

create or replace function public.review_payment(_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.payment_requests;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  select * into r from public.payment_requests where id = _id for update;
  if r.id is null or r.status <> 'pending' then raise exception 'Request not pending'; end if;
  if _approve then
    perform public.refresh_wallet(r.user_id);
    if r.plan = 'addon' then
      update public.wallets set tokens = tokens + r.tokens, updated_at = now() where user_id = r.user_id;
    else
      update public.wallets set tokens = tokens + r.tokens, plan = r.plan,
        plan_month = date_trunc('month', now())::date, updated_at = now() where user_id = r.user_id;
    end if;
  end if;
  update public.payment_requests set status = case when _approve then 'approved' else 'rejected' end, reviewed_at = now() where id = _id;
end $$;

revoke execute on function public.refresh_wallet(uuid) from public, anon, authenticated;
grant execute on function public.get_my_wallet() to authenticated;
grant execute on function public.unlock_lesson(text) to authenticated;
grant execute on function public.review_payment(uuid, boolean) to authenticated;

-- signup: profile, wallet, first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  insert into public.wallets(user_id) values (new.id) on conflict do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();