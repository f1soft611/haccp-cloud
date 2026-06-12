import { apiClient } from './apiClient';

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

export async function getLoginHistoryList(
  params: LoginHistoryListParams,
): Promise<{ items: LoginHistoryItem[]; totalCount: number }> {
  const { data } = await apiClient.get<LoginHistoryListResponse>(
    '/loginHistory/list',
    {
      params,
    },
  );

  return {
    items: data.result?.loginHistoryList ?? [],
    totalCount: data.result?.totalCount ?? 0,
  };
}
