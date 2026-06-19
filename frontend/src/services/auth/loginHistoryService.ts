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
  };
};

const LOGIN_HISTORY_LIST_ENDPOINTS = [
  '/platform-admin/login-history/list',
  '/platform-admin/login-history',
  '/loginHistory/list',
] as const;

export async function getLoginHistoryList(
  params: LoginHistoryListParams,
): Promise<{ items: LoginHistoryItem[]; totalCount: number }> {
  for (const endpoint of LOGIN_HISTORY_LIST_ENDPOINTS) {
    try {
      const { data } = await apiClient.get<LoginHistoryListResponse>(endpoint, {
        params,
      });

      return {
        items: data.result?.loginHistoryList ?? [],
        totalCount: data.result?.totalCount ?? 0,
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
