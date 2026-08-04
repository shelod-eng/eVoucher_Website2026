import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envLocalPath = path.resolve('.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
envLocalContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, business_name, email, status, merchant_type');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('--- MERCHANTS ---');
  console.log(JSON.stringify(merchants, null, 2));

  const spcMerchant = merchants.find(m => m.business_name.includes('Precast'));
  if (spcMerchant) {
    console.log(`Found SPC merchant: ${spcMerchant.business_name} with id: ${spcMerchant.id}`);
    const { data: products, error: pError } = await supabase
      .from('merchant_products')
      .select('id, merchant_id, product_name, face_value, is_active')
      .eq('merchant_id', spcMerchant.id);
    
    if (pError) {
      console.error(pError);
      return;
    }
    console.log(`--- PRODUCTS FOR ${spcMerchant.business_name} ---`);
    console.log(JSON.stringify(products, null, 2));
  } else {
    console.log('SPC merchant not found in merchants table');
  }
}

main().catch(console.error);
