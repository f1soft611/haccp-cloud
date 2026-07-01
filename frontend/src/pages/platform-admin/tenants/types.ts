export type SearchField = 'tenantCode' | 'companyName' | 'adminName';

export type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE';

export type OnboardingStatusFilter =
  | 'all'
  | 'EMAIL_QUEUED'
  | 'EMAIL_SENT'
  | 'EMAIL_VERIFIED'
  | 'FIRST_SETUP_COMPLETED'
  | 'ACTIVE';

export type PlatformTenantSearchValue = {
  searchField: SearchField;
  searchKeyword: string;
  status: StatusFilter;
  onboardingStatus: OnboardingStatusFilter;
};
