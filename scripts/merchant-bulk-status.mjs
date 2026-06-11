import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await admin
  .from('merchants')
  .select('id,business_name,email,status,user_id,must_reset_password,approved_at')
  .order('created_at', { ascending: false });
if (error) throw error;

const summary = (data ?? []).reduce((acc, merchant) => {
  const status = String(merchant.status ?? 'unknown');
  acc[status] = (acc[status] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      total: data?.length ?? 0,
      summary,
      pending: (data ?? []).filter((merchant) => merchant.status === 'pending'),
      loginNotLinked: (data ?? []).filter(
        (merchant) =>
          (merchant.status === 'active' || merchant.status === 'approved') && !merchant.user_id
      ),
      mustReset: (data ?? []).filter(
        (merchant) =>
          (merchant.status === 'active' || merchant.status === 'approved') &&
          merchant.must_reset_password
      ),
    },
    null,
    2
  )
);
