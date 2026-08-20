// Run: node --env-file=.env.local scripts/migrate-wallet.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } })
console.log('Supabase reachable:', res.ok)

// Use pg REST endpoint for DDL
const queries = [
  `CREATE TABLE IF NOT EXISTS wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('topup','payment','payout','refund','earning')),
    description text,
    reference_id text,
    created_at timestamptz DEFAULT now()
  )`,
  `ALTER TABLE wallets ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallets' AND policyname='Users see own wallet') THEN
      CREATE POLICY "Users see own wallet" ON wallets FOR ALL USING (user_id = auth.uid());
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallet_transactions' AND policyname='Users see own transactions') THEN
      CREATE POLICY "Users see own transactions" ON wallet_transactions FOR ALL
        USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));
    END IF;
  END $$`,
]

for (const query of queries) {
  const r = await fetch(`${url}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query }),
  })
  const label = query.trim().slice(0, 50)
  if (r.ok) {
    console.log('✓', label)
  } else {
    const err = await r.text()
    console.log('✗', label, '->', err.slice(0, 100))
  }
}
