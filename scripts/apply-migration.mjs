#!/usr/bin/env node
/**
 * Apply pending Supabase SQL migrations over a direct Postgres connection.
 *
 * SECURITY: credentials are read from environment variables ONLY — never
 * hardcode passwords in this file.
 *   SUPABASE_DB_PASSWORD   (required) Postgres role password
 *   SUPABASE_POOLER_URL    (optional) overrides the default pooler host,
 *                          e.g. postgresql://postgres.<ref>@aws-1-<region>.pooler.supabase.com:5432/postgres
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/apply-migration.mjs <migration-file.sql> [more.sql ...]
 */
import pg from 'pg';
import fs from 'node:fs';

const { Client } = pg;

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD environment variable.');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/apply-migration.mjs <migration-file.sql> [more.sql ...]');
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF || 'tfpujpskfyqeikjkzjru';
const connectionString =
  process.env.SUPABASE_POOLER_URL ||
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('Connected to Supabase Postgres.');
  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');
    console.log(`Applying ${file} ...`);
    await client.query(sql);
    console.log(`Applied ${file}`);
  }
  console.log('All migrations applied successfully.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  try {
    await client.end();
  } catch {}
}