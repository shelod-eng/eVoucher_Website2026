import { processUssdMenuState } from './menu-state-machine';
import { ussdSessionStore } from './session-store';
import { UssdRequestPayload, UssdSession, UssdSessionData } from './types';
import { recordUssdSessionClosed, recordUssdSessionStarted } from './ussd-demo-ledger';
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
    networkCode: String(payload.networkCode ?? '').trim() || undefined,
    serviceCode: String(payload.serviceCode ?? '').trim() || undefined,
    provider: String(payload.provider ?? 'simulator').trim() || 'simulator',
  };
}

async function resolveKnownCustomerData(
  msisdn: string,
  existingData?: UssdSessionData
): Promise<UssdSessionData> {
  let data = existingData ?? {};

  if (!data.userId || !data.isAuthenticated) {
    const simulatedUser = ussdUserStore.getByMsisdn(msisdn);
    if (simulatedUser) {
      data = {
        ...data,
        userId: simulatedUser.userId,
        customerName: simulatedUser.fullName,
        isRegistered: true,
      };
    }
  }

  if (!data.userId) {
    const customer = await resolveCustomerByMsisdn(msisdn);
    if (customer?.id) {
      data = {
        ...data,
        userId: customer.id,
        customerName: customer.fullName ?? null,
        isRegistered: true,
      };
    }
  }

  return data;
}

function sessionFromResult(
  session: UssdSession,
  result: Awaited<ReturnType<typeof processUssdMenuState>>
): UssdSession {
  const now = Date.now();
  return {
    ...session,
    state: result.state,
    data: result.data,
    updatedAt: now,
  };
}

async function replayCumulativeText(input: {
  sessionId: string;
  msisdn: string;
  text: string;
  data?: UssdSessionData;
}) {
  const now = Date.now();
  let session: UssdSession = {
    sessionId: input.sessionId,
    msisdn: input.msisdn,
    state: 'WELCOME',
    data: input.data ?? {},
    createdAt: now,
    updatedAt: now,
  };

  let result = await processUssdMenuState({ session, text: '' });
  session = sessionFromResult(session, result);

  const entries = input.text
    .split('*')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (const entry of entries) {
    result = await processUssdMenuState({ session, text: entry });
    session = sessionFromResult(session, result);
    if (result.action === 'END') break;
  }

  return result;
}

export async function handleUssdRequest(payload: UssdRequestPayload) {
  const normalized = ensurePayload(payload);
  const expired = ussdSessionStore.consumeExpired(normalized.sessionId);
  if (expired) {
    await recordUssdSessionClosed({
      sessionId: normalized.sessionId,
      msisdn: normalized.msisdn,
      reason: 'timeout',
    });
  }

  const existing = ussdSessionStore.get(normalized.sessionId);
  const baseData = await resolveKnownCustomerData(normalized.msisdn, existing?.data);
  let sessionStarted = false;

  if (!existing) {
    const started = await recordUssdSessionStarted({
      sessionId: normalized.sessionId,
      msisdn: normalized.msisdn,
      serviceCode: normalized.serviceCode,
      networkCode: normalized.networkCode,
      provider: normalized.provider,
    });
    baseData.caseId = started.caseId;
    sessionStarted = true;
  }

  if (!existing && normalized.text.trim()) {
    const replayed = await replayCumulativeText({
      sessionId: normalized.sessionId,
      msisdn: normalized.msisdn,
      text: normalized.text,
      data: baseData,
    });

    if (replayed.action === 'END') {
      await recordUssdSessionClosed({
        sessionId: normalized.sessionId,
        msisdn: normalized.msisdn,
        reason: replayed.message.toLowerCase().includes('thank') ? 'exit' : 'completed',
      });
      ussdSessionStore.delete(normalized.sessionId);
    } else {
      ussdSessionStore.upsert(
        normalized.sessionId,
        normalized.msisdn,
        replayed.state,
        {
          ...replayed.data,
          caseId: replayed.data?.caseId ?? baseData.caseId,
        }
      );
    }

    return {
      sessionId: normalized.sessionId,
      msisdn: normalized.msisdn,
      sessionStarted,
      ...replayed,
    };
  }

  const currentSession =
    existing ??
    ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, 'WELCOME', baseData);

  if (existing && baseData !== existing.data) {
    ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, existing.state, baseData);
  }

  const result = await processUssdMenuState({
    session: ussdSessionStore.get(normalized.sessionId) ?? currentSession,
    text: normalized.text,
  });

  if (result.action === 'END') {
    await recordUssdSessionClosed({
      sessionId: normalized.sessionId,
      msisdn: normalized.msisdn,
      reason: result.message.toLowerCase().includes('thank') ? 'exit' : 'completed',
    });
    ussdSessionStore.delete(normalized.sessionId);
  } else {
    ussdSessionStore.upsert(normalized.sessionId, normalized.msisdn, result.state, {
      ...result.data,
      caseId: result.data?.caseId ?? baseData.caseId,
    });
  }

  return {
    sessionId: normalized.sessionId,
    msisdn: normalized.msisdn,
    sessionStarted,
    ...result,
  };
}
