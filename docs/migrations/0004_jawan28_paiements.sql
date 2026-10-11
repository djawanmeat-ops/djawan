-- Phase 3 du back-office : Wave, décision Jawan 28, échéancier et journal des encaissements.
-- À appliquer telle quelle sur Lovable Cloud (voir docs/migrations/README.md).

-- 1. Wave remplace Moov Money (moov-money reste accepté pour l'historique) ----------
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('orange-money', 'wave', 'especes', 'moov-money'));

-- 2. Décision Jawan 28 sur la commande -----------------------------------------------
alter table public.orders add column if not exists jawan28_decision text
  check (jawan28_decision in ('accepte', 'refuse'));

-- 3. Échéancier (3 tranches J0 / J14 / J28) -------------------------------------------
create table public.jawan28_schedules (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  tranche smallint not null check (tranche between 1 and 3),
  due_date date not null,
  amount_due integer not null check (amount_due > 0),
  amount_paid integer not null default 0 check (amount_paid >= 0),
  unique (order_id, tranche)
);
create index jawan28_schedules_due_idx on public.jawan28_schedules (due_date);

-- 4. Journal des encaissements (ajout seulement, jamais modifié) ---------------------
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  schedule_id uuid references public.jawan28_schedules(id) on delete restrict,
  method text not null check (method in ('orange-money', 'wave', 'especes')),
  reference text not null default '',
  amount integer not null check (amount > 0),
  paid_at timestamptz not null default now(),
  received_by uuid,
  comment text not null default ''
);
create index payment_transactions_order_idx on public.payment_transactions (order_id, paid_at);

-- 5. Sécurité : l'équipe lit, seules les fonctions ci-dessous écrivent --------------
alter table public.jawan28_schedules enable row level security;
alter table public.payment_transactions enable row level security;
revoke all on public.jawan28_schedules, public.payment_transactions from anon, authenticated;
grant select on public.jawan28_schedules, public.payment_transactions to authenticated;
grant all on public.jawan28_schedules, public.payment_transactions to service_role;
create policy "Staff read schedules" on public.jawan28_schedules
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff read payments" on public.payment_transactions
  for select to authenticated using (public.is_staff(auth.uid()));

-- Note dans l'historique de la commande, sans changer son statut.
create or replace function public.log_order_note(_order_id uuid, _comment text)
returns void language sql security definer set search_path = public as $$
  insert into public.order_status_logs (order_id, old_status, new_status, changed_by, comment)
  select id, status, status, auth.uid(), _comment from public.orders where id = _order_id;
$$;
revoke execute on function public.log_order_note(uuid, text) from public, anon, authenticated;

-- 6. Valider ou refuser un Jawan 28 ---------------------------------------------------
create or replace function public.decide_jawan28(_order_id uuid, _accept boolean, _start date default current_date, _comment text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  part integer;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Commande introuvable.'; end if;
  if not o.jawan28_requested then raise exception 'Cette commande n''a pas demandé le Jawan 28.'; end if;
  if o.jawan28_decision is not null then raise exception 'La décision Jawan 28 a déjà été prise.'; end if;
  if o.status = 'annulee' then raise exception 'Commande annulée.'; end if;

  if not _accept then
    if length(trim(coalesce(_comment, ''))) < 3 then raise exception 'Le motif du refus est obligatoire.'; end if;
    update public.orders set jawan28_decision = 'refuse', updated_at = now() where id = o.id;
    perform public.log_order_note(o.id, 'Jawan 28 refusé : ' || trim(_comment));
    return;
  end if;

  if _start is null or _start < current_date - 30 or _start > current_date + 30 then
    raise exception 'Date de départ invalide.';
  end if;
  part := o.total_fcfa / 3;
  insert into public.jawan28_schedules (order_id, tranche, due_date, amount_due) values
    (o.id, 1, _start, part),
    (o.id, 2, _start + 14, part),
    (o.id, 3, _start + 28, o.total_fcfa - part * 2);
  update public.orders set jawan28_decision = 'accepte', updated_at = now() where id = o.id;
  perform public.log_order_note(o.id, 'Jawan 28 validé : échéancier créé à partir du ' || to_char(_start, 'DD/MM/YYYY')
    || coalesce(nullif(' — ' || trim(_comment), ' — '), ''));
end;
$$;
revoke execute on function public.decide_jawan28(uuid, boolean, date, text) from public, anon;
grant execute on function public.decide_jawan28(uuid, boolean, date, text) to authenticated, service_role;

-- 7. Enregistrer un encaissement -------------------------------------------------------
create or replace function public.record_payment(_order_id uuid, _schedule_id uuid, _method text, _reference text, _amount integer, _comment text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  s public.jawan28_schedules;
  remaining integer;
  tx uuid;
  label text;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Accès réservé à l''équipe.' using errcode = '42501';
  end if;
  select * into o from public.orders where id = _order_id for update;
  if o.id is null then raise exception 'Commande introuvable.'; end if;
  if o.status = 'annulee' then raise exception 'Commande annulée : encaissement impossible.'; end if;
  if _method not in ('orange-money', 'wave', 'especes') then raise exception 'Moyen de paiement inconnu.'; end if;
  if _method <> 'especes' and length(trim(coalesce(_reference, ''))) < 4 then
    raise exception 'La référence de la transaction est obligatoire pour Orange Money et Wave.';
  end if;
  if _amount is null or _amount <= 0 then raise exception 'Montant invalide.'; end if;

  if _schedule_id is not null then
    select * into s from public.jawan28_schedules where id = _schedule_id and order_id = o.id for update;
    if s.id is null then raise exception 'Tranche introuvable.'; end if;
    remaining := s.amount_due - s.amount_paid;
  else
    if exists (select 1 from public.jawan28_schedules where order_id = o.id) then
      raise exception 'Commande en Jawan 28 : encaissez une tranche.';
    end if;
    remaining := o.total_fcfa - coalesce((select sum(amount) from public.payment_transactions where order_id = o.id), 0);
  end if;
  if remaining <= 0 then raise exception 'Déjà entièrement payé.'; end if;
  if _amount > remaining then raise exception 'Montant supérieur au reste à payer (% FCFA).', remaining; end if;

  insert into public.payment_transactions (order_id, schedule_id, method, reference, amount, received_by, comment)
  values (o.id, _schedule_id, _method, left(trim(coalesce(_reference, '')), 80), _amount, auth.uid(), left(trim(coalesce(_comment, '')), 300))
  returning id into tx;
  if _schedule_id is not null then
    update public.jawan28_schedules set amount_paid = amount_paid + _amount where id = _schedule_id;
  end if;

  label := case _method when 'orange-money' then 'Orange Money' when 'wave' then 'Wave' else 'Espèces' end;
  perform public.log_order_note(o.id, 'Encaissement ' || _amount || ' FCFA (' || label
    || coalesce(nullif(', réf. ' || trim(_reference), ', réf. '), '') || ')'
    || case when _schedule_id is not null then ' — tranche ' || s.tranche else '' end);
  return tx;
end;
$$;
revoke execute on function public.record_payment(uuid, uuid, text, text, integer, text) from public, anon;
grant execute on function public.record_payment(uuid, uuid, text, text, integer, text) to authenticated, service_role;
