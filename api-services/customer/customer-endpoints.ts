/** Customer-app (cp.<env>.augmont.com) gold-loan-backend paths. Add new endpoints here, not inline in specs. */
export const CUSTOMER_ENDPOINTS = {
  pinLogin: '/api/customer/app/validate-pin-biometric/v2',
  checkDevicePin: '/api/customer/app/check-device-pin',
  sendLoginOtp: '/api/customer-otp/customer-send-otp',
  verifyLoginOtp: '/api/auth/verify-customer-login',
  addPin: '/api/customer/app/add-pin',
  personalInfo: '/api/customer/app/personal-info',
  paymentGatewayDetails: '/api/customer/app/payment-gateway-details',
  sipApplicationDetails: '/api/sip/sip-application/details',
  sipSubmit: '/api/sip/sip-application/submit-sip',
  sipStatus: (tempSipId: number | string) => `/api/customer/app/status?productName=SIP&id=${tempSipId}`,
} as const;

/** Sent on every customer-app call — without it some endpoints answer 401 "You are not login customer". */
export const CUSTOMER_APP_HEADERS = { iscustomerapp: 'true' } as const;
