-- FIX: Allow UPDATING flags (for Approve/Reject buttons)

-- 1. Ensure Admins can VIEW all flags (Select Policy) - Re-applying to be safe
drop policy if exists "Admins can view all flags" on public.content_flags;
create policy "Admins can view all flags" on public.content_flags
  for select using (true);

-- 2. Ensure Admins can UPDATE flags (Update Policy) - THIS WAS MISSING
drop policy if exists "Admins can update flags" on public.content_flags;
create policy "Admins can update flags" on public.content_flags
  for update using (true);

NOTIFY pgrst, 'reload config';
