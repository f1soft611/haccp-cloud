export type DraftRouteItem = {
    id: string;
    approvalId?: string;
    writtenInCycle?: boolean;
};

export function resolveDraftRoute(item: DraftRouteItem): string | null {
    const approvalId = (item.approvalId || '').trim();
    const workId = (item.id || '').trim();
    const openApproval = Boolean(item.writtenInCycle) && Boolean(approvalId);
    const targetId = openApproval ? approvalId : workId;

    if (!targetId) {
        return null;
    }

    const query = openApproval ? '?idType=approval' : '?idType=work';
    return `/approvals/draft/${targetId}${query}`;
}