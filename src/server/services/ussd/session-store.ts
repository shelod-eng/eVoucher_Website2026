import { UssdMenuState, UssdSession, UssdSessionData } from './types';

const TTL_MS = 10 * 60 * 1000;

export class InMemoryUssdSessionStore {
  private sessions = new Map<string, UssdSession>();

  get(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() - session.updatedAt > TTL_MS) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  consumeExpired(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() - session.updatedAt <= TTL_MS) return null;
    this.sessions.delete(sessionId);
    return session;
  }

  upsert(sessionId: string, msisdn: string, state: UssdMenuState, data?: UssdSessionData) {
    const now = Date.now();
    const current = this.sessions.get(sessionId);
    const next: UssdSession = {
      sessionId,
      msisdn,
      state,
      data: data ?? current?.data,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    this.sessions.set(sessionId, next);
    return next;
  }

  delete(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

export const ussdSessionStore = new InMemoryUssdSessionStore();
