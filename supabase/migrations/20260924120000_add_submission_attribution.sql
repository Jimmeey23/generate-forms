alter table public.form_submissions
  add column if not exists utm_medium text not null default '',
  add column if not exists utm_term text not null default '',
  add column if not exists utm_content text not null default '',
  add column if not exists gclid text not null default '',
  add column if not exists fbclid text not null default '',
  add column if not exists referrer text not null default '',
  add column if not exists landing_page text not null default '',
  add column if not exists ab_variant text not null default '';

-- Duplicate-signup checks look up a form's submissions by email and by phone.
create index if not exists form_submissions_form_email_idx on public.form_submissions(form_id, lower(submitter_email));
create index if not exists form_submissions_form_phone_idx on public.form_submissions(form_id, phone);
