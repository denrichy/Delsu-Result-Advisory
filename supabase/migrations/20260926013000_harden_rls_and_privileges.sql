begin;

create unique index if not exists students_auth_user_id_unique
  on public.students (auth_user_id) where auth_user_id is not null;
create unique index if not exists advisers_auth_user_id_unique
  on public.advisers (auth_user_id) where auth_user_id is not null;
create unique index if not exists admins_auth_user_id_unique
  on public.admins (auth_user_id) where auth_user_id is not null;
create index if not exists advisers_auth_user_id_idx on public.advisers (auth_user_id);
create index if not exists notifications_student_id_idx on public.notifications (student_id);
create index if not exists uploads_adviser_id_idx on public.uploads (adviser_id);
create index if not exists results_uploaded_by_idx on public.results (uploaded_by);
create index if not exists chat_sessions_matric_number_idx on public.chat_sessions (matric_number);
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);

drop policy if exists "Allow all" on public.admins;
drop policy if exists "Allow all operations on advisers" on public.advisers;
drop policy if exists "Allow all operations on courses" on public.courses;
drop policy if exists "Enable all for all users" on public.notifications;
drop policy if exists "Allow all operations on results" on public.results;
drop policy if exists "Enable all access for authenticated users" on public.student_session_baselines;
drop policy if exists "Enable read access for all users" on public.student_session_baselines;
drop policy if exists "Allow all operations on students" on public.students;
drop policy if exists "Allow all operations on uploads" on public.uploads;
drop policy if exists "Users can manage messages of their own sessions" on public.chat_messages;
drop policy if exists "Users can manage their own chat sessions" on public.chat_sessions;

create policy admins_select_own on public.admins
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy advisers_select_own on public.advisers
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy students_select_own on public.students
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy courses_read on public.courses
  for select to anon, authenticated using (true);

create policy results_student_read on public.results
  for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = results.student_id
      and s.auth_user_id = (select auth.uid())
  ));

create policy results_adviser_read on public.results
  for select to authenticated
  using (exists (
    select 1 from public.advisers a
    where a.id = results.uploaded_by
      and a.auth_user_id = (select auth.uid())
      and a.verified is true
      and a.revoked is false
  ));

create policy uploads_adviser_read on public.uploads
  for select to authenticated
  using (exists (
    select 1 from public.advisers a
    where a.id = uploads.adviser_id
      and a.auth_user_id = (select auth.uid())
      and a.verified is true
      and a.revoked is false
  ));

create policy notifications_student_read on public.notifications
  for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = notifications.student_id
      and s.auth_user_id = (select auth.uid())
  ));

create policy notifications_student_update on public.notifications
  for update to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = notifications.student_id
      and s.auth_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.students s
    where s.id = notifications.student_id
      and s.auth_user_id = (select auth.uid())
  ));

create policy baselines_student_read on public.student_session_baselines
  for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_session_baselines.student_id
      and s.auth_user_id = (select auth.uid())
  ));

create policy chat_sessions_own on public.chat_sessions
  for all to authenticated
  using (matric_number = (
    select s.matric_number from public.students s
    where s.auth_user_id = (select auth.uid()) limit 1
  ))
  with check (matric_number = (
    select s.matric_number from public.students s
    where s.auth_user_id = (select auth.uid()) limit 1
  ));

create policy chat_messages_own on public.chat_messages
  for all to authenticated
  using (exists (
    select 1 from public.chat_sessions cs
    join public.students s on s.matric_number = cs.matric_number
    where cs.id = chat_messages.session_id
      and s.auth_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.chat_sessions cs
    join public.students s on s.matric_number = cs.matric_number
    where cs.id = chat_messages.session_id
      and s.auth_user_id = (select auth.uid())
  ));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.courses to anon, authenticated;
grant select on public.admins, public.advisers, public.students, public.results,
  public.uploads, public.notifications, public.student_session_baselines,
  public.chat_sessions, public.chat_messages to authenticated;
grant update (read) on public.notifications to authenticated;
grant insert, update, delete on public.chat_sessions, public.chat_messages to authenticated;

revoke execute on function public.handle_auth_user_delete() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.clean_phantom_students_on_upload_delete() from public, anon, authenticated;

create or replace function public.clean_phantom_students_on_upload_delete()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  update public.students
  set baseline_units = 0,
      baseline_gps = 0.0,
      outstanding_courses = ''
  where baseline_units > 0
    and id not in (select distinct student_id from public.results);
  return old;
end;
$function$;

alter function public.handle_auth_user_delete() set search_path = '';

commit;
