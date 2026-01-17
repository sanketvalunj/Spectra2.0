-- 1. Drop old function to be safe
drop function if exists public.increment_rank(int);

-- 2. Create "Bulletproof" Upsert Function
create or replace function public.increment_rank(amount int)
returns void as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- Try to Insert if missing (Self-Repair)
  insert into public.users (id, role, trust_rank)
  values (current_user_id, 'user', 0)
  on conflict (id) do nothing;

  -- Now Update
  update public.users
  set trust_rank = coalesce(trust_rank, 0) + amount
  where id = current_user_id;
end;
$$ language plpgsql security definer;

-- 3. Grant Permissions
grant execute on function public.increment_rank(int) to authenticated;
grant execute on function public.increment_rank(int) to anon;
grant execute on function public.increment_rank(int) to service_role;

NOTIFY pgrst, 'reload config';
