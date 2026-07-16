const IP_HEADER_CANDIDATES = [
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'true-client-ip',
  'x-client-ip',
  'x-vercel-forwarded-for',
];

function normalizeIpCandidate(value: string | null) {
  const candidate = String(value ?? '')
    .split(',')[0]
    .trim();

  if (!candidate) return '';
  if (candidate.startsWith('::ffff:')) return candidate.slice('::ffff:'.length);
  return candidate;
}

export function resolveRequestIp(headers: Headers) {
  for (const header of IP_HEADER_CANDIDATES) {
    const ipAddress = normalizeIpCandidate(headers.get(header));
    if (ipAddress) return ipAddress;
  }

  return 'unavailable';
}
