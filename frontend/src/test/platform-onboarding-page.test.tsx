import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingPage } from '../pages/platform-admin/tenants/OnboardingPage';
import * as tenantService from '../services/organization/tenantService';
import * as planAccessService from '../services/platform-admin/planAccessService';
import { appTheme } from '../app/theme';
import { APP_LABELS } from '../shared/constants/labels';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <OnboardingPage />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

async function fillStep1({
  companyName = '테스트푸드',
  brn = '123-45-12345',
  corporateNumber = '110111-1234567',
  businessType = '식품제조업',
  businessCategory = '즉석조리식품',
  adminName = '홍길동',
  adminEmail = 'admin@testfood.com',
  registrationDate = '',
} = {}) {
  await screen.findByRole('option', { name: '기본 플랜' });

  fireEvent.change(
    screen.getByLabelText(new RegExp(APP_LABELS.field.planCode)),
    {
      target: { value: 'A' },
    },
  );

  if (companyName) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.companyName)),
      {
        target: { value: companyName },
      },
    );
  }
  if (brn) {
    fireEvent.change(
      screen.getByLabelText(
        new RegExp(APP_LABELS.field.businessRegistrationNumber),
      ),
      { target: { value: brn } },
    );
  }
  if (corporateNumber) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.corporateNumber)),
      {
        target: { value: corporateNumber },
      },
    );
  }
  if (businessType) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.businessType)),
      {
        target: { value: businessType },
      },
    );
  }
  if (businessCategory) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.businessCategory)),
      {
        target: { value: businessCategory },
      },
    );
  }
  if (adminName) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.adminName)),
      {
        target: { value: adminName },
      },
    );
  }
  if (adminEmail) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.adminEmail)),
      {
        target: { value: adminEmail },
      },
    );
  }
  if (registrationDate) {
    fireEvent.change(
      screen.getByLabelText(new RegExp(APP_LABELS.field.registrationDate)),
      {
        target: { value: registrationDate },
      },
    );
  }
}

describe('Platform onboarding page wizard', () => {
  beforeEach(() => {
    vi.spyOn(planAccessService, 'listPlanSummaries').mockResolvedValue([
      {
        planCode: 'A',
        planName: '기본 플랜',
        planDesc: '',
        useAt: 'Y',
        featureCount: 0,
        menuCount: 0,
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows step 1 form initially', () => {
    renderPage();
    expect(
      screen.getByLabelText(new RegExp(APP_LABELS.field.companyName)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    ).toBeInTheDocument();
  });

  it('shows validation error when required fields are empty on step 1', async () => {
    renderPage();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(APP_LABELS.message.onboardingFailed),
    ).toBeInTheDocument();
  });

  it('shows BRN format error for invalid format', async () => {
    renderPage();
    await fillStep1({ brn: '12345' });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(APP_LABELS.message.onboardingBrnFormatError),
    ).toBeInTheDocument();
  });

  it('shows corporate number format error when the value is not 13 digits', async () => {
    renderPage();
    await fillStep1({ corporateNumber: '110111-123456' });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(
        APP_LABELS.message.onboardingCorporateNumberFormatError,
      ),
    ).toBeInTheDocument();
  });

  it('shows admin email format error for an invalid email', async () => {
    renderPage();
    await fillStep1({ adminEmail: 'not-an-email' });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(
        APP_LABELS.message.onboardingAdminEmailFormatError,
      ),
    ).toBeInTheDocument();
  });

  it('shows registration date error for a padded 2-digit year (e.g. 0025)', async () => {
    renderPage();
    await fillStep1({ registrationDate: '0025-08-27' });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(
        APP_LABELS.message.onboardingRegistrationDateFormatError,
      ),
    ).toBeInTheDocument();
  });

  it('formats corporate number like a 13-digit registration number', async () => {
    renderPage();
    const corporateInput = await screen.findByLabelText(
      new RegExp(APP_LABELS.field.corporateNumber),
    );
    fireEvent.change(corporateInput, {
      target: { value: '1101111234567' },
    });

    expect(corporateInput).toHaveValue('110111-1234567');
  });

  it('advances to step 2 with valid inputs', async () => {
    renderPage();
    await fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(APP_LABELS.onboarding.confirmTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
    ).toBeInTheDocument();
  });

  it('goes back to step 1 when edit button clicked', async () => {
    renderPage();
    await fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    await screen.findByText(APP_LABELS.onboarding.confirmTitle);
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.edit }),
    );
    expect(
      screen.getByLabelText(new RegExp(APP_LABELS.field.companyName)),
    ).toBeInTheDocument();
  });

  it('issues tenant code and shows step 3 on success', async () => {
    vi.spyOn(tenantService, 'issueTenantCode').mockResolvedValueOnce({
      tenantCode: 'TENANT_2606220001',
      companyName: '테스트푸드',
      businessRegistrationNumber: '123-45-12345',
      adminEmail: 'admin@testfood.com',
      createdAt: '2026-06-22T10:00:00.000Z',
      mailDispatchStatus: 'QUEUED',
    });

    renderPage();
    await fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    await screen.findByText(APP_LABELS.onboarding.confirmTitle);
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
    );
    expect(
      await screen.findByText(APP_LABELS.onboarding.completeTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(APP_LABELS.message.onboardingSuccess),
    ).toBeInTheDocument();
  });

  it('shows duplicate BRN error on 409 response', async () => {
    vi.spyOn(tenantService, 'listSampleTenants').mockResolvedValueOnce([]);
    vi.spyOn(tenantService, 'issueTenantCode').mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          code: 'DUPLICATE_BRN',
          message: '이미 등록된 사업자번호입니다.',
        },
      },
    });

    renderPage();
    await fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    await screen.findByText(APP_LABELS.onboarding.confirmTitle);
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(APP_LABELS.message.onboardingDuplicateBrn);
  });

  it('shows a refined message when admin email unique constraint is returned', async () => {
    vi.spyOn(tenantService, 'listSampleTenants').mockResolvedValueOnce([]);
    vi.spyOn(tenantService, 'issueTenantCode').mockRejectedValueOnce({
      response: {
        status: 500,
        data: {
          message:
            'Caused by: org.postgresql.util.PSQLException: 오류: 중복된 키 값이 "tb_tenant_admin_email_key" 고유 제약 조건을 위반함',
        },
      },
    });

    renderPage();
    await fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    await screen.findByText(APP_LABELS.onboarding.confirmTitle);
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      APP_LABELS.message.onboardingDuplicateAdminEmail,
    );
  });

  it('renders issued tenant history table', async () => {
    vi.spyOn(tenantService, 'listSampleTenants').mockResolvedValueOnce([
      {
        tenantCode: 'TENANT-SAMPLE-01',
        companyName: '샘플푸드 1호',
        adminEmail: 'admin1@samplefood.com',
        issuedAt: '2026-06-10T09:00:00.000Z',
      },
      {
        tenantCode: 'TENANT-SAMPLE-02',
        companyName: '샘플푸드 2호',
        adminEmail: 'admin2@samplefood.com',
        issuedAt: '2026-06-10T09:30:00.000Z',
      },
    ]);

    renderPage();
    expect(
      await screen.findByText(APP_LABELS.onboarding.sampleTenantListTitle),
    ).toBeInTheDocument();
    expect(await screen.findByText('TENANT-SAMPLE-01')).toBeInTheDocument();
  });

  it('renders tenant history with metadata columns', async () => {
    vi.spyOn(tenantService, 'listSampleTenants').mockResolvedValueOnce([
      {
        tenantCode: 'TENANT-META',
        companyName: '샘플푸드 메타',
        adminEmail: 'meta@sample.com',
        issuedAt: '2026-06-11T10:00:00.000Z',
      },
    ]);

    renderPage();
    expect(await screen.findByText('TENANT-META')).toBeInTheDocument();
    expect(await screen.findByText('meta@sample.com')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2026-06-11/)).toBeInTheDocument();
    });
  });
});
