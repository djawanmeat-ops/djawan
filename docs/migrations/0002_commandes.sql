-- Phase 1 du back-office : rôles d'équipe, commandes, lignes et journal d'audit.
-- À appliquer telle quelle sur Lovable Cloud (voir docs/migrations/README.md).

-- 1. Rôles d'équipe ------------------------------------------------------------
alter type public.app_role add value if not exists 'pdg';
alter type public.app_role add value if not exists 'gestionnaire';

-- Membre de l'équipe = admin, pdg ou gestionnaire. Comparaison en texte : les nouvelles
-- valeurs de l'enum ne sont pas utilisables dans la transaction qui les crée.
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text in ('admin', 'pdg', 'gestionnaire')
  )
$$;
revoke execute on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated, service_role;

-- Correctif de l'audit de sécurité : un visiteur anonyme ne doit pas pouvoir interroger les rôles.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- 2. Commandes -----------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('DJ-' || nextval('public.order_number_seq')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee')),
  source text not null default 'web',
  customer_name text not null,
  customer_phone text not null,
  area text not null default '',
  lat double precision,
  lng double precision,
  gps_accuracy integer,
  delivery_when text not null default '',
  note text not null default '',
  payment_method text not null check (payment_method in ('orange-money', 'moov-money', 'especes')),
  jawan28_requested boolean not null default false,
  total_kg integer not null check (total_kg > 0),
  total_fcfa integer not null check (total_fcfa > 0)
);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  label text not null,
  meat_id text,
  mix jsonb,
  format_id text not null,
  format_kg integer not null,
  cut text,
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- 3. Journal d'audit (alimenté uniquement par trigger) ---------------------------
create table public.order_status_logs (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  old_status text,
  new_status text not null,
  changed_by uuid,
  comment text not null default ''
);
create index order_status_logs_order_idx on public.order_status_logs (order_id, created_at);

create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_logs (order_id, old_status, new_status, changed_by, comment)
    values (new.id, null, new.status, auth.uid(), 'Commande créée (' || new.source || ')');
  elsif new.status is distinct from old.status then
    new.updated_at := now();
    insert into public.order_status_logs (order_id, old_status, new_status, changed_by, comment)
    values (new.id, old.status, new.status, auth.uid(), coalesce(current_setting('djawan.status_comment', true), ''));
  end if;
  return new;
end;
$$;
revoke execute on function public.log_order_status() from public, anon, authenticated;

create trigger orders_status_log_insert after insert on public.orders
  for each row execute function public.log_order_status();
create trigger orders_status_log_update before update of status on public.orders
  for each row execute function public.log_order_status();

-- Création atomique d'une commande et de ses lignes, réservée au serveur du site (clé de service).
create or replace function public.create_web_order(_order jsonb, _items jsonb)
returns table (order_id uuid, order_number text)
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  insert into public.orders (customer_name, customer_phone, area, lat, lng, gps_accuracy, delivery_when, note,
                             payment_method, jawan28_requested, total_kg, total_fcfa)
  select r.customer_name, r.customer_phone, coalesce(r.area, ''), r.lat, r.lng, r.gps_accuracy,
         coalesce(r.delivery_when, ''), coalesce(r.note, ''), r.payment_method, coalesce(r.jawan28_requested, false),
         r.total_kg, r.total_fcfa
  from jsonb_populate_record(null::public.orders, _order) r
  returning * into o;

  if jsonb_array_length(_items) = 0 then raise exception 'commande sans article'; end if;
  insert into public.order_items (order_id, label, meat_id, mix, format_id, format_kg, cut, qty, unit_price, line_total)
  select o.id, i.label, i.meat_id, i.mix, i.format_id, i.format_kg, i.cut, i.qty, i.unit_price, i.line_total
  from jsonb_populate_recordset(null::public.order_items, _items) i;

  return query select o.id, o.number;
end;
$$;
revoke execute on function public.create_web_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_web_order(jsonb, jsonb) to service_role;

-- 4. Sécurité ------------------------------------------------------------------
-- Les commandes sont créées par le serveur du site (clé de service, prix recalculés).
-- L'équipe lit tout ; personne ne peut modifier ni effacer le journal depuis le site.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_logs enable row level security;

revoke all on public.orders, public.order_items, public.order_status_logs from anon, authenticated;
grant select on public.orders, public.order_items, public.order_status_logs to authenticated;
grant all on public.orders, public.order_items, public.order_status_logs to service_role;
revoke all on sequence public.order_number_seq from anon, authenticated;
grant usage on sequence public.order_number_seq to service_role;

create policy "Staff read orders" on public.orders
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff read order items" on public.order_items
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff read order logs" on public.order_status_logs
  for select to authenticated using (public.is_staff(auth.uid()));
