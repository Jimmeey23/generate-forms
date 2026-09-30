-- Time-slot sign-ups. Opt-in per form: forms without slotBooking enabled are untouched.
create table if not exists public.form_slots (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time,
  label text not null default '',
  capacity integer not null default 1 check (capacity >= 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists form_slots_unique_time_idx on public.form_slots(form_id, slot_date, start_time);
create index if not exists form_slots_form_idx on public.form_slots(form_id, slot_date, start_time);

alter table public.form_submissions
  add column if not exists slot_id uuid references public.form_slots(id) on delete set null,
  add column if not exists slot_label text not null default '';

create index if not exists form_submissions_slot_idx on public.form_submissions(slot_id);

-- Atomic seat take: the conditional UPDATE is the whole check, so two concurrent
-- submissions can never both claim the last seat.
create or replace function public.reserve_form_slot(target_slot_id uuid, target_form_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed uuid;
begin
  update public.form_slots
     set booked_count = booked_count + 1
   where id = target_slot_id
     and form_id = target_form_id
     and booked_count < capacity
  returning id into claimed;
  return claimed is not null;
end;
$$;

-- Used when the submission insert fails after a seat was taken.
create or replace function public.release_form_slot(target_slot_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.form_slots set booked_count = greatest(booked_count - 1, 0) where id = target_slot_id;
$$;

alter table public.form_slots enable row level security;
revoke all on function public.reserve_form_slot(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_form_slot(uuid) from public, anon, authenticated;
