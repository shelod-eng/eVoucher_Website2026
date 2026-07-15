export type UssdAction = 'CON' | 'END';

export type UssdMenuState =
  | 'WELCOME'
  | 'MAIN_MENU'
  | 'REGISTER_FIRST_NAME'
  | 'REGISTER_SURNAME'
  | 'REGISTER_PROVINCE'
  | 'REGISTER_PIN_CREATE'
  | 'REGISTER_PIN_CONFIRM'
  | 'LOGIN_PIN'
  | 'SHOP_MERCHANTS_MENU'
  | 'SHOP_PRODUCTS_MENU'
  | 'WALLET_MENU'
  | 'REDEEM_INPUT_MENU'
  | 'REDEEM_SHOP_MENU'
  | 'REDEEM_CONFIRM_MENU'
  | 'HELP_MENU'
  | 'EXIT';

export type UssdSessionData = {
  userId?: string | null;
  customerName?: string | null;
  isAuthenticated?: boolean;
  isRegistered?: boolean;
  pendingFirstName?: string | null;
  pendingSurname?: string | null;
  pendingProvince?: string | null;
  pendingPin?: string | null;
  lastError?: string | null;
  selectedMerchantId?: string | null;
  selectedMerchantName?: string | null;
  selectedMerchantPage?: number;
  selectedProductPage?: number;
  selectedRedeemShopId?: string | null;
  selectedRedeemShopName?: string | null;
  selectedRedeemShopPage?: number;
  pendingRedeemVoucherCode?: string | null;
  lastVoucherCode?: string | null;
  lastVoucherAmount?: number | null;
  walletBalance?: number | null;
  caseId?: string | null;
};

export type UssdSession = {
  sessionId: string;
  msisdn: string;
  state: UssdMenuState;
  data?: UssdSessionData;
  createdAt: number;
  updatedAt: number;
};

export type UssdRequestPayload = {
  sessionId: string;
  msisdn: string;
  text?: string;
  networkCode?: string;
  serviceCode?: string;
  provider?: string;
};

export type UssdResponsePayload = {
  action: UssdAction;
  message: string;
  state: UssdMenuState;
  data?: UssdSessionData;
};
