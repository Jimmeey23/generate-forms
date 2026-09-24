create extension if not exists pgcrypto;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  slug text not null unique, form_data jsonb not null default '{}'::jsonb, theme_color text not null default 'midnight',
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Closed')),
  creator_email text not null default '', submission_count integer not null default 0 check (submission_count >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(), form_id uuid not null references public.forms(id) on delete cascade,
  response_data jsonb not null default '{}'::jsonb, submitter_email text not null default '', first_name text not null default '',
  last_name text not null default '', phone text not null default '', center text not null default '', class_type text not null default '',
  utm_source text not null default '', utm_campaign text not null default '', utm_channel text not null default '',
  submitted_at timestamptz not null default now()
);

create index if not exists form_submissions_form_id_idx on public.form_submissions(form_id);
create index if not exists forms_created_at_idx on public.forms(created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists forms_set_updated_at on public.forms;
create trigger forms_set_updated_at before update on public.forms for each row execute function public.set_updated_at();

create or replace function public.increment_form_submission_count(target_form_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.forms set submission_count = submission_count + 1 where id = target_form_id;
$$;

alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;
revoke all on function public.increment_form_submission_count(uuid) from public, anon, authenticated;
