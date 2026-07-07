import { execSync } from 'child_process';

const vars = {
  VITE_ADMIN_PASSCODE: 'eVoucherAdmin2024',
  VITE_BILLING_DATA_MODE: 'portal',
  VITE_PORTAL_API_BASE_URL: 'https://www.evoucher.co.za',
  VITE_ADMIN_EMAILS: 'shelod@gmail.com,mpetalebo@outlook.com',
  VITE_FINANCE_APPROVER_EMAILS: 'mpetalebo@outlook.com',
};

for (const [key, value] of Object.entries(vars)) {
  try {
    execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
  } catch {}
  
  // Write value to temp file to avoid shell whitespace issues
  import('fs').then(fs => {
    fs.writeFileSync('_tmp_env_val.txt', value, { encoding: 'utf8' });
    try {
      execSync(`npx vercel env add ${key} production < _tmp_env_val.txt`, { stdio: 'inherit', shell: 'cmd.exe' });
    } catch(e) {
      console.error(`Failed: ${key}`, e.message);
    }
    fs.unlinkSync('_tmp_env_val.txt');
  });
}
