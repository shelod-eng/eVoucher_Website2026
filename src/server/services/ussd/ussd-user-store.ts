type UssdRegisteredUser = {
  msisdn: string;
  userId: string;
  firstName: string;
  surname: string;
  fullName: string;
  province: string;
  pin: string;
  createdAt: number;
  updatedAt: number;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeMsisdn(msisdn: string) {
  const digits = String(msisdn ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

export class InMemoryUssdUserStore {
  private users = new Map<string, UssdRegisteredUser>();

  getByMsisdn(msisdn: string) {
    const key = normalizeMsisdn(msisdn);
    const user = this.users.get(key);
    if (!user) return null;
    if (Date.now() - user.updatedAt > SESSION_TTL_MS) {
      this.users.delete(key);
      return null;
    }
    return user;
  }

  register(input: {
    msisdn: string;
    firstName: string;
    surname: string;
    province: string;
    pin: string;
  }) {
    const key = normalizeMsisdn(input.msisdn);
    const now = Date.now();
    const fullName = `${input.firstName} ${input.surname}`.trim();
    const existing = this.users.get(key);

    const record: UssdRegisteredUser = {
      msisdn: key,
      userId: existing?.userId ?? `ussd-${key}`,
      firstName: input.firstName,
      surname: input.surname,
      fullName,
      province: input.province,
      pin: input.pin,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.users.set(key, record);
    return record;
  }

  verifyPin(msisdn: string, pin: string) {
    const user = this.getByMsisdn(msisdn);
    if (!user) return { ok: false as const, user: null };
    return { ok: user.pin === String(pin ?? ''), user };
  }
}

export const ussdUserStore = new InMemoryUssdUserStore();

