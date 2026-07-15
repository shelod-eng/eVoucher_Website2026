import {
  getProductsForMerchantUssd,
  getShopMerchantsForUssd,
  getWalletBalanceForCustomerUssd,
} from './ussd-data-service';
import { purchaseUssdVoucher, recordShopSelected, redeemUssdVoucher } from './ussd-demo-ledger';
import { ussdUserStore } from './ussd-user-store';
import { UssdResponsePayload, UssdSession, UssdSessionData } from './types';

const MERCHANTS_PAGE_SIZE = 6;
const PRODUCTS_PAGE_SIZE = 6;
const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape',
];

function normalizeInput(text: string) {
  const raw = String(text ?? '').trim();
  if (!raw) return { latest: '', full: [] as string[] };
  const full = raw.split('*').map((part) => part.trim());
  return { latest: full[full.length - 1] ?? '', full };
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(0, Number(page || 0));
  const start = safePage * pageSize;
  const end = start + pageSize;
  return {
    page: safePage,
    hasNext: end < items.length,
    hasPrev: safePage > 0,
    items: items.slice(start, end),
  };
}

function continueResponse(
  state: UssdResponsePayload['state'],
  message: string,
  data?: UssdSessionData
): UssdResponsePayload {
  return { action: 'CON', state, message, data };
}

function endResponse(message: string, data?: UssdSessionData): UssdResponsePayload {
  return { action: 'END', state: 'EXIT', message, data };
}

function isNumericPin(value: string) {
  return /^\d{4}$/.test(String(value ?? '').trim());
}

function renderMainMenu(data: UssdSessionData) {
  const heading = data.isAuthenticated
    ? `Hi ${data.customerName ?? 'User'}`
    : data.isRegistered
      ? 'Login required'
      : 'Welcome';

  return [
    `eVoucher - ${heading}`,
    '1. Register',
    '2. Login / Continue',
    '3. Shop',
    '4. Wallet',
    '5. Redeem',
    '0. Exit',
  ].join('\n');
}

function guardAuthenticated(data: UssdSessionData) {
  if (data.isAuthenticated) return null;
  if (data.isRegistered) {
    return continueResponse(
      'MAIN_MENU',
      ['Please login first (Option 2).', renderMainMenu(data)].join('\n\n'),
      data
    );
  }
  return continueResponse(
    'MAIN_MENU',
    ['Please register first (Option 1).', renderMainMenu(data)].join('\n\n'),
    data
  );
}

function renderProvinces() {
  const lines = ['Select province:'];
  PROVINCES.forEach((province, index) => lines.push(`${index + 1}. ${province}`));
  lines.push('0. Cancel');
  return lines.join('\n');
}

function renderMerchantMenu(
  title: string,
  merchants: Awaited<ReturnType<typeof getShopMerchantsForUssd>>,
  page: number
) {
  const pageData = paginate(merchants, page, MERCHANTS_PAGE_SIZE);
  const lines = [title];
  pageData.items.forEach((merchant, index) => {
    lines.push(`${index + 1}. ${merchant.displayName} (${merchant.productCount})`);
  });
  if (pageData.hasNext) lines.push('9. Next');
  if (pageData.hasPrev) lines.push('8. Prev');
  lines.push('0. Back');
  return { pageData, message: lines.join('\n') };
}

function clearRegistrationDraft(data: UssdSessionData): UssdSessionData {
  return {
    ...data,
    pendingFirstName: null,
    pendingSurname: null,
    pendingProvince: null,
    pendingPin: null,
    lastError: null,
  };
}

export async function processUssdMenuState(input: {
  session: UssdSession;
  text?: string;
}): Promise<UssdResponsePayload> {
  const { latest } = normalizeInput(input.text ?? '');
  const atRoot = !String(input.text ?? '').trim();
  const data: UssdSessionData = input.session.data ?? {};

  if (atRoot || input.session.state === 'WELCOME') {
    return continueResponse('MAIN_MENU', renderMainMenu(data), data);
  }

  if (input.session.state === 'MAIN_MENU') {
    if (latest === '1') {
      if (data.isRegistered) {
        return continueResponse(
          'MAIN_MENU',
          ['Number already registered. Use Option 2 to login.', renderMainMenu(data)].join('\n\n'),
          data
        );
      }
      return continueResponse(
        'REGISTER_FIRST_NAME',
        'Enter first name:',
        clearRegistrationDraft(data)
      );
    }

    if (latest === '2') {
      if (!data.isRegistered) {
        return continueResponse(
          'MAIN_MENU',
          ['No registration found for this number. Choose Option 1.', renderMainMenu(data)].join(
            '\n\n'
          ),
          data
        );
      }
      if (data.isAuthenticated) {
        return continueResponse(
          'MAIN_MENU',
          ['Already logged in.', renderMainMenu(data)].join('\n\n'),
          data
        );
      }
      return continueResponse('LOGIN_PIN', 'Enter your 4-digit PIN:', data);
    }

    if (latest === '3') {
      const blocked = guardAuthenticated(data);
      if (blocked) return blocked;

      const merchants = await getShopMerchantsForUssd();
      if (merchants.length === 0) {
        return continueResponse(
          'MAIN_MENU',
          ['No merchants available right now.', renderMainMenu(data)].join('\n\n'),
          data
        );
      }

      const rendered = renderMerchantMenu('Select store:', merchants, 0);
      return continueResponse('SHOP_MERCHANTS_MENU', rendered.message, {
        ...data,
        selectedMerchantPage: 0,
      });
    }

    if (latest === '4') {
      const blocked = guardAuthenticated(data);
      if (blocked) return blocked;

      const balance = await getWalletBalanceForCustomerUssd(
        String(data.userId ?? ''),
        input.session.msisdn
      );
      return continueResponse(
        'WALLET_MENU',
        [`Wallet balance: R${balance.toFixed(2)}`, '0. Back'].join('\n'),
        { ...data, walletBalance: balance }
      );
    }

    if (latest === '5') {
      const blocked = guardAuthenticated(data);
      if (blocked) return blocked;
      const merchants = await getShopMerchantsForUssd();
      const rendered = renderMerchantMenu('Redeem at store:', merchants, 0);
      return continueResponse('REDEEM_SHOP_MENU', rendered.message, {
        ...data,
        selectedRedeemShopPage: 0,
      });
    }

    if (latest === '0') {
      return endResponse('Thank you for using eVoucher.', data);
    }

    return continueResponse(
      'MAIN_MENU',
      ['Invalid option.', renderMainMenu(data)].join('\n\n'),
      data
    );
  }

  if (input.session.state === 'REGISTER_FIRST_NAME') {
    if (latest === '0')
      return continueResponse('MAIN_MENU', renderMainMenu(data), clearRegistrationDraft(data));
    if (latest.length < 2)
      return continueResponse('REGISTER_FIRST_NAME', 'First name too short. Try again:', data);
    return continueResponse('REGISTER_SURNAME', 'Enter surname:', {
      ...data,
      pendingFirstName: latest,
    });
  }

  if (input.session.state === 'REGISTER_SURNAME') {
    if (latest === '0')
      return continueResponse('MAIN_MENU', renderMainMenu(data), clearRegistrationDraft(data));
    if (latest.length < 2)
      return continueResponse('REGISTER_SURNAME', 'Surname too short. Try again:', data);
    return continueResponse('REGISTER_PROVINCE', renderProvinces(), {
      ...data,
      pendingSurname: latest,
    });
  }

  if (input.session.state === 'REGISTER_PROVINCE') {
    if (latest === '0')
      return continueResponse('MAIN_MENU', renderMainMenu(data), clearRegistrationDraft(data));
    const index = Number(latest);
    if (!Number.isInteger(index) || index < 1 || index > PROVINCES.length) {
      return continueResponse('REGISTER_PROVINCE', `Invalid choice.\n\n${renderProvinces()}`, data);
    }
    return continueResponse('REGISTER_PIN_CREATE', 'Create 4-digit PIN:', {
      ...data,
      pendingProvince: PROVINCES[index - 1],
    });
  }

  if (input.session.state === 'REGISTER_PIN_CREATE') {
    if (latest === '0')
      return continueResponse('MAIN_MENU', renderMainMenu(data), clearRegistrationDraft(data));
    if (!isNumericPin(latest))
      return continueResponse('REGISTER_PIN_CREATE', 'PIN must be 4 digits. Enter PIN:', data);
    return continueResponse('REGISTER_PIN_CONFIRM', 'Confirm 4-digit PIN:', {
      ...data,
      pendingPin: latest,
    });
  }

  if (input.session.state === 'REGISTER_PIN_CONFIRM') {
    if (latest === '0')
      return continueResponse('MAIN_MENU', renderMainMenu(data), clearRegistrationDraft(data));
    if (!isNumericPin(latest))
      return continueResponse('REGISTER_PIN_CONFIRM', 'PIN must be 4 digits. Confirm PIN:', data);
    if (latest !== String(data.pendingPin ?? '')) {
      return continueResponse('REGISTER_PIN_CREATE', 'PIN mismatch. Create PIN again:', {
        ...data,
        pendingPin: null,
      });
    }

    const firstName = String(data.pendingFirstName ?? '').trim();
    const surname = String(data.pendingSurname ?? '').trim();
    const province = String(data.pendingProvince ?? '').trim();
    if (!firstName || !surname || !province) {
      return continueResponse(
        'REGISTER_FIRST_NAME',
        'Registration reset. Enter first name:',
        clearRegistrationDraft(data)
      );
    }

    const registered = ussdUserStore.register({
      msisdn: input.session.msisdn,
      firstName,
      surname,
      province,
      pin: latest,
    });

    const nextData: UssdSessionData = clearRegistrationDraft({
      ...data,
      userId: registered.userId,
      customerName: registered.fullName,
      isRegistered: true,
      isAuthenticated: true,
    });

    return continueResponse(
      'MAIN_MENU',
      ['Registration successful.', renderMainMenu(nextData)].join('\n\n'),
      nextData
    );
  }

  if (input.session.state === 'LOGIN_PIN') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);
    if (!isNumericPin(latest))
      return continueResponse('LOGIN_PIN', 'Enter a valid 4-digit PIN:', data);

    const check = ussdUserStore.verifyPin(input.session.msisdn, latest);
    if (!check.ok || !check.user) {
      return continueResponse('LOGIN_PIN', 'Incorrect PIN. Try again:', data);
    }

    const nextData: UssdSessionData = {
      ...data,
      userId: check.user.userId,
      customerName: check.user.fullName,
      isRegistered: true,
      isAuthenticated: true,
    };

    return continueResponse(
      'MAIN_MENU',
      ['Login successful.', renderMainMenu(nextData)].join('\n\n'),
      nextData
    );
  }

  if (input.session.state === 'SHOP_MERCHANTS_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);

    const merchants = await getShopMerchantsForUssd();
    const currentPage = Number(data.selectedMerchantPage ?? 0);
    const { pageData } = renderMerchantMenu('Select store:', merchants, currentPage);

    if (latest === '9' && pageData.hasNext) {
      const nextPage = currentPage + 1;
      const rendered = renderMerchantMenu('Select store:', merchants, nextPage);
      return continueResponse('SHOP_MERCHANTS_MENU', rendered.message, {
        ...data,
        selectedMerchantPage: nextPage,
      });
    }

    if (latest === '8' && pageData.hasPrev) {
      const prevPage = currentPage - 1;
      const rendered = renderMerchantMenu('Select store:', merchants, prevPage);
      return continueResponse('SHOP_MERCHANTS_MENU', rendered.message, {
        ...data,
        selectedMerchantPage: prevPage,
      });
    }

    const pick = Number(latest);
    if (Number.isInteger(pick) && pick >= 1 && pick <= pageData.items.length) {
      const selectedMerchant = pageData.items[pick - 1];
      await recordShopSelected({
        sessionId: input.session.sessionId,
        msisdn: input.session.msisdn,
        shopId: selectedMerchant.id,
        shopName: selectedMerchant.displayName,
      });
      const products = await getProductsForMerchantUssd(selectedMerchant.id);
      const firstProducts = paginate(products, 0, PRODUCTS_PAGE_SIZE);
      const lines = [`${selectedMerchant.displayName} vouchers:`];
      firstProducts.items.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.productName} - R${product.consumerPrice.toFixed(2)}`);
      });
      if (firstProducts.hasNext) lines.push('9. Next');
      lines.push('0. Back');
      return continueResponse('SHOP_PRODUCTS_MENU', lines.join('\n'), {
        ...data,
        selectedMerchantId: selectedMerchant.id,
        selectedMerchantName: selectedMerchant.displayName,
        selectedProductPage: 0,
      });
    }

    return continueResponse('SHOP_MERCHANTS_MENU', 'Invalid option.\n0. Back', data);
  }

  if (input.session.state === 'SHOP_PRODUCTS_MENU') {
    if (latest === '0') {
      const merchants = await getShopMerchantsForUssd();
      const rendered = renderMerchantMenu(
        'Select store:',
        merchants,
        Number(data.selectedMerchantPage ?? 0)
      );
      return continueResponse('SHOP_MERCHANTS_MENU', rendered.message, data);
    }

    const merchantId = String(data.selectedMerchantId ?? '');
    const merchantName = String(data.selectedMerchantName ?? 'Merchant');
    const products = await getProductsForMerchantUssd(merchantId);
    const currentPage = Number(data.selectedProductPage ?? 0);
    const pageData = paginate(products, currentPage, PRODUCTS_PAGE_SIZE);

    if (latest === '9' && pageData.hasNext) {
      const nextPage = currentPage + 1;
      const nextPageData = paginate(products, nextPage, PRODUCTS_PAGE_SIZE);
      const lines = [`${merchantName} vouchers:`];
      nextPageData.items.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.productName} - R${product.consumerPrice.toFixed(2)}`);
      });
      if (nextPageData.hasNext) lines.push('9. Next');
      if (nextPageData.hasPrev) lines.push('8. Prev');
      lines.push('0. Back');
      return continueResponse('SHOP_PRODUCTS_MENU', lines.join('\n'), {
        ...data,
        selectedProductPage: nextPage,
      });
    }

    if (latest === '8' && pageData.hasPrev) {
      const prevPage = currentPage - 1;
      const prevPageData = paginate(products, prevPage, PRODUCTS_PAGE_SIZE);
      const lines = [`${merchantName} vouchers:`];
      prevPageData.items.forEach((product, index) => {
        lines.push(`${index + 1}. ${product.productName} - R${product.consumerPrice.toFixed(2)}`);
      });
      if (prevPageData.hasNext) lines.push('9. Next');
      if (prevPageData.hasPrev) lines.push('8. Prev');
      lines.push('0. Back');
      return continueResponse('SHOP_PRODUCTS_MENU', lines.join('\n'), {
        ...data,
        selectedProductPage: prevPage,
      });
    }

    const pick = Number(latest);
    if (Number.isInteger(pick) && pick >= 1 && pick <= pageData.items.length) {
      const product = pageData.items[pick - 1];
      const amount = Number((product.faceValue ?? product.consumerPrice).toFixed(2));
      const purchase = await purchaseUssdVoucher({
        sessionId: input.session.sessionId,
        msisdn: input.session.msisdn,
        shopId: merchantId,
        shopName: merchantName,
        productName: product.productName,
        amount,
      });
      const nextData: UssdSessionData = {
        ...data,
        lastVoucherCode: purchase.voucherCode,
        lastVoucherAmount: amount,
        walletBalance: purchase.walletBalance,
        caseId: purchase.caseId,
      };

      return continueResponse(
        'MAIN_MENU',
        [
          `Voucher purchased: ${purchase.voucherCode}`,
          `${merchantName} - ${product.productName}`,
          `Wallet balance: R${purchase.walletBalance.toFixed(2)}`,
          renderMainMenu(nextData),
        ].join('\n\n'),
        nextData
      );
    }

    return continueResponse('SHOP_PRODUCTS_MENU', 'Invalid option.\n0. Back', data);
  }

  if (input.session.state === 'WALLET_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);
    return continueResponse('WALLET_MENU', 'Reply 0 to go back.', data);
  }

  if (input.session.state === 'REDEEM_SHOP_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);

    const merchants = await getShopMerchantsForUssd();
    const currentPage = Number(data.selectedRedeemShopPage ?? 0);
    const { pageData } = renderMerchantMenu('Redeem at store:', merchants, currentPage);

    if (latest === '9' && pageData.hasNext) {
      const nextPage = currentPage + 1;
      const rendered = renderMerchantMenu('Redeem at store:', merchants, nextPage);
      return continueResponse('REDEEM_SHOP_MENU', rendered.message, {
        ...data,
        selectedRedeemShopPage: nextPage,
      });
    }

    if (latest === '8' && pageData.hasPrev) {
      const prevPage = currentPage - 1;
      const rendered = renderMerchantMenu('Redeem at store:', merchants, prevPage);
      return continueResponse('REDEEM_SHOP_MENU', rendered.message, {
        ...data,
        selectedRedeemShopPage: prevPage,
      });
    }

    const pick = Number(latest);
    if (Number.isInteger(pick) && pick >= 1 && pick <= pageData.items.length) {
      const selectedMerchant = pageData.items[pick - 1];
      return continueResponse('REDEEM_INPUT_MENU', 'Enter voucher code:\n(or 0 to go back)', {
        ...data,
        selectedRedeemShopId: selectedMerchant.id,
        selectedRedeemShopName: selectedMerchant.displayName,
      });
    }

    return continueResponse('REDEEM_SHOP_MENU', 'Invalid option.\n0. Back', data);
  }

  if (input.session.state === 'REDEEM_INPUT_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);
    const voucherCode = latest.toUpperCase();
    if (!voucherCode || voucherCode.length < 4) {
      return continueResponse(
        'REDEEM_INPUT_MENU',
        'Invalid voucher code. Enter valid code or 0.',
        data
      );
    }
    return continueResponse(
      'REDEEM_CONFIRM_MENU',
      `Confirm redeem ${voucherCode}?\n1. Yes\n0. Back`,
      {
        ...data,
        pendingRedeemVoucherCode: voucherCode,
      }
    );
  }

  if (input.session.state === 'REDEEM_CONFIRM_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);
    if (latest !== '1') {
      return continueResponse('REDEEM_CONFIRM_MENU', 'Reply 1 to confirm or 0 to go back.', data);
    }

    const voucherCode = String(data.pendingRedeemVoucherCode ?? '').toUpperCase();
    const amount = Number(data.lastVoucherAmount ?? 100);
    const redeem = await redeemUssdVoucher({
      sessionId: input.session.sessionId,
      msisdn: input.session.msisdn,
      shopId: String(data.selectedRedeemShopId ?? data.selectedMerchantId ?? 'unknown'),
      shopName: String(data.selectedRedeemShopName ?? data.selectedMerchantName ?? 'Merchant'),
      voucherCode,
      amount,
    });
    const nextData: UssdSessionData = {
      ...data,
      pendingRedeemVoucherCode: null,
      walletBalance: redeem.walletBalance,
      caseId: redeem.caseId,
    };

    return continueResponse(
      'MAIN_MENU',
      [
        `Voucher redeemed: ${voucherCode}`,
        `Wallet balance: R${redeem.walletBalance.toFixed(2)}`,
        renderMainMenu(nextData),
      ].join('\n\n'),
      nextData
    );
  }

  if (input.session.state === 'HELP_MENU') {
    if (latest === '0') return continueResponse('MAIN_MENU', renderMainMenu(data), data);
    return continueResponse('HELP_MENU', 'Reply 0 to go back.', data);
  }

  return endResponse('Session ended.', data);
}
