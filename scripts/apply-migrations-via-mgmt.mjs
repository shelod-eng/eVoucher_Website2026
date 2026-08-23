#!/usr/bin/env node
/**
 * Apply Supabase SQL migrations via the Management API using the access
 * token stored by the Supabase CLI in Windows Credential Manager.
 * The token is read into memory only — never printed or written to disk.
 *
 * Usage: node scripts/apply-migrations-via-mgmt.mjs <file.sql> [more.sql ...]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/apply-migrations-via-mgmt.mjs <migration.sql> [...]');
  process.exit(1);
}

// Read the CLI-stored access token via PowerShell CredRead (UTF-8 blob).
const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredMan {
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool CredRead(string target, int type, int flags, out IntPtr credPtr);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  public static string Read(string target) {
    IntPtr ptr;
    if (!CredRead(target, 1, 0, out ptr)) return null;
    try {
      CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
      byte[] blob = new byte[cred.CredentialBlobSize];
      Marshal.Copy(cred.CredentialBlob, blob, 0, blob.Length);
      return System.Text.Encoding.UTF8.GetString(blob).TrimEnd('\\0');
    } finally { Marshal.FreeHGlobal(ptr); }
  }
}
"@
[CredMan]::Read('Supabase CLI:supabase')
`;

let token = execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
  encoding: 'utf8',
}).trim();

if (!token.startsWith('sbp_')) {
  console.error('Could not read a valid Supabase access token from Windows Credential Manager.');
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF || 'tfpujpskfyqeikjkzjru';
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

for (const file of files) {
  const sql = fs.readFileSync(file, 'utf8');
  console.log(`Applying ${file} ...`);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }
  console.log(`OK: ${file}`);
}

console.log('All migrations applied.');
token = '';