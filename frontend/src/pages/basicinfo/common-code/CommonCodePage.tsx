import { Stack } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getCommonCodes,
    saveCommonCodeGroups,
    saveCommonCodeItems,
} from '../../../services/basicinfo/commonCodeService';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
    createEmptyDetailRow,
    createEmptyGroupRow,
    filterGroupRows,
    toDetailPayload,
    toGroupPayload,
    toDetailRows,
    toGroupRows,
    validateDetailRows,
    validateGroupRows,
} from './commonCodeRows';
import { CommonCodeDetailGrid } from './components/CommonCodeDetailGrid';
import { CommonCodeGroupGrid } from './components/CommonCodeGroupGrid';
import { CommonCodeSearchPanel } from './components/CommonCodeSearchPanel';
import { SplitPane } from './components/SplitPane';
import type { CommonCodeDetailRow, CommonCodeGroupRow } from './types';
import { useAuthStore } from '../../../shared/store/authStore';

type ConfirmState = {
    title: string;
    description: string;
    confirmText: string;
    confirmColor: 'primary' | 'error' | 'warning';
    onConfirm: () => void;
};

export function CommonCodePage() {
    const { showSuccess, showError, showInfo } = useFeedback();
    const [groups, setGroups] = useState<CommonCodeGroupRow[]>([]);
    const [details, setDetails] = useState<CommonCodeDetailRow[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [keyword, setKeyword] = useState('');
    const canManageGroups = useAuthStore((state) => state.role === 'PLATFORM_ADMIN');
    // 그룹 삭제는 행이 사라져 rowState로 추적할 수 없으므로 별도 플래그
    const [hasDeletedGroup, setHasDeletedGroup] = useState(false);
    const groupsChanged = hasDeletedGroup || groups.some((row) => row.rowState !== 'saved');
    const detailsChanged = details.some((row) => row.rowState !== 'saved');
    const hasChanges = groupsChanged || detailsChanged;

    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const [saving, setSaving] = useState(false);

    const visibleGroups = useMemo(() => filterGroupRows(groups, keyword), [groups, keyword]);
    const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
    const visibleDetails = useMemo(
        () => details.filter((detail) => detail.groupId === selectedGroupId),
        [details, selectedGroupId],
    );

    const load = useCallback(async () => {
        try {
            const data = await getCommonCodes();
            const nextGroups = toGroupRows(data.groups);
            setGroups(nextGroups);
            setDetails(toDetailRows(data.details));
            setHasDeletedGroup(false);
            setSelectedGroupId((prev) =>
                nextGroups.some((group) => group.id === prev) ? prev : (nextGroups[0]?.id ?? null),
            );
        } catch (error) {
            showError(extractApiErrorMessage(error, '공통코드를 불러오지 못했습니다.'));
        }
    }, [showError]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const handleSearch = () => {
        if (!hasChanges) {
            void load()
            return;
        }
        setConfirmState({
            title: '조회',
            description: '저장하지 않은 변경사항이 있습니다. 계속 조회하시겠습니까?',
            confirmText: '조회',
            confirmColor: 'warning',
            onConfirm: load,
        });
    };

    const saveThenReload = (save: () => Promise<void>, otherChanged: boolean) => {
        const run = async () => {
            setSaving(true);
            try {
                await save();
                showSuccess('저장되었습니다.');
                await load();
            } catch (saveError) {
                showError(extractApiErrorMessage(saveError, '저장에 실패했습니다.'));
            } finally {
                setSaving(false);
            }
        };
        if (!otherChanged) {
            void run();
            return;
        }
        setConfirmState({
            title: '저장',
            description: '저장 후 다시 조회하면 다른 영역의 저장하지 않은 변경사항은 사라집니다. 계속하시겠습니까?',
            confirmText: '저장',
            confirmColor: 'warning',
            onConfirm: () => void run(),
        });
    };

    const handleSaveGroups = () => {
        const error = validateGroupRows(groups);
        if (error) {
            showError(error);
            return;
        }
        saveThenReload(() => saveCommonCodeGroups(toGroupPayload(groups)), detailsChanged);
    };

    const handleSaveDetails = () => {
        const error = validateDetailRows(groups, details);
        if (error) {
            showError(error);
            return;
        }
        saveThenReload(() => saveCommonCodeItems(toDetailPayload(groups, details)), groupsChanged);
    };

    const handleAddGroup = () => {
        const row = createEmptyGroupRow();
        setGroups((prev) => [row, ...prev]);
        setSelectedGroupId(row.id);
    };

    const handleDeleteGroup = () => {
        if (!selectedGroup) {
            showInfo('삭제할 그룹을 선택하세요.');
            return;
        }
        setConfirmState({
            title: '그룹 미사용',
            description: `'${selectedGroup.groupName || '신규 그룹'}' 그룹을 미사용 처리하시겠습니까? 저장해야 반영됩니다.`,
            confirmText: '미사용',
            confirmColor: 'error',
            onConfirm: () => {
                const remaining = groups.filter((group) => group.id !== selectedGroup.id);
                setGroups(remaining);
                setDetails((prev) => prev.filter((detail) => detail.groupId !== selectedGroup.id));
                setSelectedGroupId(remaining[0]?.id ?? null);
                setHasDeletedGroup(true);
            },
        });
    };

    const handleAddDetail = () => {
        if (!selectedGroupId) {
            showInfo('그룹을 먼저 선택하세요.');
            return;
        }
        setDetails((prev) => [...prev, createEmptyDetailRow(selectedGroupId, prev)]);
    };

    const handleToggleAllUse = (useAt: boolean) => {
        setDetails((prev) =>
            prev.map((detail) =>
                detail.groupId !== selectedGroupId || detail.useAt === useAt
                    ? detail
                    : { ...detail, useAt, rowState: detail.rowState === 'new' ? 'new' : 'modified' },
            ),
        );
    };

    return (
        <Stack spacing={2} data-testid="common-code-page">
            {/* 기존 -> PageHeader 우측에 조회/저장 버튼, 아래에 단독 그룹 검색 TextField */}
            {/* 변경 -> 다른 페이지(작업지시) 검색영역과 동일하게 검색패널 안에 검색 필드 + 조회/저장 버튼 */}
            <PageHeader title="공통코드" description="공통코드를 그룹과 상세코드로 관리합니다." />

            <CommonCodeSearchPanel keyword={keyword} onKeywordChange={setKeyword} onSearch={handleSearch} />

            <SplitPane
                left={
                    <CommonCodeGroupGrid
                        rows={visibleGroups}
                        selectedId={selectedGroupId}
                        canManage={canManageGroups}
                        saveDisabled={!groupsChanged || saving}
                        onSelect={setSelectedGroupId}
                        onRowUpdate={(row) => setGroups((prev) => prev.map((group) => (group.id === row.id ? row : group)))}
                        onAdd={handleAddGroup}
                        onDelete={handleDeleteGroup}
                        onSave={handleSaveGroups}
                    />
                }
                right={
                    <CommonCodeDetailGrid
                        rows={visibleDetails}
                        groupName={selectedGroup ? selectedGroup.groupName : null}
                        saveDisabled={!detailsChanged || saving}
                        onRowUpdate={(row) => setDetails((prev) => prev.map((detail) => (detail.id === row.id ? row : detail)))}
                        onToggleAllUse={handleToggleAllUse}
                        onAdd={handleAddDetail}
                        onSave={handleSaveDetails}
                    />
                }
            />

            <ConfirmDialog
                open={confirmState !== null}
                title={confirmState?.title ?? ''}
                description={confirmState?.description ?? ''}
                confirmText={confirmState?.confirmText ?? '확인'}
                confirmColor={confirmState?.confirmColor ?? 'primary'}
                onConfirm={() => {
                    confirmState?.onConfirm();
                    setConfirmState(null);
                }}
                onClose={() => setConfirmState(null)}
            />
        </Stack>
    );
}