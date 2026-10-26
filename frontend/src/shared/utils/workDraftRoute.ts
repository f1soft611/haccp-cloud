import type { HaccpWorkExpiration } from '../../services/documents/haccpBaseWorkService';

export type DraftRouteItem = {
    id: string;
    approvalId?: string;
    writtenInCycle?: boolean;
};

// 기존 -> (item)만 받아 idType 쿼리만 붙임
// 변경 -> 업무(work) 경로에는 주기 기준일(cycleDate)도 붙임. 결재문서 경로는 문서가 자기 주기를 안다.
export function resolveDraftRoute(
    item: DraftRouteItem,
    cycleDate?: string,
): string | null {
    const approvalId = (item.approvalId || '').trim();
    const workId = (item.id || '').trim();
    const openApproval = Boolean(item.writtenInCycle) && Boolean(approvalId);
    const targetId = openApproval ? approvalId : workId;

    if (!targetId) {
        return null;
    }

    const query = openApproval ? '?idType=approval' : '?idType=work';
    const cycleQuery = !openApproval && cycleDate ? `&cycleDate=${cycleDate}` : '';
    return `/approvals/draft/${targetId}${query}${cycleQuery}`;
}

// 캘린더 만료일 클릭: 같은 업무로 새 문서를 열고 대상(설비, 품목유형, 사원)을 미리 선택
// sub 는 분류코드에 맞는 대상 하나만 저장하므로 파라미터도 하나만 붙는다
export function resolveExpirationDraftRoute(
    expiration: Pick<HaccpWorkExpiration, 'workId' | 'equipmentId' | 'materialType' | 'certificationUserId'>,
): string {
    const params = new URLSearchParams({ idType: 'work', fresh: 'true' });
    if (expiration.equipmentId) params.set('equipmentId', expiration.equipmentId);
    if (expiration.materialType) params.set('materialType', expiration.materialType);
    if (expiration.certificationUserId) params.set('certificationUserId', expiration.certificationUserId);
    return `/approvals/draft/${expiration.workId}?${params.toString()}`;
}