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
    const { data } = await apiClient.get<ResultEnvelope>('/v1/common-codes');
    assertSuccess(data);
    return {
        groups: data?.result?.groups ?? [],
        details: data?.result?.details ?? [],
    };
}

export async function saveCommonCodes(payload: CommonCodeData): Promise<void> {
    const { data } = await apiClient.put<ResultEnvelope>('/v1/common-codes', payload);
    assertSuccess(data);
}