create or replace function public.get_my_profile()
returns table (
  id uuid,
  nickname text,
  public_user_id text,
  personality_type text
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nickname, p.public_user_id, p.personality_type
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;
