create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  display_name text,
  student_code text,
  career text,
  cycle integer check (cycle between 1 and 20),
  goal text not null default 'Ninguno',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  academic_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.community_public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  reputation integer not null default 0 check (reputation >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 160),
  category text not null check (category in (
    'platform_outage', 'data_security', 'academic_recommendation',
    'academic_history', 'login', 'functionality', 'visual_issue',
    'community_content', 'other'
  )),
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default ('NAV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  owner_id uuid not null references auth.users(id) on delete cascade,
  consumer_name text not null,
  consumer_address text not null,
  consumer_document text not null,
  consumer_email text not null,
  consumer_phone text,
  service_description text not null,
  complaint_type text not null check (complaint_type in ('reclamo', 'queja')),
  detail text not null,
  request text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.complaints add column if not exists status text not null default 'open';
alter table public.complaints drop constraint if exists complaints_status_check;
alter table public.complaints add constraint complaints_status_check
  check (status in ('open', 'in_progress', 'closed'));

create table if not exists public.complaint_messages (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  course text not null,
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'discussion' check (status in ('discussion', 'resolved', 'academic_question', 'hidden')),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);

create unique index if not exists community_post_reports_unique
on public.community_reports(post_id, reporter_id) where post_id is not null;

create unique index if not exists community_comment_reports_unique
on public.community_reports(comment_id, reporter_id) where comment_id is not null;

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists tickets_owner_updated_idx on public.tickets(owner_id, updated_at desc);
create index if not exists ticket_messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at);
create index if not exists complaints_owner_created_idx on public.complaints(owner_id, created_at desc);
create index if not exists complaint_messages_complaint_created_idx on public.complaint_messages(complaint_id, created_at);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);
create index if not exists community_comments_post_created_idx on public.community_comments(post_id, created_at);
create index if not exists community_reports_pending_idx on public.community_reports(status, created_at);

create or replace function public.is_navia_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_student_profile(
  p_display_name text,
  p_student_code text,
  p_career text,
  p_cycle integer,
  p_goal text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if length(trim(coalesce(p_display_name, ''))) < 2
    or length(trim(coalesce(p_career, ''))) < 2
    or p_cycle is null or p_cycle < 1 or p_cycle > 20 then
    raise exception 'Invalid student profile';
  end if;

  insert into public.profiles (id, email, display_name, student_code, career, cycle, goal)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    trim(p_display_name),
    nullif(trim(p_student_code), ''),
    trim(p_career),
    p_cycle,
    coalesce(nullif(trim(p_goal), ''), 'Ninguno')
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    student_code = excluded.student_code,
    career = excluded.career,
    cycle = excluded.cycle,
    goal = excluded.goal,
    updated_at = now()
  returning * into saved;

  insert into public.community_public_profiles (user_id, display_name)
  values (auth.uid(), trim(p_display_name))
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    updated_at = now();

  return saved;
end;
$$;

create or replace function public.reset_community_post_likes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.likes := 0;
  return new;
end;
$$;

drop trigger if exists community_posts_reset_likes on public.community_posts;
create trigger community_posts_reset_likes
before insert on public.community_posts
for each row execute function public.reset_community_post_likes();

create or replace function public.assign_ticket_priority()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.priority := case
    when new.category in ('platform_outage', 'data_security') then 'critical'
    when new.category in ('academic_recommendation', 'academic_history') then 'high'
    when new.category in ('visual_issue') then 'low'
    else 'medium'
  end;
  return new;
end;
$$;

drop trigger if exists tickets_set_priority on public.tickets;
create trigger tickets_set_priority
before insert or update of category on public.tickets
for each row execute function public.assign_ticket_priority();

create or replace function public.touch_ticket_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

create or replace function public.attach_ticket_file(p_ticket_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or split_part(p_path, '/', 1) <> p_ticket_id::text then
    raise exception 'Invalid ticket attachment';
  end if;

  update public.tickets
  set attachment_path = p_path, updated_at = now()
  where id = p_ticket_id and owner_id = auth.uid() and status <> 'closed';

  if not found then
    raise exception 'Ticket not found or closed';
  end if;
end;
$$;

create or replace function public.create_ticket_with_message(
  p_subject text,
  p_category text,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.tickets;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.tickets (owner_id, subject, category, priority)
  values (auth.uid(), trim(p_subject), p_category, 'medium')
  returning * into created;

  insert into public.ticket_messages (ticket_id, author_id, body)
  values (created.id, auth.uid(), trim(p_body));

  return to_jsonb(created);
end;
$$;

create or replace function public.set_ticket_status(p_ticket_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('open', 'in_progress', 'closed') then
    raise exception 'Invalid ticket status';
  end if;
  if not public.is_navia_admin() and not (
    p_status = 'closed'
    and exists (
      select 1 from public.tickets t
      where t.id = p_ticket_id and t.owner_id = auth.uid() and t.status <> 'closed'
    )
  ) then
    raise exception 'Administrator access required';
  end if;
  update public.tickets set status = p_status, updated_at = now() where id = p_ticket_id;
  if not found then
    raise exception 'Ticket not found';
  end if;
end;
$$;

create or replace function public.toggle_community_like(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  resulting_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.community_likes
    where post_id = p_post_id and user_id = auth.uid()
  ) then
    delete from public.community_likes where post_id = p_post_id and user_id = auth.uid();
    update public.community_posts set likes = greatest(likes - 1, 0) where id = p_post_id;
  else
    insert into public.community_likes (post_id, user_id) values (p_post_id, auth.uid());
    update public.community_posts set likes = likes + 1 where id = p_post_id;
  end if;

  select likes into resulting_count from public.community_posts where id = p_post_id;
  return resulting_count;
end;
$$;

create or replace function public.refresh_community_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.community_public_profiles
  set reputation = coalesce((
    select sum(likes)::integer from public.community_posts where author_id = new.author_id
  ), 0)
  where user_id = new.author_id;
  return new;
end;
$$;

drop trigger if exists community_post_reputation on public.community_posts;
create trigger community_post_reputation
after insert or update of likes on public.community_posts
for each row execute function public.refresh_community_reputation();

drop trigger if exists ticket_messages_touch_ticket on public.ticket_messages;
create trigger ticket_messages_touch_ticket
after insert on public.ticket_messages
for each row execute function public.touch_ticket_updated_at();

alter table public.profiles enable row level security;
alter table public.student_data enable row level security;
alter table public.community_public_profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "student_data_owner_or_admin" on public.student_data;
create policy "student_data_owner_or_admin" on public.student_data
for all to authenticated
using (user_id = (select auth.uid()) or (select public.is_navia_admin()))
with check (user_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "community_public_profiles_read" on public.community_public_profiles;
create policy "community_public_profiles_read" on public.community_public_profiles
for select to authenticated using (true);

drop policy if exists "tickets_read_owner_or_admin" on public.tickets;
create policy "tickets_read_owner_or_admin" on public.tickets
for select to authenticated
using (owner_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "tickets_create_owner" on public.tickets;
create policy "tickets_create_owner" on public.tickets
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "ticket_messages_read_participants" on public.ticket_messages;
create policy "ticket_messages_read_participants" on public.ticket_messages
for select to authenticated using (
  exists (
    select 1 from public.tickets t where t.id = ticket_id
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "ticket_messages_add_participants" on public.ticket_messages;
create policy "ticket_messages_add_participants" on public.ticket_messages
for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.tickets t where t.id = ticket_id
      and t.status <> 'closed'
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "complaints_create_owner" on public.complaints;
create policy "complaints_create_owner" on public.complaints
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "complaints_read_owner_or_admin" on public.complaints;
create policy "complaints_read_owner_or_admin" on public.complaints
for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "complaints_update_admin" on public.complaints;
create policy "complaints_update_admin" on public.complaints
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "complaint_messages_read_participants" on public.complaint_messages;
create policy "complaint_messages_read_participants" on public.complaint_messages
for select to authenticated using (
  exists (
    select 1 from public.complaints c where c.id = complaint_id
      and (c.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "complaint_messages_add_admin" on public.complaint_messages;
create policy "complaint_messages_add_admin" on public.complaint_messages
for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.is_navia_admin())
);

drop policy if exists "community_posts_read_visible" on public.community_posts;
create policy "community_posts_read_visible" on public.community_posts
for select to authenticated using (status <> 'hidden' or (select public.is_navia_admin()));

drop policy if exists "community_posts_create_self" on public.community_posts;
create policy "community_posts_create_self" on public.community_posts
for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "community_posts_moderate" on public.community_posts;
create policy "community_posts_moderate" on public.community_posts
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "community_reports_create_self" on public.community_reports;
create policy "community_reports_create_self" on public.community_reports
for insert to authenticated with check (
  reporter_id = (select auth.uid())
  and (
    (post_id is not null and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_id <> (select auth.uid()) and p.status <> 'hidden'
    ))
    or (comment_id is not null and exists (
      select 1 from public.community_comments c
      join public.community_posts p on p.id = c.post_id
      where c.id = comment_id and c.author_id <> (select auth.uid())
        and c.status = 'visible' and p.status <> 'hidden'
    ))
  )
);

drop policy if exists "community_reports_read_own_or_admin" on public.community_reports;
create policy "community_reports_read_own_or_admin" on public.community_reports
for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "community_reports_moderate" on public.community_reports;
create policy "community_reports_moderate" on public.community_reports
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "community_comments_read_visible" on public.community_comments;
create policy "community_comments_read_visible" on public.community_comments
for select to authenticated using (
  (status = 'visible' and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status <> 'hidden'
  )) or (select public.is_navia_admin())
);

drop policy if exists "community_comments_create_self" on public.community_comments;
create policy "community_comments_create_self" on public.community_comments
for insert to authenticated with check (
  author_id = (select auth.uid())
  and status = 'visible'
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status <> 'hidden'
  )
);

drop policy if exists "community_comments_moderate" on public.community_comments;
create policy "community_comments_moderate" on public.community_comments
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "community_comments_delete_self" on public.community_comments;
create policy "community_comments_delete_self" on public.community_comments
for delete to authenticated using (author_id = (select auth.uid()));

alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "community_likes_read_own" on public.community_likes;
create policy "community_likes_read_own" on public.community_likes
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "community_likes_create_self" on public.community_likes;
create policy "community_likes_create_self" on public.community_likes
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "community_likes_delete_self" on public.community_likes;
create policy "community_likes_delete_self" on public.community_likes
for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-attachments', 'ticket-attachments', false, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ticket_files_upload_owner" on storage.objects;
create policy "ticket_files_upload_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = (select auth.uid()) and t.status <> 'closed'
  )
);

drop policy if exists "ticket_files_read_participants" on storage.objects;
create policy "ticket_files_read_participants" on storage.objects
for select to authenticated using (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets t
    where t.id::text = (storage.foldername(name))[1]
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

grant execute on function public.is_navia_admin() to authenticated;
grant execute on function public.set_student_profile(text, text, text, integer, text) to authenticated;
grant execute on function public.attach_ticket_file(uuid, text) to authenticated;
grant execute on function public.create_ticket_with_message(text, text, text) to authenticated;
grant execute on function public.set_ticket_status(uuid, text) to authenticated;
grant execute on function public.toggle_community_like(uuid) to authenticated;
grant select on public.profiles to authenticated;
grant select on public.community_public_profiles to authenticated;
grant select, insert, update on public.student_data to authenticated;
grant select, insert on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert, update on public.complaints to authenticated;
grant select, insert on public.complaint_messages to authenticated;
grant select, insert on public.community_posts to authenticated;
grant select, insert, update on public.community_reports to authenticated;
grant select, insert, delete on public.community_likes to authenticated;
grant select, insert, update, delete on public.community_comments to authenticated;

revoke all on function public.set_student_profile(text, text, text, integer, text) from public, anon;
revoke all on function public.attach_ticket_file(uuid, text) from public, anon;
revoke all on function public.create_ticket_with_message(text, text, text) from public, anon;
revoke all on function public.set_ticket_status(uuid, text) from public, anon;
revoke all on function public.toggle_community_like(uuid) from public, anon;
