import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/providers/AppProviders';
import { HaccpBaseManagementPage } from '../../../pages/documents/haccp-base/HaccpBaseManagementPage';

const { listHaccpBaseCategoriesMock, listHaccpBaseWorksMock, listUsersMock, createHaccpBaseWorkMock } =
  vi.hoisted(() => ({
    listHaccpBaseCategoriesMock: vi.fn(async () => [
      {
        id: '10',
        tenantCode: 'PLATFORM',
        categoryCode: '001',
        categoryName: 'HACCP문서(HA)',
        sortOrder: 1,
        active: true,
        createdBy: '관리자',
        createdAt: '2026-07-07 10:00',
      },
      {
        id: '11',
        tenantCode: 'PLATFORM',
        categoryCode: 'HCP-CALIB',
        categoryName: '검교정 일정관리',
        sortOrder: 2,
        active: true,
        createdBy: '관리자',
        createdAt: '2026-07-07 10:00',
      },
    ]),
    listHaccpBaseWorksMock: vi.fn(async () => [
      {
        id: '1',
        tenantCode: 'PLATFORM',
        categoryGroupId: '11',
        categoryCode: 'HCP-CALIB',
        categoryName: '검교정 일정관리',
        divisionCode: '001',
        divisionName: '기안서',
        cycle: 'ANYTIME', cycleName: '수시',
        active: true,
        expirationApply: true,
        expirationNoticeStatus: 'DAY',
        expirationNoticeCount: 30,
        createdBy: '고대성',
        createdAt: '2026-07-07 10:00',
        owner: '검토:금도연 / 승인:고대성',
        reviewerId: '101',
        reviewerName: '금도연',
        approverId: '102',
        approverName: '고대성',
        assigneeMapped: true,
      },
      {
        id: '2',
        tenantCode: 'PLATFORM',
        categoryGroupId: '10',
        categoryCode: '001',
        categoryName: 'HACCP문서(HA)',
        divisionCode: '002',
        divisionName: '폐기 양식',
        cycle: 'DAY', cycleName: '일',
        active: false,
        createdBy: '고대성',
        createdAt: '2026-07-07 10:00',
        owner: '검토:금도연 / 승인:고대성',
        reviewerId: '101',
        reviewerName: '금도연',
        approverId: '102',
        approverName: '고대성',
        assigneeMapped: true,
      },
    ]),
    listUsersMock: vi.fn(async () => [
      {
        id: '101',
        tenantCode: 'PLATFORM',
        name: '금도연',
        email: 'reviewer@f1soft.co.kr',
        department: '품질팀',
        roleCode: 'TENANT_USER',
        roleCodes: ['TENANT_USER'],
        role: 'TENANT_USER',
        active: true,
      },
      {
        id: '102',
        tenantCode: 'PLATFORM',
        name: '고대성',
        email: 'approver@f1soft.co.kr',
        department: '품질팀',
        roleCode: 'TENANT_USER',
        roleCodes: ['TENANT_USER'],
        role: 'TENANT_USER',
        active: true,
      },
    ]),
    createHaccpBaseWorkMock: vi.fn<(payload: unknown) => Promise<object>>(async () => ({})),
  }));

// HCP- 분류 + 수시 + 만료일 관리 해당까지 고른 업무 추가 다이얼로그 열기
async function openExpirationCreateDialog() {
  render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
  );
  await screen.findByText('기안서');
  fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '분류' }));
  fireEvent.click(await screen.findByRole('option', { name: '검교정 일정관리' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
  fireEvent.click(await screen.findByRole('option', { name: '수시' }));
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '만료일 관리 양식' }));
  fireEvent.click(await screen.findByRole('option', { name: '해당' }));
}

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../services/documents/haccpBaseCategoryService', () => ({
  listHaccpBaseCategories: listHaccpBaseCategoriesMock,
}));

vi.mock('../../../services/documents/haccpBaseWorkService', () => ({
  listHaccpBaseWorks: listHaccpBaseWorksMock,
  createHaccpBaseWork: createHaccpBaseWorkMock,
  updateHaccpBaseWork: vi.fn(),
}));

vi.mock('../../../services/organization/usersService', () => ({
  listUsers: listUsersMock,
}));

describe('HaccpBaseManagementPage', () => {
  it('renders columns and opens create modal', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    expect(await screen.findByText('No')).toBeInTheDocument();
    expect(await screen.findByText('업무명')).toBeInTheDocument();
    expect(await screen.findByText('업무분류')).toBeInTheDocument();
    expect(await screen.findByText('작성주기')).toBeInTheDocument();
    expect(screen.queryByText('등록자')).not.toBeInTheDocument();
    expect(screen.queryByText('등록일')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '업무분류 설정' }));
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/categories');

    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    expect(
      screen.getByRole('dialog', { name: /업무 추가/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /업무코드/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /업무명/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '분류' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: '작성주기' }),
    ).toBeInTheDocument();
  });

  it('opens editor page when document status icon is clicked', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: '문서 생성 페이지 이동' }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/docs/haccp-base/editor/1');
  });

  it('opens edit dialog from grid action', async () => {
    render(
      <AppProviders>
        <HaccpBaseManagementPage />
      </AppProviders>,
    );

    await screen.findByRole('button', { name: '업무 수정' });
    fireEvent.click(screen.getByRole('button', { name: '업무 수정' }));
    expect(
      screen.getByRole('dialog', { name: /업무 수정/ }),
    ).toBeInTheDocument();
  });

  it('lists cycle options from common codes and submits the selected code', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      '일', '주', '월', '분기', '반기', '연간', '수시',
    ]);
    fireEvent.click(screen.getByRole('option', { name: '분기' }));

    fireEvent.change(screen.getByRole('textbox', { name: /업무명/ }), {
      target: { value: '분기 점검' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /검토자/ }), {
      target: { value: '금도연' },
    });
    fireEvent.click(await screen.findByRole('option', { name: '금도연' }));
    fireEvent.change(screen.getByRole('combobox', { name: /승인자/ }), {
      target: { value: '고대성' },
    });
    fireEvent.click(await screen.findByRole('option', { name: '고대성' }));

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    // mutationFn 두 번째 인자(React Query context) 유무와 무관하게 첫 인자만 검사
    await vi.waitFor(() => expect(createHaccpBaseWorkMock).toHaveBeenCalled());
    expect(createHaccpBaseWorkMock.mock.calls[0][0]).toMatchObject({ cycle: 'QUARTER' });
  });

  it('shows expiration select only for HCP- category with ANYTIME cycle', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    expect(
        screen.queryByRole('combobox', { name: '만료일 관리 양식' }),
    ).not.toBeInTheDocument();
    expect(
        screen.getByRole('combobox', { name: '결재 적용 여부' }),
    ).toHaveTextContent(/^적용$/);

    // 수시여도 HCP- 분류가 아니면 숨김
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '수시' }));
    expect(
        screen.queryByRole('combobox', { name: '만료일 관리 양식' }),
    ).not.toBeInTheDocument();

    // HCP- 분류 + 수시 -> 노출, 기본값 미해당
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '분류' }));
    fireEvent.click(await screen.findByRole('option', { name: '검교정 일정관리' }));
    expect(
        screen.getByRole('combobox', { name: '만료일 관리 양식' }),
    ).toHaveTextContent('미해당');

    // 수시가 아닌 주기로 바꾸면 숨김
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '주' }));
    expect(
        screen.queryByRole('combobox', { name: '만료일 관리 양식' }),
    ).not.toBeInTheDocument();
  });

  it('clears and disables reviewer/approver when approval is not applied', async () => {
    createHaccpBaseWorkMock.mockClear();
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    fireEvent.change(screen.getByRole('textbox', { name: /업무명/ }), {
      target: { value: '미적용 점검' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /검토자/ }), {
      target: { value: '금도연' },
    });
    fireEvent.click(await screen.findByRole('option', { name: '금도연' }));

    // 결재 적용 상태에서는 승인자가 없으면 등록 불가
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '결재 적용 여부' }));
    fireEvent.click(await screen.findByRole('option', { name: '미적용' }));

    expect(screen.getByRole('combobox', { name: /검토자/ })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /검토자/ })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /승인자/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await vi.waitFor(() => expect(createHaccpBaseWorkMock).toHaveBeenCalled());
    expect(createHaccpBaseWorkMock.mock.calls[0][0]).toMatchObject({
      approvalApply: false,
      reviewerId: '',
      approverId: '',
    });
  });

  it('keeps the grid table wide enough to scroll horizontally', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    expect(
        screen.getByRole('table', { name: 'HACCP 양식 목록' }),
    ).toHaveStyle({ minWidth: '1142px' });
  });

  it('filters works by use status with 사용 as the default', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    // 기본값: 사용 -> 미사용 업무 숨김
    await screen.findByText('기안서');
    expect(screen.getByRole('combobox', { name: '사용유무' })).toHaveTextContent(/^사용$/);
    expect(screen.queryByText('폐기 양식')).not.toBeInTheDocument();

    // 전체 -> 선택만 바꾸면 반영 안 됨, 조회 후 모두 노출
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용유무' }));
    fireEvent.click(await screen.findByRole('option', { name: '전체' }));
    expect(screen.queryByText('폐기 양식')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '조회' }));
    expect(await screen.findByText('폐기 양식')).toBeInTheDocument();
    expect(screen.getByText('기안서')).toBeInTheDocument();

    // 미사용 -> 미사용 업무만 노출
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용유무' }));
    fireEvent.click(await screen.findByRole('option', { name: '미사용' }));
    fireEvent.click(screen.getByRole('button', { name: '조회' }));
    expect(await screen.findByText('폐기 양식')).toBeInTheDocument();
    expect(screen.queryByText('기안서')).not.toBeInTheDocument();
  });

  it('selects multiple assignees with the user select dialog', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));

    fireEvent.click(screen.getByRole('textbox', { name: '담당자' }));
    const picker = await screen.findByRole('dialog', { name: '담당자 선택' });
    fireEvent.click(within(picker).getByText('금도연'));
    fireEvent.click(within(picker).getByText('고대성'));
    fireEvent.click(within(picker).getByRole('button', { name: '확인 (2명)' }));

    expect(screen.getByRole('textbox', { name: '담당자' })).toHaveValue('금도연, 고대성');
  });

  it('shows expiration notice fields only when expiration form is applied', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );
    await screen.findByText('기안서');
    fireEvent.click(screen.getByRole('button', { name: '+ 업무 추가' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '분류' }));
    fireEvent.click(await screen.findByRole('option', { name: '검교정 일정관리' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '수시' }));

    // 미해당 -> 안내 입력칸 숨김
    expect(screen.queryByRole('combobox', { name: '만료일 안내 기준' })).not.toBeInTheDocument();

    // 해당 -> 안내 기준 없음, 계산숫자 비활성
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '만료일 관리 양식' }));
    fireEvent.click(await screen.findByRole('option', { name: '해당' }));
    expect(screen.getByRole('combobox', { name: '만료일 안내 기준' })).toHaveTextContent('없음');
    expect(screen.getByLabelText(/만료일 안내 계산숫자/)).toBeDisabled();
  });

  it('requires a positive integer notice count and submits notice values', async () => {
    createHaccpBaseWorkMock.mockClear();
    await openExpirationCreateDialog();

    fireEvent.change(screen.getByRole('textbox', { name: /업무명/ }), {
      target: { value: '검교정 점검' },
    });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '결재 적용 여부' }));
    fireEvent.click(await screen.findByRole('option', { name: '미적용' }));

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: '만료일 안내 기준' }));
    fireEvent.click(await screen.findByRole('option', { name: '일' }));

    const count = screen.getByLabelText(/만료일 안내 계산숫자/);
    expect(count).toBeEnabled();
    // 비어 있으면 등록 불가
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();

    fireEvent.change(count, { target: { value: '0' } });
    expect(screen.getByText('1 이상의 정수를 입력하세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();

    fireEvent.change(count, { target: { value: '30' } });
    expect(screen.getByRole('button', { name: '등록' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await vi.waitFor(() => expect(createHaccpBaseWorkMock).toHaveBeenCalled());
    expect(createHaccpBaseWorkMock.mock.calls[0][0]).toMatchObject({
      expirationApply: true,
      expirationNoticeStatus: 'DAY',
      expirationNoticeCount: 30,
    });
  });

  it('resets notice values when the expiration form is no longer applicable', async () => {
    await openExpirationCreateDialog();
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: '만료일 안내 기준' }));
    fireEvent.click(await screen.findByRole('option', { name: '개월' }));
    fireEvent.change(screen.getByLabelText(/만료일 안내 계산숫자/), { target: { value: '2' } });

    // 수시가 아닌 주기로 바꿨다가 다시 수시 -> 미해당, 안내 입력칸 숨김
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '주' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '작성주기' }));
    fireEvent.click(await screen.findByRole('option', { name: '수시' }));
    expect(screen.getByRole('combobox', { name: '만료일 관리 양식' })).toHaveTextContent('미해당');
    expect(screen.queryByRole('combobox', { name: '만료일 안내 기준' })).not.toBeInTheDocument();

    // 다시 해당 -> 없음에서 시작
    fireEvent.mouseDown(screen.getByRole('combobox', { name: '만료일 관리 양식' }));
    fireEvent.click(await screen.findByRole('option', { name: '해당' }));
    expect(screen.getByRole('combobox', { name: '만료일 안내 기준' })).toHaveTextContent('없음');
    expect(screen.getByLabelText(/만료일 안내 계산숫자/)).toHaveValue(null);
  });

  it('shows expiration notice in the grid and fills it in the edit dialog', async () => {
    render(
        <AppProviders>
          <HaccpBaseManagementPage />
        </AppProviders>,
    );

    await screen.findByText('기안서');
    expect(screen.getByText('만료일 안내')).toBeInTheDocument();
    expect(await screen.findByText('30일 전')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '업무 수정' }));
    expect(screen.getByRole('combobox', { name: '만료일 안내 기준' })).toHaveTextContent('일');
    expect(screen.getByLabelText(/만료일 안내 계산숫자/)).toHaveValue(30);
  });
});
