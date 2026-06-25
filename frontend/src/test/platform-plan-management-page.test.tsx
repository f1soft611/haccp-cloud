import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../app/providers/AppProviders';
import { PlatformPlanManagementPage } from '../pages/platform-admin/plans/PlatformPlanManagementPage';

const {
  listPlanSummariesMock,
  getPlanMenuCodesMock,
  getPlanFeaturesMock,
  savePlanMenuCodesMock,
  savePlanFeaturesMock,
  listPlatformMenusMock,
} = vi.hoisted(() => ({
  listPlanSummariesMock: vi.fn(),
  getPlanMenuCodesMock: vi.fn(),
  getPlanFeaturesMock: vi.fn(),
  savePlanMenuCodesMock: vi.fn(),
  savePlanFeaturesMock: vi.fn(),
  listPlatformMenusMock: vi.fn(),
}));

vi.mock('../services/plan/planAccessService', () => ({
  listPlanSummaries: listPlanSummariesMock,
  getPlanMenuCodes: getPlanMenuCodesMock,
  getPlanFeatures: getPlanFeaturesMock,
  savePlanMenuCodes: savePlanMenuCodesMock,
  savePlanFeatures: savePlanFeaturesMock,
}));

vi.mock('../services/platform/platformMenuService', () => ({
  listPlatformMenus: listPlatformMenusMock,
}));

function renderPage() {
  render(
    <AppProviders>
      <PlatformPlanManagementPage />
    </AppProviders>,
  );
}

describe('PlatformPlanManagementPage', () => {
  beforeEach(() => {
    listPlanSummariesMock.mockReset();
    getPlanMenuCodesMock.mockReset();
    getPlanFeaturesMock.mockReset();
    savePlanMenuCodesMock.mockReset();
    savePlanFeaturesMock.mockReset();
    listPlatformMenusMock.mockReset();

    listPlanSummariesMock.mockResolvedValue([
      {
        planCode: 'A',
        planName: 'Basic',
        planDesc: '기본 플랜',
        useAt: 'Y',
        featureCount: 2,
        menuCount: 3,
      },
      {
        planCode: 'B',
        planName: 'Standard',
        planDesc: '표준 플랜',
        useAt: 'Y',
        featureCount: 4,
        menuCount: 5,
      },
    ]);

    getPlanMenuCodesMock.mockResolvedValue(['MENU_DASHBOARD']);
    getPlanFeaturesMock.mockResolvedValue([
      {
        featureCode: 'FEATURE_DOC_WORKFLOW',
        featureName: 'Document workflow',
        featureType: 'BOOLEAN',
        enabled: true,
        limitValue: null,
      },
      {
        featureCode: 'LIMIT_USER_COUNT',
        featureName: 'Maximum users',
        featureType: 'LIMIT',
        enabled: true,
        limitValue: 20,
      },
    ]);

    savePlanMenuCodesMock.mockResolvedValue(['MENU_DASHBOARD']);
    savePlanFeaturesMock.mockResolvedValue([
      {
        featureCode: 'FEATURE_DOC_WORKFLOW',
        featureName: 'Document workflow',
        featureType: 'BOOLEAN',
        enabled: true,
        limitValue: null,
      },
      {
        featureCode: 'LIMIT_USER_COUNT',
        featureName: 'Maximum users',
        featureType: 'LIMIT',
        enabled: true,
        limitValue: 20,
      },
    ]);

    listPlatformMenusMock.mockResolvedValue([
      {
        menuId: 'PM-PARENT',
        menuCode: 'MENU_PARENT',
        menuNm: 'Parent Menu',
        menuDc: '상위 메뉴',
        parentMenuId: null,
        menuOrdr: 1,
        menuUrl: '/parent',
        iconNm: 'Dashboard',
        useAt: 'Y',
        frstRegistPnttm: '',
        frstRegisterId: '',
        lastUpdtPnttm: '',
        lastUpdusrId: '',
      },
      {
        menuId: 'PM-CHILD',
        menuCode: 'MENU_CHILD',
        menuNm: 'Child Menu',
        menuDc: '하위 메뉴',
        parentMenuId: 'PM-PARENT',
        menuOrdr: 2,
        menuUrl: '/child',
        iconNm: 'History',
        useAt: 'Y',
        frstRegistPnttm: '',
        frstRegisterId: '',
        lastUpdtPnttm: '',
        lastUpdusrId: '',
      },
    ]);
  });

  it('uses icon action buttons and opens mapping dialogs', async () => {
    renderPage();

    expect(
      await screen.findByRole('columnheader', { name: '플랜 코드' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('columnheader', { name: '플랜 설명' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Basic')).toBeInTheDocument();
    expect(await screen.findByText('기본 플랜')).toBeInTheDocument();

    const row = screen.getByText('Basic').closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(
      within(row as HTMLTableRowElement).getByRole('button', {
        name: '메뉴 매핑',
      }),
    );
    const menuDialog = await screen.findByRole('dialog');
    expect(within(menuDialog).getByText('메뉴 매핑')).toBeInTheDocument();

    fireEvent.click(within(menuDialog).getByRole('button', { name: '취소' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(
      within(row as HTMLTableRowElement).getByRole('button', {
        name: '기능 매핑',
      }),
    );
    const featureDialog = await screen.findByRole('dialog');
    expect(
      within(featureDialog).getByRole('columnheader', { name: '기능명' }),
    ).toBeInTheDocument();
    expect(
      within(featureDialog).getByRole('columnheader', { name: '기능 타입' }),
    ).toBeInTheDocument();
    expect(
      within(featureDialog).getByRole('columnheader', { name: '활성 여부' }),
    ).toBeInTheDocument();
    expect(
      within(featureDialog).getByRole('columnheader', { name: '값' }),
    ).toBeInTheDocument();
  });

  it('checks all child menus when parent menu is checked in tree dialog', async () => {
    renderPage();

    await screen.findByText('Basic');
    const row = screen.getByText('Basic').closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(
      within(row as HTMLTableRowElement).getByRole('button', {
        name: '메뉴 매핑',
      }),
    );

    const menuDialog = await screen.findByRole('dialog');
    const parentCheckbox = within(menuDialog).getByRole('checkbox', {
      name: 'Parent Menu (/parent)',
    });
    const childCheckbox = within(menuDialog).getByRole('checkbox', {
      name: 'Child Menu (/child)',
    });

    fireEvent.click(parentCheckbox);

    expect(parentCheckbox).toBeChecked();
    expect(childCheckbox).toBeChecked();
  });

  it('saves feature mapping grid values', async () => {
    renderPage();

    await screen.findByText('Basic');
    const row = screen.getByText('Basic').closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(
      within(row as HTMLTableRowElement).getByRole('button', {
        name: '기능 매핑',
      }),
    );

    const featureDialog = await screen.findByRole('dialog');
    await within(featureDialog).findByText('Document workflow');
    const workflowRow = within(featureDialog)
      .getByText('Document workflow')
      .closest('tr');
    expect(workflowRow).not.toBeNull();
    expect(
      within(workflowRow as HTMLTableRowElement).queryByText(
        'Document workflow',
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      within(workflowRow as HTMLTableRowElement).getByRole('checkbox', {
        name: 'Document workflow 활성 여부',
      }),
    );

    const limitInput =
      within(featureDialog).getByLabelText('LIMIT_USER_COUNT 값');
    fireEvent.change(limitInput, {
      target: { value: '30' },
    });

    fireEvent.click(
      within(featureDialog).getByRole('button', { name: '저장' }),
    );

    await waitFor(() => {
      expect(savePlanFeaturesMock).toHaveBeenCalled();
      expect(savePlanFeaturesMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planCode: 'A',
        }),
      );
    });
  });

  it('applies search filters when 조회 button is clicked', async () => {
    renderPage();

    await screen.findByText('Basic');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '검색 조건' }));
    fireEvent.click(screen.getByRole('option', { name: '플랜 코드' }));

    fireEvent.change(screen.getByLabelText('검색어'), {
      target: { value: 'B' },
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '상태' }));
    fireEvent.click(screen.getByRole('option', { name: '활성' }));

    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    await waitFor(() => {
      expect(screen.queryByText('Basic')).not.toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });
  });
});
