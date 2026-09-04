-- 動画日記の永続保存と「交換せず思い出として保存」に対応する。
alter table public.submissions
  add column if not exists submission_kind text not null default 'exchange';

alter table public.submissions
  drop constraint if exists submissions_submission_kind_check;
alter table public.submissions
  add constraint submissions_submission_kind_check
  check (submission_kind in ('exchange', 'private'));

create or replace function public.save_private_diary(p_diary text)
returns table (submission_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_start timestamptz;
  v_end timestamptz;
  v_submission_id uuid;
begin
  if v_user_id is null then raise exception 'ログインが必要です。'; end if;
  if char_length(btrim(coalesce(p_diary, ''))) not between 1 and 10000 then
    raise exception '日記は1文字以上10000文字以内で入力してください。';
  end if;

  v_start := (case when (now() at time zone 'Asia/Tokyo')::time < time '20:00'
    then (now() at time zone 'Asia/Tokyo')::date - 1
    else (now() at time zone 'Asia/Tokyo')::date end + time '20:00') at time zone 'Asia/Tokyo';
  v_end := v_start + interval '1 day';

  if exists (
    select 1 from public.submissions
    where user_id = v_user_id and created_at >= v_start and created_at < v_end
  ) then
    raise exception 'このExchangeにはすでに日記を提出しています。';
  end if;

  -- sentinelも入れて、旧バージョンの強制マッチャーから拾われないようにする。
  insert into public.submissions (user_id, diary, target_public_user_id, submission_kind)
  values (v_user_id, btrim(p_diary), '__PRIVATE__', 'private')
  returning id into v_submission_id;
  return query select v_submission_id;
end;
$$;

revoke all on function public.save_private_diary(text) from public;
grant execute on function public.save_private_diary(text) to authenticated;

-- 非公開bucket。再生はWoolinkの認証付きAPIを通す。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diary-videos', 'diary-videos', false, 52428800, array['video/mp4'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own diary videos" on storage.objects;
create policy "Users upload own diary videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'diary-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Diary participants read diary videos" on storage.objects;
create policy "Diary participants read diary videos"
on storage.objects for select to authenticated
using (
  bucket_id = 'diary-videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.submissions s
      join public.rooms r on r.id = s.room_id
      where position(name in s.diary) > 0
        and auth.uid() in (r.user_a_id, r.user_b_id)
    )
  )
);

-- 強制マッチでも私用日記を候補・残数に含めない。
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
  if v_user_id is null then raise exception 'ログインが必要です。'; end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'aikii1012@gmail.com' then
    raise exception '強制マッチを実行する権限がありません。';
  end if;
  v_start := (case when (now() at time zone 'Asia/Tokyo')::time < time '20:00'
    then (now() at time zone 'Asia/Tokyo')::date - 1
    else (now() at time zone 'Asia/Tokyo')::date end + time '20:00') at time zone 'Asia/Tokyo';
  v_end := v_start + interval '1 day';

  for v_a in
    select s.id, s.user_id, p.personality_type
    from public.submissions s join public.profiles p on p.id = s.user_id
    where s.room_id is null and s.submission_kind = 'exchange'
      and s.created_at >= v_start and s.created_at < v_end
    order by s.created_at for update of s skip locked
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
      else null end;
    v_b_id := null; v_b_user_id := null;

    if v_target_type is not null then
      select s.id, s.user_id into v_b_id, v_b_user_id
      from public.submissions s join public.profiles p on p.id = s.user_id
      where s.room_id is null and s.submission_kind = 'exchange'
        and s.id <> v_a.id and p.personality_type = v_target_type
        and s.created_at >= v_start and s.created_at < v_end
      order by s.created_at limit 1 for update of s skip locked;
    end if;

    if v_b_id is not null and exists (
      select 1 from public.submissions
      where id = v_a.id and room_id is null and submission_kind = 'exchange'
    ) then
      insert into public.rooms (user_a_id, user_b_id, started_at, ended_at)
      values (v_a.user_id, v_b_user_id, v_start, v_end) returning id into v_room_id;
      update public.submissions set room_id = v_room_id
      where id in (v_a.id, v_b_id) and room_id is null and submission_kind = 'exchange';
      v_matched := v_matched + 2;
    end if;
  end loop;

  loop
    select s.id, s.user_id into v_a
    from public.submissions s
    where s.room_id is null and s.submission_kind = 'exchange'
      and s.created_at >= v_start and s.created_at < v_end
    order by s.created_at limit 1 for update skip locked;
    exit when not found;

    v_b_id := null; v_b_user_id := null;
    select s.id, s.user_id into v_b_id, v_b_user_id
    from public.submissions s
    where s.room_id is null and s.submission_kind = 'exchange' and s.id <> v_a.id
      and s.created_at >= v_start and s.created_at < v_end
    order by s.created_at limit 1 for update skip locked;
    exit when v_b_id is null;

    insert into public.rooms (user_a_id, user_b_id, started_at, ended_at)
    values (v_a.user_id, v_b_user_id, v_start, v_end) returning id into v_room_id;
    update public.submissions set room_id = v_room_id
    where id in (v_a.id, v_b_id) and room_id is null and submission_kind = 'exchange';
    v_matched := v_matched + 2;
  end loop;

  return query select v_matched, count(*)::integer
  from public.submissions
  where room_id is null and submission_kind = 'exchange'
    and created_at >= v_start and created_at < v_end;
end;
$$;

revoke all on function public.force_match_diaries() from public;
grant execute on function public.force_match_diaries() to authenticated;
