import { processUssdMenuState } from './menu-state-machine';
import { ussdSessionStore } from './session-store';
import { UssdRequestPayload } from './types';
import { resolveCustomerByMsisdn } from './ussd-data-service';
import { ussdUserStore } from './ussd-user-store';

function ensurePayload(payload: UssdRequestPayload) {
  const sessionId = String(payload.sessionId ?? '').trim();
  const msisdn = String(payload.msisdn ?? '').trim();
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  if (!msisdn) {
    throw new Error('msisdn is required');
  }
  return {
    sessionId,
    msisdn,
    text: String(payload.text ?? ''),
  };
}

export async function handleUssdRequest(payload: UssdRequestPayload) {
  const normalized = ensurePayload(payload);
  const existing =
    ussdSessionStore.get(normalized.sessionId) ??
    ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, 'WELCOME');

  if (!existing.data?.userId || !existing.data?.isAuthenticated) {
    const simulatedUser = ussdUserStore.getByMsisdn(normalized.msisdn);
    if (simulatedUser) {
      ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, existing.state, {
        ...existing.data,
        userId: simulatedUser.userId,
        customerName: simulatedUser.fullName,
        isRegistered: true,
      });
    }
  }

  if (!existing.data?.userId) {
    const customer = await resolveCustomerByMsisdn(normalized.msisdn);
    if (customer?.id) {
      ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, existing.state, {
        ...existing.data,
        userId: customer.id,
        customerName: customer.fullName ?? null,
        isRegistered: true,
      });
    }
  }

  const session = ussdSessionStore.get(normalized.sessionId);
  const currentSession = session ?? existing;

  const result = await processUssdMenuState({
    session: currentSession,
    text: normalized.text,
  });

  if (result.action === 'END') {
    ussdSessionStore.delete(normalized.sessionId);
  } else {
    ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, result.state, result.data);
  }

  return {
    sessionId: normalized.sessionId,
    msisdn: normalized.msisdn,
    ...result,
  };
}
