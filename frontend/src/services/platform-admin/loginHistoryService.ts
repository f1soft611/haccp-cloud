import { apiClient } from '../api/apiClient';

export type LoginHistoryItem = {
  loginHistoryId: number;
  factoryCode?: string;
  userId: string;
  userName?: string;
  loginDt: string;
  loginIp?: string;
  loginType?: string;
  loginResult: 'Y' | 'N';
  failReason?: string;
  logoutDt?: string;
  sessionTime?: number;
};

export type LoginHistoryListParams = {
  pageIndex: number;
  pageSize: number;
  factoryCode?: string;
  searchUserId?: string;
  searchUserName?: string;
  searchLoginResult?: 'Y' | 'N' | '';
  searchStartDt?: string;
  searchEndDt?: string;
};

type LoginHistoryListResponse = {
  result?: {
    loginHistoryList?: LoginHistoryItem[];
    totalCount?: number;
    paginationInfo?: {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    };
    data?: {
      loginHistoryList?: LoginHistoryItem[];
      totalCount?: number;
      paginationInfo?: {
        currentPageNo?: number;
        recordCountPerPage?: number;
        totalRecordCount?: number;
      };
    };
  };
};

const LOGIN_HISTORY_LIST_ENDPOINTS = [
  '/v1/platform-admin/login-history',
  '/v1/platform-admin/login-history/list',
] as const;

function extractLoginHistoryItems(
  data: LoginHistoryListResponse,
): LoginHistoryItem[] {
  return (
    data.result?.loginHistoryList ?? data.result?.data?.loginHistoryList ?? []
  );
}

function extractTotalCount(data: LoginHistoryListResponse): number {
  return data.result?.totalCount ?? data.result?.data?.totalCount ?? 0;
}

function extractPaginationInfo(data: LoginHistoryListResponse):
  | {
      currentPageNo?: number;
      recordCountPerPage?: number;
      totalRecordCount?: number;
    }
  | undefined {
  return data.result?.paginationInfo ?? data.result?.data?.paginationInfo;
}

export async function getLoginHistoryList(
  params: LoginHistoryListParams,
): Promise<{
  items: LoginHistoryItem[];
  totalCount: number;
  paginationInfo?: {
    currentPageNo?: number;
    recordCountPerPage?: number;
    totalRecordCount?: number;
  };
}> {
  for (const endpoint of LOGIN_HISTORY_LIST_ENDPOINTS) {
    try {
      const { data } = await apiClient.get<LoginHistoryListResponse>(endpoint, {
        params,
      });

      return {
        items: extractLoginHistoryItems(data),
        totalCount: extractTotalCount(data),
        paginationInfo: extractPaginationInfo(data),
      };
    } catch (error) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: unknown } }).response
          ?.status === 'number'
          ? ((error as { response?: { status?: number } }).response?.status ??
            500)
          : 500;

      if (status !== 404 && status !== 405) {
        throw error;
      }
    }
  }

  throw new Error('로그인 이력 조회 API 엔드포인트를 찾을 수 없습니다.');
}
