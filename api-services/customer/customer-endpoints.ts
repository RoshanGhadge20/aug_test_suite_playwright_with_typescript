/** Customer-app (cp.<env>.augmont.com) gold-loan-backend paths. Add new endpoints here, not inline in specs. */
export const CUSTOMER_ENDPOINTS = {
  pinLogin: '/api/customer/app/validate-pin-biometric/v2',
  personalInfo: '/api/customer/app/personal-info',
} as const;

/** Sent on every customer-app call — without it some endpoints answer 401 "You are not login customer". */
export const CUSTOMER_APP_HEADERS = { iscustomerapp: 'true' } as const;
