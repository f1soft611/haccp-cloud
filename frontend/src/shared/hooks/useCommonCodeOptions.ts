import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getCommonCodes,
    type CommonCodeDetailItem,
} from '../../services/basicinfo/commonCodeService';
import type { CommonCodeGroupCode } from '../constants/commonCodeGroups';

export type CommonCodeOption = { code: string; name: string };

export function toCommonCodeOptions(
    details: CommonCodeDetailItem[],
    groupCode: string,
): CommonCodeOption[] {
    return details
    .filter((detail) => detail.groupCode === groupCode && detail.useAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((detail) => ({ code: detail.code, name: detail.codeName }));
}

// 매칭 없으면(미사용 처리된 코드 등) 코드 그대로 표시
export function getCommonCodeName(
    options: CommonCodeOption[],
    code: string | null | undefined,
): string {
    if (!code) return '';
    return options.find((option) => option.code === code)?.name ?? code;
}

// ponytail: 공통코드 전체 조회를 모든 그룹이 공유(쿼리 1회). 코드가 수천 건 이상이면 ?groupCode= API + 그룹별 queryKey로 교체
// 조회 실패 시 빈 배열
export function useCommonCodeOptions(groupCode: CommonCodeGroupCode): CommonCodeOption[] {
    const { data } = useQuery({
        queryKey: ['common-codes'],
        queryFn: getCommonCodes,
        retry: false,
    });
    return useMemo(() => toCommonCodeOptions(data?.details ?? [], groupCode), [data, groupCode]);
}