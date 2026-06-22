import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { OnboardingPage } from '../pages/tenant-management/onboarding/OnboardingPage';
import { appTheme } from '../app/theme';
import { server } from '../mocks/server';
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

function fillStep1({
  companyName = '테스트푸드',
  brn = '123-45-12345',
  corporateNumber = '110111-1234567',
  businessType = '식품제조업',
  businessCategory = '즉석조리식품',
  adminName = '홍길동',
  adminEmail = 'admin@testfood.com',
} = {}) {
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
}

describe('Platform onboarding page wizard', () => {
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
    fillStep1({ brn: '12345' });
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    expect(
      await screen.findByText(APP_LABELS.message.onboardingBrnFormatError),
    ).toBeInTheDocument();
  });

  it('advances to step 2 with valid inputs', async () => {
    renderPage();
    fillStep1();
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
    fillStep1();
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
    server.use(
      http.post('/api/tenants/issue-code', () =>
        HttpResponse.json(
          {
            tenantCode: 'TENANT_2606220001',
            companyName: '테스트푸드',
            businessRegistrationNumber: '123-45-12345',
            adminEmail: 'admin@testfood.com',
            createdAt: '2026-06-22T10:00:00.000Z',
            mailDispatchStatus: 'QUEUED',
          },
          { status: 201 },
        ),
      ),
    );

    renderPage();
    fillStep1();
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
    server.use(
      http.post('/api/tenants/issue-code', () =>
        HttpResponse.json(
          { code: 'DUPLICATE_BRN', message: '이미 등록된 사업자번호입니다.' },
          { status: 409 },
        ),
      ),
    );

    renderPage();
    fillStep1();
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.nextStep }),
    );
    await screen.findByText(APP_LABELS.onboarding.confirmTitle);
    fireEvent.click(
      screen.getByRole('button', { name: APP_LABELS.action.issueTenantCode }),
    );
    expect(
      await screen.findByText(
        new RegExp(
          `${APP_LABELS.message.onboardingDuplicateBrn}|${APP_LABELS.message.onboardingFailed}`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it('renders issued tenant history table', async () => {
    renderPage();
    expect(
      await screen.findByText(APP_LABELS.onboarding.sampleTenantListTitle),
    ).toBeInTheDocument();
    expect(await screen.findByText('TENANT-SAMPLE-01')).toBeInTheDocument();
  });

  it('renders tenant history with metadata columns', async () => {
    server.use(
      http.get('/api/tenants/samples', () =>
        HttpResponse.json([
          {
            tenantCode: 'TENANT-META',
            companyName: '샘플푸드 메타',
            adminEmail: 'meta@sample.com',
            issuedAt: '2026-06-11T10:00:00.000Z',
          },
        ]),
      ),
    );

    renderPage();
    expect(await screen.findByText('TENANT-META')).toBeInTheDocument();
    expect(await screen.findByText('meta@sample.com')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2026-06-11/)).toBeInTheDocument();
    });
  });
});
