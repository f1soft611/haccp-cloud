import { Stack } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommonCodeData } from '../../../services/basicinfo/commonCodeService';
import { ConfirmDialog } from '../../../shared/components/feedback/ConfirmDialog';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useFeedback } from '../../../shared/hooks/useFeedback';
import {
    SAMPLE_COMMON_CODES,
    createEmptyDetailRow,
    createEmptyGroupRow,
    filterGroupRows,
    toCommonCodePayload,
    toDetailRows,
    toGroupRows,
    validateCommonCodes,
} from './commonCodeRows';
import { CommonCodeDetailGrid } from './components/CommonCodeDetailGrid';
import { CommonCodeGroupGrid } from './components/CommonCodeGroupGrid';
import { CommonCodeSearchPanel } from './components/CommonCodeSearchPanel';
import { SplitPane } from './components/SplitPane';
import type { CommonCodeDetailRow, CommonCodeGroupRow } from './types';

// ponytail: 백엔드 API 전까지 메모리 저장소 (페이지 이동해도 유지, 새로고침 시 초기화). API 연동 시 getCommonCodes/saveCommonCodes로 복원
let commonCodeStore: CommonCodeData = SAMPLE_COMMON_CODES;

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
    // 삭제는 행이 사라져 rowState로 추적할 수 없으므로 별도 플래그 (PUT이 전체 교체라 삭제 키 목록은 불필요)
    const [hasDeleted, setHasDeleted] = useState(false);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const hasChanges =
        hasDeleted ||
        groups.some((row) => row.rowState !== 'saved') ||
        details.some((row) => row.rowState !== 'saved');

    const visibleGroups = useMemo(() => filterGroupRows(groups, keyword), [groups, keyword]);
    const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
    const visibleDetails = useMemo(
        () => details.filter((detail) => detail.groupId === selectedGroupId),
        [details, selectedGroupId],
    );

    // 기존 -> async load: await getCommonCodes() + 실패 시 showError
    // 변경 -> 샘플 저장소(commonCodeStore)에서 조회
    const load = useCallback(() => {
        const nextGroups = toGroupRows(commonCodeStore.groups);
        setGroups(nextGroups);
        setDetails(toDetailRows(commonCodeStore.details));
        setHasDeleted(false);
        setSelectedGroupId((prev) =>
            nextGroups.some((group) => group.id === prev) ? prev : (nextGroups[0]?.id ?? null),
        );
    }, []);

    useEffect(() => {
        // 기존 -> void load(); (lint: react-hooks/set-state-in-effect 오류)
        // 변경 -> 최초 조회는 의도된 동작이라 기존 코드(AppProviders 등)와 동일하게 규칙 비활성화
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const handleSearch = () => {
        if (!hasChanges) {
            load();
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

    // 기존 -> await saveCommonCodes(payload) + saving 상태 + 실패 시 showError
    // 변경 -> 샘플 저장소에 통째로 교체 저장
    const handleSave = () => {
        const error = validateCommonCodes(groups, details);
        if (error) {
            showError(error);
            return;
        }
        commonCodeStore = toCommonCodePayload(groups, details);
        showSuccess('저장되었습니다.');
        load();
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
        const detailCount = details.filter((detail) => detail.groupId === selectedGroup.id).length;
        setConfirmState({
            title: '그룹 삭제',
            description: `'${selectedGroup.groupName || '신규 그룹'}' 그룹을 삭제하시겠습니까?${detailCount ? ` 상세코드 ${detailCount}건도 함께 삭제됩니다.` : ''}`,
            confirmText: '삭제',
            confirmColor: 'error',
            onConfirm: () => {
                const remaining = groups.filter((group) => group.id !== selectedGroup.id);
                setGroups(remaining);
                setDetails((prev) => prev.filter((detail) => detail.groupId !== selectedGroup.id));
                setSelectedGroupId(remaining[0]?.id ?? null);
                setHasDeleted(true);
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

    const handleDeleteDetails = (ids: string[]) => {
        if (ids.length === 0) {
            showInfo('삭제할 행을 선택하세요.');
            return;
        }
        const targetIds = new Set(ids);
        setConfirmState({
            title: '삭제',
            description: `선택한 ${ids.length}건을 삭제하시겠습니까?`,
            confirmText: '삭제',
            confirmColor: 'error',
            onConfirm: () => {
                setDetails((prev) => prev.filter((detail) => !targetIds.has(detail.id)));
                setHasDeleted(true);
            },
        });
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

            <CommonCodeSearchPanel
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSearch={handleSearch}
                onSave={handleSave}
                saveDisabled={!hasChanges}
            />

            <SplitPane
                left={
                    <CommonCodeGroupGrid
                        rows={visibleGroups}
                        selectedId={selectedGroupId}
                        onSelect={setSelectedGroupId}
                        onRowUpdate={(row) => setGroups((prev) => prev.map((group) => (group.id === row.id ? row : group)))}
                        onAdd={handleAddGroup}
                        onDelete={handleDeleteGroup}
                    />
                }
                right={
                    <CommonCodeDetailGrid
                        rows={visibleDetails}
                        groupName={selectedGroup ? selectedGroup.groupName : null}
                        onRowUpdate={(row) => setDetails((prev) => prev.map((detail) => (detail.id === row.id ? row : detail)))}
                        onToggleAllUse={handleToggleAllUse}
                        onAdd={handleAddDetail}
                        onDelete={handleDeleteDetails}
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