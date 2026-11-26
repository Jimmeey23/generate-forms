-- Class Windows form type: guests book one Momence class that falls inside a form's time windows.
-- Each person's first class is free, the second is half price, and every class after that is full
-- price. A person is matched by email or phone across every Class Windows form.
create table if not exists public.class_window_bookings (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms(id) on delete set null,
  submission_id uuid references public.form_submissions(id) on delete set null,
  member_id bigint not null,
  email text not null default '',
  phone text not null default '',
  center text not null default '',
  session_id bigint not null,
  session_name text not null default '',
  session_starts_at timestamptz,
  -- 0 = free, 1 = half price, 2 = full price.
  price_tier smallint not null default 0,
  amount_inr integer not null default 0,
  -- 'pending_payment' until Stripe confirms, then 'booked'. 'failed' when Momence refused.
  status text not null default 'booked' check (status in ('pending_payment', 'booked', 'failed')),
  stripe_checkout_id text,
  created_at timestamptz not null default now(),
  booked_at timestamptz
);

create index if not exists class_window_bookings_email_idx on public.class_window_bookings (lower(email)) where status = 'booked';
create index if not exists class_window_bookings_phone_idx on public.class_window_bookings (phone) where status = 'booked';
create unique index if not exists class_window_bookings_checkout_idx on public.class_window_bookings (stripe_checkout_id) where stripe_checkout_id is not null;

alter table public.class_window_bookings enable row level security;
