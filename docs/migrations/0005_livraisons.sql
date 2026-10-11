-- Phase 4 du back-office : livreurs, attribution, code de réception et preuve de remise.
-- À appliquer telle quelle sur Lovable Cloud (voir docs/migrations/README.md).

-- 1. Livreurs (pas de compte : l'équipe les enregistre) ------------------------------
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 60),
  phone text not null check (phone ~ '^\+[0-9]{9,15}$'),
  vehicle text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.couriers enable row level security;
revoke all on public.couriers from anon, authenticated;
grant select, insert, update on public.couriers to authenticated;
grant all on public.couriers to service_role;
create policy "Staff read couriers" on public.couriers for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff add couriers" on public.couriers for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff edit couriers" on public.couriers for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- 2. Livraison sur la commande --------------------------------------------------------
-- Code à 4 chiffres donné au client à la commande ; les commandes existantes en reçoivent un aussi.
alter table public.orders
  add column if not exists delivery_code text not null default lpad((floor(random() * 10000))::int::text, 4, '0'),
  add column if not exists courier_id uuid references public.couriers(id) on delete restrict,
  add column if not exists assigned_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_to text,
  add column if not exists delivery_code_verified boolean;

-- create_web_order renvoie maintenant aussi le code de réception (changement du type de retour).
drop function if exists public.create_web_order(jsonb, jsonb);
create function public.create_web_order(_order jsonb, _items jsonb)
returns table (order_id uuid, order_number text, delivery_code text)
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

  return query select o.id, o.number, o.delivery_code;
end;
$$;
revoke execute on function public.create_web_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_web_order(jsonb, jsonb) to service_role;

-- 3. « Livrée » n'est plus accessible par un simple changement de statut --------------
create or replace function public.set_order_status(_order_id uuid, _status text, _comment text default '')
returns text language plpgsql security definer set search_path = public as $$
declare
  current_status text;
  allowed text[];
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;

  select status into current_status from public.orders where id = _order_id for update;
  if current_status is null then raise exception 'Commande introuvable.'; end if;

  allowed := case current_status
    when 'nouvelle' then array['confirmee', 'annulee']
    when 'confirmee' then array['en_preparation', 'annulee']
    when 'en_preparation' then array['en_livraison', 'annulee']
    when 'en_livraison' then array['annulee']
    else array[]::text[]
  end;
  if not (_status = any(allowed)) then
    if _status = 'livree' then raise exception 'Utilisez « Confirmer la remise » (code de réception) pour marquer la commande livrée.'; end if;
    raise exception 'Passage de « % » à « % » impossible.', current_status, _status;
  end if;
  if _status = 'annulee' and length(trim(coalesce(_comment, ''))) < 3 then
    raise exception 'Le motif d''annulation est obligatoire.';
  end if;

  perform set_config('djawan.status_comment', left(trim(coalesce(_comment, '')), 500), true);
  update public.orders set status = _status where id = _order_id;
  return _status;
end;
$$;

-- 4. Attribuer un livreur --------------------------------------------------------------
create or replace function public.assign_courier(_order_id uuid, _courier_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  c public.couriers;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Commande introuvable.'; end if;
  if o.status in ('livree', 'annulee') then raise exception 'Commande terminée : livreur non modifiable.'; end if;
  if _courier_id is not null then
    select * into c from public.couriers where id = _courier_id and active;
    if c.id is null then raise exception 'Livreur introuvable ou désactivé.'; end if;
  end if;
  update public.orders set courier_id = _courier_id, assigned_at = case when _courier_id is null then null else now() end, updated_at = now()
  where id = o.id;
  perform public.log_order_note(o.id, case when _courier_id is null then 'Livreur retiré' else 'Livreur : ' || c.name || ' (' || c.phone || ')' end);
end;
$$;
revoke execute on function public.assign_courier(uuid, uuid) from public, anon;
grant execute on function public.assign_courier(uuid, uuid) to authenticated, service_role;

-- 5. Confirmer la remise (preuve de livraison) ----------------------------------------
create or replace function public.confirm_delivery(_order_id uuid, _code text, _receiver text, _comment text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  verified boolean;
  note text;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Commande introuvable.'; end if;
  if o.status <> 'en_livraison' then raise exception 'La commande doit être « En livraison ».'; end if;
  if length(trim(coalesce(_receiver, ''))) < 2 then raise exception 'Indiquez le nom de la personne qui a reçu le colis.'; end if;

  if length(trim(coalesce(_code, ''))) > 0 then
    if trim(_code) <> o.delivery_code then raise exception 'Code de réception incorrect.'; end if;
    verified := true;
  else
    if length(trim(coalesce(_comment, ''))) < 3 then
      raise exception 'Sans code de réception, expliquez pourquoi dans le commentaire.';
    end if;
    verified := false;
  end if;

  note := 'Remis à ' || trim(_receiver) || case when verified then ' — code vérifié' else ' — SANS code' end
    || coalesce(nullif(' — ' || trim(_comment), ' — '), '');
  perform set_config('djawan.status_comment', left(note, 500), true);
  update public.orders
    set status = 'livree', delivered_at = now(), delivered_to = left(trim(_receiver), 80), delivery_code_verified = verified
    where id = o.id;
end;
$$;
revoke execute on function public.confirm_delivery(uuid, text, text, text) from public, anon;
grant execute on function public.confirm_delivery(uuid, text, text, text) to authenticated, service_role;
