create unique index if not exists profiles_public_user_id_unique_idx
  on public.profiles (upper(public_user_id));
