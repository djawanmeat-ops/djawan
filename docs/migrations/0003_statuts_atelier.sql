-- Phase 2 du back-office : changement de statut tracé et disponibilité des viandes.
-- À appliquer telle quelle sur Lovable Cloud (voir docs/migrations/README.md).

-- 1. Changement de statut ---------------------------------------------------------
-- Seul chemin pour modifier une commande depuis le site : l'équipe n'a aucun droit UPDATE direct.
-- Le trigger log_order_status (migration 0002) écrit l'historique avec auth.uid() et le motif.
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
    when 'en_livraison' then array['livree', 'annulee']
    else array[]::text[]
  end;
  if not (_status = any(allowed)) then
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
revoke execute on function public.set_order_status(uuid, text, text) from public, anon;
grant execute on function public.set_order_status(uuid, text, text) to authenticated, service_role;

-- 2. Disponibilité des viandes -----------------------------------------------------
-- Une ligne par viande marquée indisponible ; les identifiants sont ceux de src/data/djawan.ts.
create table public.meat_availability (
  meat_id text primary key,
  available boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.meat_availability enable row level security;
revoke all on public.meat_availability from anon, authenticated;
grant select on public.meat_availability to anon, authenticated;
grant all on public.meat_availability to service_role;
create policy "Public read meat availability" on public.meat_availability
  for select to anon, authenticated using (true);

create or replace function public.set_meat_availability(_meat_id text, _available boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;
  if _meat_id !~ '^[a-z-]{2,40}$' then raise exception 'Viande inconnue.'; end if;
  insert into public.meat_availability (meat_id, available, updated_at, updated_by)
  values (_meat_id, _available, now(), auth.uid())
  on conflict (meat_id) do update set available = excluded.available, updated_at = now(), updated_by = auth.uid();
end;
$$;
revoke execute on function public.set_meat_availability(text, boolean) from public, anon;
grant execute on function public.set_meat_availability(text, boolean) to authenticated, service_role;
