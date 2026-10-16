import type { WorkOrderFormValue } from './types';

// 기존 -> SAMPLE_WORK_ORDERS: 백엔드 API 전까지 화면 확인용 샘플 데이터
// 변경 -> tb_workdirect 조회로 대체되어 제거

// 기존 -> filterWorkOrderRows(rows, search): 기간·품명 클라이언트 필터
// 변경 -> 서버 조회 조건으로 대체되어 제거

export type WorkOrderFormErrors = Partial<Record<keyof WorkOrderFormValue, string>>;

const MAX_REMARK_LENGTH = 255;

// 기존 -> itemName 필수, 메시지 '생산일자'
// 변경 -> 품목 선택(materialId) 필수, 메시지 '생산계획일', 비고 길이 검사 추가 (서버 검증 메시지와 동일)
export function validateWorkOrderForm(value: WorkOrderFormValue): WorkOrderFormErrors {
    const errors: WorkOrderFormErrors = {};
    if (!value.materialId) errors.materialId = '품목을 선택하세요.';
    if (!value.productionDate) errors.productionDate = '생산계획일을 입력하세요.';
    if (!value.expiryDate) {
        errors.expiryDate = '소비기한을 입력하세요.';
    } else if (value.productionDate && value.expiryDate < value.productionDate) {
        errors.expiryDate = '소비기한은 생산계획일 이후여야 합니다.';
    }
    if (value.quantity === null || value.quantity <= 0) {
        errors.quantity = '생산량은 0보다 커야 합니다.';
    }
    if (value.remark.trim().length > MAX_REMARK_LENGTH) {
        errors.remark = '비고는 255자 이하로 입력하세요.';
    }
    return errors;
}

// ponytail: 품목에 소비기한 기준이 없어 생산계획일 + 1년 고정. 품목 기준이 생기면 이 함수만 교체
export function calcDefaultExpiryDate(prodPlanDate: string): string {
    if (!prodPlanDate) return '';
    const [year, month, day] = prodPlanDate.split('-').map(Number);
    const next = new Date(Date.UTC(year + 1, month - 1, day));
    // 2/29 + 1년이 3/1 로 넘어가면 전달 말일(2/28)로 맞춘다
    if (next.getUTCMonth() !== month - 1) next.setUTCDate(0);
    return next.toISOString().slice(0, 10);
}