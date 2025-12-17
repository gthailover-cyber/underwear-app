-- RPC Functions for Wallet Management
-- Run this in Supabase SQL Editor

-- 1. Deduct Coins Function (Safe atomic transaction)
create or replace function deduct_coins(amount numeric)
returns numeric
language plpgsql
security definer
as $$
declare
  current_balance numeric;
  new_balance numeric;
begin
  -- Get current balance directly from DB to ensure accuracy
  select wallet_balance into current_balance from profiles where id = auth.uid();
  
  -- Check sufficient funds
  if current_balance is null or current_balance < amount then
    raise exception 'Insufficient funds';
  end if;
  
  -- Update
  new_balance := current_balance - amount;
  update profiles set wallet_balance = new_balance where id = auth.uid();
  
  return new_balance;
end;
$$;

-- 2. Add Coins Function (Safe atomic transaction)
create or replace function add_coins(amount numeric)
returns numeric
language plpgsql
security definer
as $$
declare
  new_balance numeric;
begin
  update profiles 
  set wallet_balance = coalesce(wallet_balance, 0) + amount 
  where id = auth.uid()
  returning wallet_balance into new_balance;
  
  return new_balance;
end;
$$;
