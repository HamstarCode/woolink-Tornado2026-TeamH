create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text check (content is null or char_length(btrim(content)) between 1 and 2000),
  reaction text check (reaction is null or reaction in ('👀', '😊', '👍', '💭')),
  created_at timestamptz not null default now(),
  constraint replies_have_content check (content is not null or reaction is not null),
  constraint replies_one_per_user_per_room unique (room_id, user_id)
);

alter table public.replies enable row level security;

drop policy if exists "Room participants can read replies" on public.replies;
create policy "Room participants can read replies"
  on public.replies for select to authenticated
  using (
    exists (
      select 1 from public.rooms
       where rooms.id = replies.room_id
         and auth.uid() in (rooms.user_a_id, rooms.user_b_id)
    )
  );

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
  if v_user_id is null then
    raise exception 'ログインが必要です。';
  end if;

  if not exists (
    select 1 from public.rooms r
     where r.id = p_room_id
       and v_user_id in (r.user_a_id, r.user_b_id)
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

create or replace function public.send_diary_reply(
  p_room_id uuid,
  p_content text default null,
  p_reaction text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_content text := nullif(btrim(p_content), '');
  v_reply_id uuid;
  v_ended_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です。';
  end if;

  select ended_at into v_ended_at
    from public.rooms
   where id = p_room_id
     and v_user_id in (user_a_id, user_b_id);

  if v_ended_at is null then
    raise exception 'この交換日記へ返信する権限がありません。';
  end if;

  if now() >= v_ended_at then
    raise exception 'このExchangeは終了しました。';
  end if;

  if v_content is null and p_reaction is null then
    raise exception '返信またはリアクションを入力してください。';
  end if;

  if v_content is not null and char_length(v_content) > 2000 then
    raise exception '返信は2000文字以内で入力してください。';
  end if;

  if p_reaction is not null and p_reaction not in ('👀', '😊', '👍', '💭') then
    raise exception '選択できないリアクションです。';
  end if;

  insert into public.replies (room_id, user_id, content, reaction)
  values (p_room_id, v_user_id, v_content, p_reaction)
  returning id into v_reply_id;

  return v_reply_id;
exception
  when unique_violation then
    raise exception 'この交換日記にはすでに返信しています。';
end;
$$;

revoke all on function public.get_diary_room(uuid) from public;
revoke all on function public.send_diary_reply(uuid, text, text) from public;
grant execute on function public.get_diary_room(uuid) to authenticated;
grant execute on function public.send_diary_reply(uuid, text, text) to authenticated;
