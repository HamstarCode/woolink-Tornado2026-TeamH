-- RLS policies decide which rows are visible, while these grants allow the
-- authenticated API role to issue the SELECT statements in the first place.
grant select on table public.rooms to authenticated;
grant select on table public.submissions to authenticated;
grant select on table public.replies to authenticated;
