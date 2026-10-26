export interface PinLoginResponse {
  message: string;
  token: string;
}

export interface PersonalInfoResponse {
  data: {
    mobileNumber: string;
  };
}
