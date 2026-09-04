create or replace function public.send_friend_request(p_target_user_id uuid)
returns table (result_status text, request_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.friend_requests%rowtype;
begin
  if v_user_id is null then raise exception 'ログインが必要です。'; end if;
  if p_target_user_id = v_user_id then raise exception '自分自身には申請できません。'; end if;
  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception '申請先が見つかりません。';
  end if;
  if exists (select 1 from public.friendships where user_id = v_user_id and friend_id = p_target_user_id) then
    return query select 'friends'::text, null::uuid; return;
  end if;
  select * into v_existing from public.friend_requests
   where status = 'pending'
     and ((sender_id = v_user_id and receiver_id = p_target_user_id)
       or (sender_id = p_target_user_id and receiver_id = v_user_id))
   limit 1;
  if found then
    return query select case when v_existing.sender_id = v_user_id then 'outgoing_existing' else 'incoming' end, v_existing.id;
    return;
  end if;
  insert into public.friend_requests(sender_id, receiver_id)
  values (v_user_id, p_target_user_id) returning id into request_id;
  result_status := 'outgoing'; return next;
end; $$;

create or replace function public.send_friend_request_by_public_id(p_public_user_id text)
returns table (result_status text, request_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_target_user_id uuid;
begin
  select id into v_target_user_id
  from public.profiles
  where upper(public_user_id) = upper(btrim(p_public_user_id))
  limit 1;

  if v_target_user_id is null then
    raise exception 'その公開IDのユーザーは見つかりません。';
  end if;

  return query select * from public.send_friend_request(v_target_user_id);
end; $$;

create or replace function public.respond_friend_request(p_request_id uuid, p_action text)
returns text language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_request public.friend_requests%rowtype;
begin
  if p_action not in ('accept', 'decline') then raise exception '操作が正しくありません。'; end if;
  select * into v_request from public.friend_requests
   where id = p_request_id and receiver_id = v_user_id and status = 'pending' for update;
  if not found then raise exception '申請が見つかりません。'; end if;
  if p_action = 'accept' then
    insert into public.friendships(user_id, friend_id) values
      (v_request.sender_id, v_request.receiver_id), (v_request.receiver_id, v_request.sender_id)
      on conflict (user_id, friend_id) do nothing;
  end if;
  update public.friend_requests set status = case when p_action = 'accept' then 'accepted' else 'declined' end,
    responded_at = now() where id = p_request_id;
  return case when p_action = 'accept' then 'accepted' else 'declined' end;
end; $$;

revoke all on function public.send_friend_request(uuid) from public;
revoke all on function public.respond_friend_request(uuid, text) from public;
revoke all on function public.send_friend_request_by_public_id(text) from public;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, text) to authenticated;
grant execute on function public.send_friend_request_by_public_id(text) to authenticated;
