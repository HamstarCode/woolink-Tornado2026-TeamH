create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint rooms_different_users check (user_a_id <> user_b_id),
  constraint rooms_valid_period check (started_at < ended_at)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  diary text not null check (char_length(btrim(diary)) between 1 and 10000),
  target_public_user_id text,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists submissions_exchange_lookup_idx
  on public.submissions (created_at, room_id);
create index if not exists submissions_target_lookup_idx
  on public.submissions (target_public_user_id, created_at)
  where room_id is null;

alter table public.rooms enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Participants can read their rooms" on public.rooms;
create policy "Participants can read their rooms"
  on public.rooms for select to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

drop policy if exists "Users can read their submissions" on public.submissions;
create policy "Users can read their submissions"
  on public.submissions for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
        from public.rooms
       where rooms.id = submissions.room_id
         and auth.uid() in (rooms.user_a_id, rooms.user_b_id)
    )
  );

create or replace function public.submit_diary(
  p_diary text,
  p_target_public_user_id text default null
)
returns table (submission_id uuid, room_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_public_user_id text;
  v_personality_type text;
  v_target_id text := nullif(upper(btrim(p_target_public_user_id)), '');
  v_target_user_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_candidate_submission_id uuid;
  v_candidate_user_id uuid;
  v_submission_id uuid;
  v_room_id uuid;
  v_matching_type text;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です。';
  end if;

  if char_length(btrim(coalesce(p_diary, ''))) not between 1 and 10000 then
    raise exception '日記は1文字以上10000文字以内で入力してください。';
  end if;

  v_start := (
    case
      when (now() at time zone 'Asia/Tokyo')::time < time '20:00'
        then (now() at time zone 'Asia/Tokyo')::date - 1
      else (now() at time zone 'Asia/Tokyo')::date
    end + time '20:00'
  ) at time zone 'Asia/Tokyo';
  v_end := v_start + interval '1 day';

  select public_user_id, personality_type
    into v_public_user_id, v_personality_type
    from public.profiles
   where id = v_user_id;

  if v_public_user_id is null then
    raise exception 'プロフィールが見つかりません。';
  end if;

  if exists (
    select 1 from public.submissions
     where user_id = v_user_id
       and created_at >= v_start
       and created_at < v_end
  ) then
    raise exception 'このExchangeにはすでに日記を提出しています。';
  end if;

  if v_target_id is not null then
    select id into v_target_user_id
      from public.profiles
     where upper(public_user_id) = v_target_id;

    if v_target_user_id is null or v_target_user_id = v_user_id then
      raise exception '入力した公開IDのユーザーが見つかりません。';
    end if;
  end if;

  insert into public.submissions (user_id, diary, target_public_user_id)
  values (v_user_id, btrim(p_diary), v_target_id)
  returning id into v_submission_id;

  if v_target_user_id is not null then
    select id, user_id
      into v_candidate_submission_id, v_candidate_user_id
      from public.submissions
     where user_id = v_target_user_id
       and upper(target_public_user_id) = upper(v_public_user_id)
       and room_id is null
       and created_at >= v_start
       and created_at < v_end
     order by created_at desc
     limit 1
     for update skip locked;
  else
    v_matching_type := case v_personality_type
      when 'PA_fast' then 'HI_fast' when 'HI_fast' then 'PA_fast'
      when 'PA_slow' then 'HI_slow' when 'HI_slow' then 'PA_slow'
      when 'BC_fast' then 'FG_fast' when 'FG_fast' then 'BC_fast'
      when 'BC_slow' then 'FG_slow' when 'FG_slow' then 'BC_slow'
      when 'DE_fast' then 'DE_fast' when 'DE_slow' then 'DE_slow'
      when 'JK_fast' then 'NO_fast' when 'NO_fast' then 'JK_fast'
      when 'JK_slow' then 'NO_slow' when 'NO_slow' then 'JK_slow'
      when 'LM_fast' then 'LM_fast' when 'LM_slow' then 'LM_slow'
      else null
    end;

    select s.id, s.user_id
      into v_candidate_submission_id, v_candidate_user_id
      from public.submissions s
      join public.profiles p on p.id = s.user_id
     where s.user_id <> v_user_id
       and s.target_public_user_id is null
       and s.room_id is null
       and s.created_at >= v_start
       and s.created_at < v_end
       and (v_matching_type is null or p.personality_type = v_matching_type)
     order by s.created_at
     limit 1
     for update of s skip locked;
  end if;

  if v_candidate_submission_id is not null then
    insert into public.rooms (user_a_id, user_b_id, started_at, ended_at)
    values (v_user_id, v_candidate_user_id, v_start, v_end)
    returning id into v_room_id;

    update public.submissions
       set room_id = v_room_id
     where id in (v_submission_id, v_candidate_submission_id)
       and room_id is null;
  end if;

  return query select v_submission_id, v_room_id;
end;
$$;

revoke all on function public.submit_diary(text, text) from public;
grant execute on function public.submit_diary(text, text) to authenticated;
