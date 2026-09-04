-- 認証後のユーザーにプロフィールを作成するトリガー。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url, public_user_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    public.generate_public_user_id()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 交換日記の相手名も現在のnickname列から返す。
create or replace function public.get_diary_room(p_room_id uuid)
returns table (
  room_id uuid,
  ended_at timestamptz,
  partner_user_id uuid,
  partner_nickname text,
  partner_public_user_id text,
  partner_personality_type text,
  partner_diary text,
  my_reply_content text,
  my_reply_reaction text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'ログインが必要です。'; end if;
  if not exists (
    select 1 from public.rooms r
    where r.id = p_room_id and v_user_id in (r.user_a_id, r.user_b_id)
  ) then
    raise exception 'この交換日記を閲覧する権限がありません。';
  end if;

  return query
  select
    r.id,
    r.ended_at,
    p.id,
    p.nickname::text,
    p.public_user_id::text,
    p.personality_type::text,
    s.diary::text,
    reply.content::text,
    reply.reaction::text
  from public.rooms r
  join public.profiles p
    on p.id = case when r.user_a_id = v_user_id then r.user_b_id else r.user_a_id end
  left join public.submissions s
    on s.room_id = r.id and s.user_id = p.id
  left join public.replies reply
    on reply.room_id = r.id and reply.user_id = v_user_id
  where r.id = p_room_id;
end;
$$;
