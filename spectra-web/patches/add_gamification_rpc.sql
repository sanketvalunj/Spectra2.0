-- 1. Create a secure function to increment rank
create or replace function public.increment_rank(amount int)
returns void as $$
begin
  update public.users
  set trust_rank = coalesce(trust_rank, 0) + amount
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- 2. Enable Realtime for the users table (so the Header updates instantly)
alter publication supabase_realtime add table public.users;

-- 3. Ensure RLS allows users to read their own rank (already there, but good to double check)
-- Existing policy: "Public profiles are viewable by everyone" (Select using true) - OK.

NOTIFY pgrst, 'reload config';
