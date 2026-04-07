import { describe, expect, it, vi } from 'vitest';
import { processUssdMenuState } from '@/server/services/ussd/menu-state-machine';
import type { UssdSession } from '@/server/services/ussd/types';

vi.mock('@/server/services/ussd/ussd-data-service', () => ({
  getShopMerchantsForUssd: vi.fn(async () => [
    { id: 'm1', displayName: 'Shoprite', productCount: 2 },
    { id: 'm2', displayName: 'Checkers', productCount: 1 },
  ]),
  getProductsForMerchantUssd: vi.fn(async () => [
    { id: 'p1', productName: 'Voucher R100', consumerPrice: 95 },
    { id: 'p2', productName: 'Voucher R500', consumerPrice: 475 },
  ]),
  getWalletBalanceForCustomerUssd: vi.fn(async () => 2850),
}));

function session(overrides?: Partial<UssdSession>): UssdSession {
  return {
    sessionId: overrides?.sessionId ?? `s-${Math.random()}`,
    msisdn: overrides?.msisdn ?? `2778000${Math.floor(Math.random() * 10000)}`,
    state: overrides?.state ?? 'WELCOME',
    data: overrides?.data ?? {},
    createdAt: overrides?.createdAt ?? Date.now(),
    updatedAt: overrides?.updatedAt ?? Date.now(),
  };
}

describe('USSD menu state machine', () => {
  it('starts at main menu from welcome', async () => {
    const result = await processUssdMenuState({
      session: session({ state: 'WELCOME' }),
      text: '',
    });
    expect(result.action).toBe('CON');
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('1. Register');
  });

  it('guides complete registration flow', async () => {
    const baseMsisdn = '27780589029';
    let current = session({ state: 'MAIN_MENU', msisdn: baseMsisdn, data: { isRegistered: false } });

    let result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('REGISTER_FIRST_NAME');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: 'Lebo' });
    expect(result.state).toBe('REGISTER_SURNAME');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: 'Mpeta' });
    expect(result.state).toBe('REGISTER_PROVINCE');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('REGISTER_PIN_CREATE');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1234' });
    expect(result.state).toBe('REGISTER_PIN_CONFIRM');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1234' });
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('Registration successful');
    expect(result.data?.isAuthenticated).toBe(true);
  });

  it('requires login for unregistered shopping attempt', async () => {
    const result = await processUssdMenuState({
      session: session({ state: 'MAIN_MENU', data: { isRegistered: false, isAuthenticated: false } }),
      text: '3',
    });
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('Please register first');
  });

  it('allows shop menu when authenticated', async () => {
    const result = await processUssdMenuState({
      session: session({
        state: 'MAIN_MENU',
        data: { isRegistered: true, isAuthenticated: true, customerName: 'Lebo' },
      }),
      text: '3',
    });
    expect(result.state).toBe('SHOP_MERCHANTS_MENU');
    expect(result.message).toContain('Select store');
  });
});

