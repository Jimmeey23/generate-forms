-- Slot Bookings form type: per-slot location/notes, and a waitlist for full slots.
alter table public.form_slots
  add column if not exists location text not null default '',
  add column if not exists note text not null default '';

alter table public.form_submissions
  add column if not exists waitlisted boolean not null default false;

create index if not exists form_submissions_waitlisted_idx
  on public.form_submissions(form_id) where waitlisted;

-- Seats are taken atomically; a caller that gets false may still record a waitlist
-- entry, which deliberately does not consume capacity.
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

revoke all on function public.reserve_form_slot(uuid, uuid) from public, anon, authenticated;
