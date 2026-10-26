import type { ApprovalSubValues } from '../../../../services/documents/haccpBaseWorkService';

export type ApprovalSubTarget = 'equipment' | 'materialType' | 'user';

export type ApprovalSubFieldConfig = {
    target: ApprovalSubTarget;
    targetLabel: string;
    inspectedLabel: string;
    expirationLabel: string;
};

export const EMPTY_APPROVAL_SUB: ApprovalSubValues = {
    equipmentId: '',
    materialType: '',
    certificationUserId: '',
    inspectedDate: '',
    expirationDate: '',
};

const APPROVAL_SUB_FIELD_CONFIG: Record<string, ApprovalSubFieldConfig> = {
    'HCP-CALIB': {
        target: 'equipment',
        targetLabel: '검교정설비명',
        inspectedLabel: '검교정일자',
        expirationLabel: '차기예정일',
    },

    'HCP-VALID': {
        target: 'materialType',
        targetLabel: '품목유형',
        inspectedLabel: '유효성 평가일',
        expirationLabel: '유효성 평가 만료일',
    },
    'HCP-SQI': {
        target: 'materialType',
        targetLabel: '품목유형',
        inspectedLabel: '자가품질 검사일',
        expirationLabel: '자가품질검사 만료일',
    },
    'HCP-HCERT': {
        target: 'user',
        targetLabel: '사원',
        inspectedLabel: '보건증 등록일',
        expirationLabel: '보건증 유효기간',
    },
};

const TARGET_KEY: Record<ApprovalSubTarget, keyof ApprovalSubValues> = {
    equipment: 'equipmentId',
    materialType: 'materialType',
    user: 'certificationUserId',
};

// sub 입력 대상 분류코드가 아니면 undefined
export function getApprovalSubFieldConfig(
    categoryCode?: string,
): ApprovalSubFieldConfig | undefined {
    return APPROVAL_SUB_FIELD_CONFIG[(categoryCode ?? '').trim()];
}

export function getApprovalSubTargetKey(
    config: ApprovalSubFieldConfig,
): keyof ApprovalSubValues {
    return TARGET_KEY[config.target];
}

// 오류 문구, 정상이면 빈 문자열. 날짜는 yyyy-MM-dd 라 문자열 비교로 순서 판단
export function validateApprovalSub(
    config: ApprovalSubFieldConfig,
    sub: ApprovalSubValues,
): string {
    if (
        !sub[getApprovalSubTargetKey(config)].trim() ||
        !sub.inspectedDate ||
        !sub.expirationDate
    ) {
        return '필수값을 입력하세요.';
    }
    if (sub.inspectedDate > sub.expirationDate) {
        return '만료일은 검사일 이후여야 합니다.';
    }
    return '';
}

// 검교정일자 + 주기(개월) - 1일. 더한 달에 같은 날짜가 없으면 그 달 말일 기준
// 문자열을 숫자로 나눠 UTC 로만 계산해 타임존 때문에 하루 밀리지 않게 함
export function calcNextCalibDate(inspectedDate: string, cycleMonths: number): string {
    const [year, month, day] = inspectedDate.split('-').map(Number);
    const targetMonth = month - 1 + cycleMonths;
    const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDay) - 1))
    .toISOString()
    .slice(0, 10);
}