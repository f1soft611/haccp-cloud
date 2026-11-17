import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/apiClient';
import {
  createHaccpBaseWork,
  createHaccpWorkApprovalComment,
  deleteHaccpWorkApprovalComment,
  deleteHaccpWorkDraft,
  getTenantServiceStartDate,
  listHaccpBaseWorks,
  listHaccpWorkTodoCycles,
  saveHaccpBaseWorkTemplate,
  saveHaccpWorkTempDraft,
  submitHaccpWorkDraft,
  toggleHaccpWorkApprovalCommentLike,
  updateHaccpBaseWork,
  updateHaccpWorkApprovalComment,
  updateHaccpWorkApprovalStatus,
} from '../../../services/documents/haccpBaseWorkService';

vi.mock('../../../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(apiClient.get).mockReset();
  vi.mocked(apiClient.post).mockReset();
  vi.mocked(apiClient.put).mockReset();
  vi.mocked(apiClient.patch).mockReset();
  vi.mocked(apiClient.delete).mockReset();
});

describe('haccpBaseWorkService', () => {
  it('normalizes snake_case work id for work division options', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        result: {
          resultList: [
            {
              drafting_work_category_id: 101,
              code_name: 'CCP-1B 검증기록',
              cata_name: 'HACCP(HA)',
              use_at: 'Y',
            },
          ],
        },
      },
    });

    const result = await listHaccpBaseWorks({
      tenantCode: 'TENANT-A',
      active: 'Y',
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '101',
          divisionName: 'CCP-1B 검증기록',
        }),
      ]),
    );
  });

  it('converts cycle instance registeredDate to YYYY-MM-DD', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { workId: 1, cycleDate: '20261005', approvalId: 9, statusType: 'in_progress', registeredDate: '20261006', targetName: ' 저울 A ', materialType: 'RAW' },
        { workId: 2, cycleDate: '20261005', approvalId: 10, statusType: 'approved', registeredDate: null },
      ],
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result.instances).toEqual([
      { workId: '1', cycleDate: '2026-10-05', approvalId: '9', statusType: 'in_progress', registeredDate: '2026-10-06', title: '', targetName: '저울 A', materialType: 'RAW' },
      { workId: '2', cycleDate: '2026-10-05', approvalId: '10', statusType: 'approved', registeredDate: '', title: '', targetName: '', materialType: '' },
    ]);
    expect(result.expirations).toEqual([]);
    expect(result.displayStartDate).toBe('');
  });

  it('reads displayStartDate from the result envelope as YYYY-MM-DD', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { result: { resultList: [], displayStartDate: '20260610' } },
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result).toEqual({ instances: [], displayStartDate: '2026-06-10', expirations: [] });
  });

  it('normalizes expirations from the result envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        result: {
          resultList: [],
          displayStartDate: '',
          expirations: [
            { workId: 7, approvalId: 900, expirationDate: '20261115', equipmentId: 12, materialType: null, certificationUserId: null, targetName: '설비A' },
            { workId: 8, approvalId: 901, expirationDate: '2026-11', equipmentId: null, materialType: 'MT01', certificationUserId: null, targetName: '' },
          ],
        },
      },
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result.expirations).toEqual([
      { workId: '7', approvalId: '900', expirationDate: '2026-11-15', equipmentId: '12', materialType: '', certificationUserId: '', targetName: '설비A' },
    ]);
  });

  it('defaults expirationApply to false and approvalApply to true when missing', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { id: 1 },
        { id: 2, expirationApply: true, approvalApply: false },
      ],
    });

    const result = await listHaccpBaseWorks({ tenantCode: 'TENANT-A' });

    expect(
        result.map(({ expirationApply, approvalApply }) => ({ expirationApply, approvalApply })),
    ).toEqual([
      { expirationApply: false, approvalApply: true },
      { expirationApply: true, approvalApply: false },
    ]);
  });

  it('sends search conditions as query params and drops empty values', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    await listHaccpBaseWorks({
      tenantCode: 'TENANT-A',
      active: 'Y',
      categoryId: '11',
      keyword: '금도연',
    });
    await listHaccpBaseWorks({ tenantCode: 'TENANT-A', keyword: '' });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/v1/haccp-base/works', {
      headers: { 'x-tenant-code': 'TENANT-A' },
      params: { active: 'Y', categoryId: '11', keyword: '금도연' },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/v1/haccp-base/works', {
      headers: { 'x-tenant-code': 'TENANT-A' },
      params: { active: undefined, categoryId: undefined, keyword: undefined },
    });
  });

  it('reads serviceStartDate from the result envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { result: { serviceStartDate: '2026-03-15' } },
    });

    await expect(getTenantServiceStartDate({ tenantCode: 'TENANT-A' })).resolves.toBe('2026-03-15');
    expect(apiClient.get).toHaveBeenCalledWith('/v1/haccp-base/works/service-start-date', {
      headers: { 'x-tenant-code': 'TENANT-A' },
    });
  });

  it('returns empty string when the tenant has no service start date', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { result: { serviceStartDate: null } },
    });

    await expect(getTenantServiceStartDate({ tenantCode: 'TENANT-A' })).resolves.toBe('');
  });
});

// 업무 등록/수정 저장 요청 공통 값
const WORK_SAVE_PAYLOAD = {
  tenantCode: 'TENANT-A',
  categoryGroupId: '1',
  divisionCode: '025',
  divisionName: '방충 방서 점검표',
  cycle: 'MONTH',
  active: true,
  expirationApply: false,
  expirationNoticeStatus: 'NONE',
  expirationNoticeCount: null,
  cycleAnchorType: 'WEEKDAY',
  workStartDate: '',
  workStartMonth: '2026-11',
  cycleAnchorWeek: 1,
  cycleAnchorWeekday: 1,
  approvalApply: true,
  reviewerId: '4',
  approverId: '1',
  assigneeIds: [],
};

// 백엔드가 입력 오류를 HTTP 200 + resultCode 900 으로 내려주는 응답
const INPUT_CHECK_ERROR_RESPONSE = {
  data: {
    resultCode: 900,
    resultMessage: '입력값 무결성 오류 입니다.',
    result: { message: '작성된 문서가 있어 업무 기준일을 바꿀 수 없습니다.' },
  },
};

describe('haccpBaseWorkService 저장 실패 응답', () => {
  it('업무 수정이 resultCode 900 이면 서버 메시지로 reject 한다', async () => {
    vi.mocked(apiClient.put).mockResolvedValue(INPUT_CHECK_ERROR_RESPONSE);

    await expect(updateHaccpBaseWork({ ...WORK_SAVE_PAYLOAD, id: '24' })).rejects.toMatchObject({
      message: '작성된 문서가 있어 업무 기준일을 바꿀 수 없습니다.',
      response: { data: { message: '작성된 문서가 있어 업무 기준일을 바꿀 수 없습니다.' } },
    });
  });

  it('업무 수정이 resultCode 200 이면 item 을 반환한다', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { resultCode: 200, result: { item: { draftingWorkCategoryId: 24, divisionName: '방충 방서 점검표' } } },
    });

    await expect(updateHaccpBaseWork({ ...WORK_SAVE_PAYLOAD, id: '24' })).resolves.toMatchObject({
      id: '24',
      divisionName: '방충 방서 점검표',
    });
  });

  it('업무 등록이 resultCode 900 이면 서버 메시지로 reject 한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(INPUT_CHECK_ERROR_RESPONSE);

    await expect(createHaccpBaseWork(WORK_SAVE_PAYLOAD)).rejects.toMatchObject({
      message: '작성된 문서가 있어 업무 기준일을 바꿀 수 없습니다.',
    });
  });

  it('result.message 가 없으면 resultMessage 를 쓴다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { resultCode: 900, resultMessage: '입력값 무결성 오류 입니다.' },
    });

    await expect(createHaccpBaseWork(WORK_SAVE_PAYLOAD)).rejects.toMatchObject({
      message: '입력값 무결성 오류 입니다.',
    });
  });

  it.each([
    ['템플릿 저장', 'put', () => saveHaccpBaseWorkTemplate({ tenantCode: 'T', id: '1', templateJson: '{}', templateHtml: '' })],
    ['기안 삭제', 'delete', () => deleteHaccpWorkDraft({ tenantCode: 'T', approvalId: '9' })],
    ['기안 임시저장', 'post', () => saveHaccpWorkTempDraft({ tenantCode: 'T', id: '1', templateJson: '{}', templateHtml: '' })],
    ['결재신청', 'post', () => submitHaccpWorkDraft({ tenantCode: 'T', id: '1', title: '제목', templateJson: '{}', templateHtml: '' })],
    ['결재 상태 변경', 'post', () => updateHaccpWorkApprovalStatus({ tenantCode: 'T', approvalId: '9', eventType: 'final_approve' })],
    ['댓글 등록', 'post', () => createHaccpWorkApprovalComment({ tenantCode: 'T', approvalId: '9', comment: '의견' })],
    ['댓글 수정', 'patch', () => updateHaccpWorkApprovalComment({ tenantCode: 'T', approvalId: '9', commentId: '3', comment: '의견' })],
    ['댓글 삭제', 'delete', () => deleteHaccpWorkApprovalComment({ tenantCode: 'T', approvalId: '9', commentId: '3' })],
    ['댓글 좋아요', 'post', () => toggleHaccpWorkApprovalCommentLike({ tenantCode: 'T', approvalId: '9', commentId: '3' })],
  ] as const)('%s 이 resultCode 900 이면 reject 한다', async (_name, method, call) => {
    // 메서드 유니온이라 타입을 하나로 맞춘다
    (apiClient[method] as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(INPUT_CHECK_ERROR_RESPONSE);

    await expect(call()).rejects.toMatchObject({
      message: '작성된 문서가 있어 업무 기준일을 바꿀 수 없습니다.',
    });
  });

  it('응답 본문이 없는 삭제 응답은 성공으로 본다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: '' });

    await expect(deleteHaccpWorkDraft({ tenantCode: 'T', approvalId: '9' })).resolves.toBeUndefined();
  });
});
