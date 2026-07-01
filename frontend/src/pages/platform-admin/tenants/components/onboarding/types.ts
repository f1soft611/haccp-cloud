export type TenantOnboardingFormData = {
  companyName: string;
  planCode: string;
  businessRegistrationNumber: string;
  corporateNumber: string;
  representativeName: string;
  businessType: string;
  businessCategory: string;
  address: string;
  phoneNumber: string;
  registrationDate: string;
  adminName: string;
  adminEmail: string;
};

export const EMPTY_ONBOARDING_FORM: TenantOnboardingFormData = {
  companyName: '',
  planCode: '',
  businessRegistrationNumber: '',
  corporateNumber: '',
  representativeName: '',
  businessType: '',
  businessCategory: '',
  address: '',
  phoneNumber: '',
  registrationDate: '',
  adminName: '',
  adminEmail: '',
};
