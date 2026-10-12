import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getCommonCodes,
    type CommonCodeDetailItem,
} from '../../services/basicinfo/commonCodeService';

export const WORK_CYCLE_GROUP_CODE = 'WF_FORM_CYCLE';

export type WorkCycleOption = { code: string; name: string };

export function toWorkCycleOptions(details: CommonCodeDetailItem[]): WorkCycleOption[] {
    return details
    .filter((detail) => detail.groupCode === WORK_CYCLE_GROUP_CODE && detail.useAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((detail) => ({ code: detail.code, name: detail.codeName }));
}

// ponytail: 공통코드 전체 조회 후 클라이언트 필터. 그룹별 조회 API가 생기면 교체
// 조회 실패 시 빈 배열(팝업은 helperText로 안내, 필터는 '전체'만 노출)
export function useWorkCycleOptions(): WorkCycleOption[] {
    const { data } = useQuery({
        queryKey: ['common-codes'],
        queryFn: getCommonCodes,
        retry: false,
    });
    return useMemo(() => toWorkCycleOptions(data?.details ?? []), [data]);
}