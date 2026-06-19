import { NextResponse } from 'next/server';

export function noStoreHeaders(existing?: HeadersInit): HeadersInit {
  return {
    ...(existing ?? {}),
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Cookie, Authorization',
  };
}

export function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...(init ?? {}),
    headers: noStoreHeaders(init?.headers),
  });
}
