create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "insert own friendships" on public.friendships;
create policy "insert own friendships"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select on table public.friendships to authenticated;

drop policy if exists "related profiles are readable" on public.profiles;
create policy "related profiles are readable"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where (f.user_id = auth.uid() and f.friend_id = profiles.id)
         or (f.friend_id = auth.uid() and f.user_id = profiles.id)
    )
    or exists (
      select 1 from public.friend_requests r
      where r.status = 'pending'
        and ((r.sender_id = auth.uid() and r.receiver_id = profiles.id)
          or (r.receiver_id = auth.uid() and r.sender_id = profiles.id))
    )
  );

grant select on table public.profiles to authenticated;
