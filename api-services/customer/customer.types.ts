export interface PinLoginResponse {
  message: string;
  token: string;
}

export interface PersonalInfoResponse {
  data: {
    mobileNumber: string;
  };
}

export interface PaymentGatewayDetailsRequest {
  module: string;
  investmentType?: 'daily' | 'weekly' | 'monthly';
  /** YYYY-MM-DD */
  sipCycleDate?: string;
  investmentAmount?: number;
  isStepUpSip?: boolean;
}

export interface PaymentGatewayMode {
  id: number;
  mode: string;
  bearing: string | null;
  paymentGateway: string;
  name: string;
}

export interface PaymentGatewayGroup {
  paymentGateway: string;
  gateways: PaymentGatewayMode[];
  logo: string;
}

export interface PaymentGatewayDetailsResponse {
  message: string;
  data: PaymentGatewayGroup[];
  /** Backend's spelling. Flat list of every mode in `data`. */
  gatewayDeatils: PaymentGatewayMode[];
  newGatewayDetails: PaymentGatewayGroup[];
  defaultGateway: string;
}

export interface CustomerIdentity {
  id: number;
  customerUniqueId: string;
  mobileNumber: string;
  email: string;
}

export type SipInvestmentType = 'daily' | 'weekly' | 'monthly';

export interface SipApplicationRequest {
  applicationDate: string;
  customerId: number;
  customerUniqueId: string;
  email: string;
  investmentAmount: number;
  investmentType: SipInvestmentType;
  isEditSip: boolean;
  isFdEnable: boolean;
  isStepUp: boolean;
  mandate: string;
  metalType: string;
  mobileNumber: string;
  planName: string;
  sipCycleDate: string;
  sipInvestmentTenureId: number;
  transactionType: string;
  gatewayName: string;
}

export interface SipApplicationResponse {
  message: string;
  data: {
    /** The temp SIP id that submit-sip and status take. */
    id: number;
    sipApplicationUniqueId: string;
    customerId: number;
    customerUniqueId: string;
    investmentAmount: number;
    investmentType: SipInvestmentType;
    metalType: string;
    planName: string;
    sipCycleDate: string;
    sipStartDate: string;
    paymentGatewayId: number;
    isSipCreated: boolean;
    isActive: boolean;
  };
}

export interface SipSubmitRequest {
  emandate: boolean;
  tempSipId: number;
}

export interface SipSubmitResponse {
  message: string;
  data: {
    /** Gateway order id (named razorpay* even when the gateway is yesbank). */
    razorpayOrderId: string;
    /** `data:image/png;base64,...` — the UPI autopay mandate QR the customer scans. */
    qrCode: string;
  };
}
