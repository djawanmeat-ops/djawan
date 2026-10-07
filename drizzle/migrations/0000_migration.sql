create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create table public.promos (
  id text primary key,
  name text not null,
  tagline text not null default '',
  offer text not null default '',
  active boolean not null default false,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
grant select, update on public.promos to authenticated;
grant all on public.promos to service_role;
alter table public.promos enable row level security;
create policy "Admins read promos" on public.promos for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update promos" on public.promos for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_public_promos()
returns table (id text, name text, tagline text, offer text, active boolean, sort int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.tagline, case when p.active then p.offer else '' end, p.active, p.sort
  from public.promos p order by p.sort
$$;
grant execute on function public.get_public_promos() to anon, authenticated;

insert into public.promos (id, name, tagline, active, sort) values
 ('djawan', 'Promo Djawan', 'Notre sélection signature, offerte toute l''année, douze mois sur douze.', true, 0),
 ('ramadan', 'Promo Ramadan', 'Une attention choisie pour accompagner le mois sacré et la Korité.', false, 1),
 ('tabaski', 'Promo Tabaski', 'Le rendez-vous de la grande fête, à partager en famille.', false, 2),
 ('maouloud', 'Promo Maouloud', 'Une table généreuse pour célébrer le Maouloud.', false, 3),
 ('achoura', 'Promo Achoura', 'Pour honorer le repas de l''Achoura, avec soin.', false, 4);