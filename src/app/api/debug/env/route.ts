import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const passcode = process.env.PORTAL_ADMIN_PASSCODE || '';
  return NextResponse.json({
    hasPasscode: Boolean(passcode),
    firstThreeChars: passcode ? passcode.substring(0, 3) + '...' : 'NOT SET',
    length: passcode.length,
    nodeEnv: process.env.NODE_ENV,
  });
}
