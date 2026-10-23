import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHaccpWorkDraftTemplate } from '../../services/documents/haccpBaseWorkService';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

type PendingDraft = { approvalPath: string; freshPath: string };

// 업무 작성 진입: 이번 주기 본인 임시저장이 있으면 불러올지 묻고, 없으면 바로 작성 화면
export function useOpenWorkDraft() {
    const navigate = useNavigate();
    const tenantCode = useAuthStore((state) => state.tenantCode || '');
    const [pending, setPending] = useState<PendingDraft | null>(null);

    const openWorkDraft = async (workId: string, returnTo?: string) => {
        const suffix = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : '';
        try {
            const template = await getHaccpWorkDraftTemplate({
                tenantCode,
                id: workId,
                idType: 'work',
            });
            const approvalId = (template.approvalId || '').trim();
            const isTempSaved =
                String(template.approvalStatusType ?? '').trim().toLowerCase() === 'pre_apply';
            if (approvalId && isTempSaved) {
                setPending({
                    approvalPath: `/approvals/draft/${approvalId}?idType=approval${suffix}`,
                    freshPath: `/approvals/draft/${workId}?idType=work&fresh=true${suffix}`,
                });
                return;
            }
        } catch {
            // ponytail: 조회 실패(권한 등)는 기안 화면이 다시 조회해서 에러를 보여주므로 그대로 이동
        }
        navigate(`/approvals/draft/${workId}?idType=work${suffix}`);
    };

    const go = (path?: string) => {
        setPending(null);
        if (path) navigate(path);
    };

    const dialog = (
        <ConfirmDialog
            open={Boolean(pending)}
            title="임시저장 문서"
            description="임시저장된 문서를 불러오시겠습니까?"
            confirmText="확인"
            cancelText="아니오"
            onConfirm={() => go(pending?.approvalPath)}
            onCancel={() => go(pending?.freshPath)}
            onClose={() => setPending(null)}
        />
    );

    return { openWorkDraft, dialog };
}