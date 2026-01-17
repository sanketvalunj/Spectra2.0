-- FIX: Allow reading flags even if not authenticated via Supabase (since we use a Password Gate)

drop policy if exists "Admins can view all flags" on public.content_flags;

create policy "Admins can view all flags" on public.content_flags
  for select using (true);

NOTIFY pgrst, 'reload config';
