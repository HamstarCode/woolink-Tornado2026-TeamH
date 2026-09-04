-- フレンド関係は双方の行を同じ処理で削除する。
create or replace function public.remove_friend(p_friend_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
begin
  if v_user_id is null then raise exception 'ログインが必要です。'; end if;
  if p_friend_id is null or p_friend_id = v_user_id then
    raise exception '解除する相手が正しくありません。';
  end if;

  delete from public.friendships
  where (user_id = v_user_id and friend_id = p_friend_id)
     or (user_id = p_friend_id and friend_id = v_user_id);
  get diagnostics v_deleted_count = row_count;

  return v_deleted_count > 0;
end;
$$;

revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;
