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