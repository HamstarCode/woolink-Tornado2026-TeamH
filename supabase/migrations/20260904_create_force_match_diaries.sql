create or replace function public.force_match_diaries()
returns table (matched_count integer, remaining_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_start timestamptz;
  v_end timestamptz;
  v_a record;
  v_b_id uuid;
  v_b_user_id uuid;
  v_room_id uuid;
  v_target_type text;
  v_matched integer := 0;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です。';
  end if;

  v_start := (
    case
      when (now() at time zone 'Asia/Tokyo')::time < time '20:00'
        then (now() at time zone 'Asia/Tokyo')::date - 1
      else (now() at time zone 'Asia/Tokyo')::date
    end + time '20:00'
  ) at time zone 'Asia/Tokyo';
  v_end := v_start + interval '1 day';

  -- 1. Ignore specified targets and match every remaining submission by type.
  for v_a in
    select s.id, s.user_id, p.personality_type
      from public.submissions s
      join public.profiles p on p.id = s.user_id
     where s.room_id is null
       and s.created_at >= v_start
       and s.created_at < v_end
     order by s.created_at
     for update of s skip locked
  loop
    v_target_type := case v_a.personality_type
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

    v_b_id := null;
    v_b_user_id := null;

    if v_target_type is not null then
      select s.id, s.user_id
        into v_b_id, v_b_user_id
        from public.submissions s
        join public.profiles p on p.id = s.user_id
       where s.room_id is null
         and s.id <> v_a.id
         and p.personality_type = v_target_type
         and s.created_at >= v_start
         and s.created_at < v_end
       order by s.created_at
       limit 1
       for update of s skip locked;
    end if;

    if v_b_id is not null
       and exists (select 1 from public.submissions where id = v_a.id and room_id is null) then
      insert into public.rooms (user_a_id, user_b_id, started_at, ended_at)
      values (v_a.user_id, v_b_user_id, v_start, v_end)
      returning id into v_room_id;

      update public.submissions
         set room_id = v_room_id
       where id in (v_a.id, v_b_id) and room_id is null;
      v_matched := v_matched + 2;
    end if;
  end loop;

  -- 2. Pair the remaining submissions in submission order.
  loop
    select s.id, s.user_id
      into v_a
      from public.submissions s
     where s.room_id is null
       and s.created_at >= v_start
       and s.created_at < v_end
     order by s.created_at
     limit 1
     for update skip locked;

    exit when not found;

    v_b_id := null;
    v_b_user_id := null;
    select s.id, s.user_id
      into v_b_id, v_b_user_id
      from public.submissions s
     where s.room_id is null
       and s.id <> v_a.id
       and s.created_at >= v_start
       and s.created_at < v_end
     order by s.created_at
     limit 1
     for update skip locked;

    exit when v_b_id is null;

    insert into public.rooms (user_a_id, user_b_id, started_at, ended_at)
    values (v_a.user_id, v_b_user_id, v_start, v_end)
    returning id into v_room_id;

    update public.submissions
       set room_id = v_room_id
     where id in (v_a.id, v_b_id) and room_id is null;
    v_matched := v_matched + 2;
  end loop;

  return query
  select
    v_matched,
    count(*)::integer
  from public.submissions
  where room_id is null
    and created_at >= v_start
    and created_at < v_end;
end;
$$;

revoke all on function public.force_match_diaries() from public;
grant execute on function public.force_match_diaries() to authenticated;
