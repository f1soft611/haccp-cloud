import { apiClient } from '../api/apiClient';

export type CommonCodeGroupItem = {
    groupCode: string;
    groupName: string;
    groupDesc: string;
};

export type CommonCodeDetailItem = {
    groupCode: string;
    code: string;
    codeName: string;
    parentCodeName: string;
    useAt: boolean;
    sortOrder: number | null;
    codeDesc: string;
};

export type CommonCodeData = {
    groups: CommonCodeGroupItem[];
    details: CommonCodeDetailItem[];
};

type ResultEnvelope = {
    resultCode?: number | string;
    resultMessage?: string;
    result?: Partial<CommonCodeData> & { message?: string };
};

function assertSuccess(data: ResultEnvelope): void {
    const resultCode = Number(data?.resultCode);
    if (Number.isFinite(resultCode) && resultCode !== 200) {
        const message = data?.result?.message || data?.resultMessage || '요청 처리 중 오류가 발생했습니다.';
        throw { response: { data: { message } }, message };
    }
}

export async function getCommonCodes(): Promise<CommonCodeData> {
    const { data } = await apiClient.get<ResultEnvelope>('/v1/basicinfo/common-codes');
    assertSuccess(data);
    return {
        groups: data?.result?.groups ?? [],
        details: data?.result?.details ?? [],
    };
}

// 기존 -> saveCommonCodes(payload): PUT /v1/basicinfo/common-codes (그룹+상세 전체 교체, 누락 행 삭제)
// 변경 -> 그룹 저장(플랫폼관리자 전용, 없는 그룹은 미사용)과 상세 저장(삭제 없음)을 분리
export async function saveCommonCodeGroups(groups: CommonCodeGroupItem[]): Promise<void> {
    const { data } = await apiClient.put<ResultEnvelope>('/v1/basicinfo/common-codes/groups', { groups });
    assertSuccess(data);
}

export async function saveCommonCodeItems(details: CommonCodeDetailItem[]): Promise<void> {
    const { data } = await apiClient.put<ResultEnvelope>('/v1/basicinfo/common-codes/items', { details });
    assertSuccess(data);
}