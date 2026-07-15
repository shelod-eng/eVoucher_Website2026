import { describe, expect, it, vi } from 'vitest';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';
import { processUssdMenuState } from '@/server/services/ussd/menu-state-machine';
import type { UssdSession } from '@/server/services/ussd/types';

vi.mock('@/server/services/ussd/ussd-data-service', () => ({
  resolveCustomerByMsisdn: vi.fn(async () => null),
  getShopMerchantsForUssd: vi.fn(async () => [
    { id: 'shoprite', displayName: 'Shoprite', productCount: 560 },
    { id: 'pick-n-pay', displayName: 'Pick n Pay', productCount: 1200 },
    { id: 'pep', displayName: 'Pep', productCount: 2200 },
    { id: 'mr-price', displayName: 'Mr Price', productCount: 1900 },
    { id: 'woolworths', displayName: 'Woolworths', productCount: 490 },
    { id: 'boxer', displayName: 'Boxer', productCount: 470 },
    { id: 'checkers', displayName: 'Checkers', productCount: 1 },
    { id: 'clicks', displayName: 'Clicks', productCount: 1 },
    { id: 'game', displayName: 'Game', productCount: 150 },
    { id: 'engen', displayName: 'Engen', productCount: 1 },
    { id: 'usave', displayName: 'uSave', productCount: 340 },
    { id: 'kalapeng-pharmacy-group', displayName: 'Kalapeng Pharmacy Group', productCount: 35 },
    { id: 'super-precast-concrete', displayName: 'Super Precast Concrete', productCount: 1 },
  ]),
  getProductsForMerchantUssd: vi.fn(async () => [
    {
      id: 'spc-500',
      productName: 'R500 Building Material Voucher',
      consumerPrice: 475,
      faceValue: 500,
    },
    {
      id: 'spc-1000',
      productName: 'R1000 Cement & Blocks Voucher',
      consumerPrice: 950,
      faceValue: 1000,
    },
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

  it('pages to Super Precast Concrete and purchases a wallet voucher', async () => {
    let current = session({
      state: 'MAIN_MENU',
      msisdn: '27780589033',
      data: { isRegistered: true, isAuthenticated: true, customerName: 'Sponsor Demo' },
    });

    let result = await processUssdMenuState({ session: current, text: '3' });
    expect(result.state).toBe('SHOP_MERCHANTS_MENU');
    expect(result.message).toContain('Shoprite');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '9' });
    expect(result.message).toContain('Checkers');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '9' });
    expect(result.message).toContain('Super Precast Concrete');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('SHOP_PRODUCTS_MENU');
    expect(result.message).toContain('Building Material');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('Voucher purchased');
    expect(result.message).toContain('Wallet balance: R');
    expect(result.data?.lastVoucherCode).toMatch(/^EV-/);
  });

  it('confirms redemption and returns updated wallet balance', async () => {
    let current = session({
      state: 'MAIN_MENU',
      msisdn: '27780589034',
      data: {
        isRegistered: true,
        isAuthenticated: true,
        customerName: 'Sponsor Demo',
        lastVoucherCode: 'EV-SPC-123456',
        lastVoucherAmount: 500,
        walletBalance: 500,
      },
    });

    let result = await processUssdMenuState({ session: current, text: '5' });
    expect(result.state).toBe('REDEEM_SHOP_MENU');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '9' });
    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '9' });
    expect(result.message).toContain('Super Precast Concrete');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('REDEEM_INPUT_MENU');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: 'EV-SPC-123456' });
    expect(result.state).toBe('REDEEM_CONFIRM_MENU');

    current = { ...current, state: result.state, data: result.data };
    result = await processUssdMenuState({ session: current, text: '1' });
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('Voucher redeemed');
    expect(result.message).toContain('Wallet balance: R');
  });

  it('replays cumulative gateway text when session memory is unavailable', async () => {
    const result = await handleUssdRequest({
      sessionId: 'stateless-registration-001',
      msisdn: '27780589031',
      text: '1*Nomsa*Dlamini*1*2468*2468',
    });

    expect(result.action).toBe('CON');
    expect(result.state).toBe('MAIN_MENU');
    expect(result.message).toContain('Registration successful');
    expect(result.data?.isAuthenticated).toBe(true);
  });

  it('handles a first non-empty menu input without an existing session', async () => {
    const result = await handleUssdRequest({
      sessionId: 'stateless-start-001',
      msisdn: '27780589032',
      text: '1',
    });

    expect(result.action).toBe('CON');
    expect(result.state).toBe('REGISTER_FIRST_NAME');
    expect(result.message).toContain('Enter first name');
  });
});
