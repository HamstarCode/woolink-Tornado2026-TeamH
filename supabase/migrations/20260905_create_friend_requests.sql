create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);

create unique index if not exists friend_requests_one_pending_pair
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';

alter table public.friend_requests enable row level security;

drop policy if exists "read involved friend requests" on public.friend_requests;
create policy "read involved friend requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

grant select on table public.friend_requests to authenticated;
