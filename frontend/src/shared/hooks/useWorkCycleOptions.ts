import { COMMON_CODE_GROUP } from '../constants/commonCodeGroups';
import {
    toCommonCodeOptions,
    useCommonCodeOptions,
    type CommonCodeOption,
} from './useCommonCodeOptions';
import type { CommonCodeDetailItem } from '../../services/basicinfo/commonCodeService';

// 기존 -> WF_FORM_CYCLE 전용 필터/조회 로직을 이 파일에서 직접 구현
// 변경 -> 범용 useCommonCodeOptions 래퍼. 기존 사용처 호환용으로 export 이름 유지
export const WORK_CYCLE_GROUP_CODE = COMMON_CODE_GROUP.WORK_CYCLE;

export type WorkCycleOption = CommonCodeOption;

export function toWorkCycleOptions(details: CommonCodeDetailItem[]): WorkCycleOption[] {
    return toCommonCodeOptions(details, WORK_CYCLE_GROUP_CODE);
}

// 조회 실패 시 빈 배열(팝업은 helperText로 안내, 필터는 '전체'만 노출)
export function useWorkCycleOptions(): WorkCycleOption[] {
    return useCommonCodeOptions(WORK_CYCLE_GROUP_CODE);
}