import { CalendarDays, ChevronRight, LayoutGrid } from 'lucide-react';
import {
    Box,
    ButtonBase,
    FormControlLabel,
    Radio,
    RadioGroup,
    Skeleton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { Fragment, type ReactNode } from 'react';
import {
    DRAFT_STATUS_CARD_KEYS,
    PENDING_APPROVAL_STATUS,
    type TenantDocScope,
    type TenantViewMode,
    type TodoStatusCardKey,
    type TodoStatusCounts,
} from '../todoFilter';
import styles from '../tenantDashboard.module.css';
import draftIconUrl from '../../../../assets/icons/icon_기안.svg';
import approvalIconUrl from '../../../../assets/icons/icon_sine.svg';

/** 상태바 시안 아이콘. SVG 내부 전역 클래스 충돌을 막기 위해 img 로 표시한다. */
function StatusIcon({ src }: { src: string }) {
    return (
        <Box
            component="img"
            src={src}
            alt=""
            sx={{ display: 'block', width: 24, height: 20, objectFit: 'contain' }}
        />
    );
}

const CARD_TOOLTIPS: Record<TodoStatusCardKey, string> = {
    미작성: '내가 작성해야 할 문서',
    결재할문서: '내 결재를 기다리는 문서',
    결재진행중: '내가 결재 요청했으나 아직 결재가 끝나지 않은 문서',
    승인: '내가 결재 요청해 최종 승인된 문서',
    반려: '내가 결재 요청했으나 반려된 문서',
};

const DOC_SCOPE_OPTIONS: { value: TenantDocScope; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'draft', label: '기안문서' },
    { value: 'approval', label: '결재할문서' },
];

// 문서 구분 라디오 모양 (바깥 원 21px, 안쪽 원 15px)
function DocScopeRadioIcon({ checked }: { checked: boolean }) {
    return (
        <Box className={styles.radioOuter}>
            <Box data-testid="doc-scope-radio-dot" data-checked={checked} className={styles.radioDot} />
        </Box>
    );
}

type TenantStatusCardSectionProps = {
    counts: TodoStatusCounts;
    isLoading: boolean;
    onSelect: (status: TodoStatusCardKey) => void;
    docScope: TenantDocScope;
    onDocScopeChange: (docScope: TenantDocScope) => void;
    viewMode: TenantViewMode;
    onViewModeChange: (viewMode: TenantViewMode) => void;
};

// 기존 -> 종합현황 리스트 상단에 상태별 건수만 표시, 문서 구분과 보기 전환은 없음
// 변경 -> 나의 담당업무 상태바: 건수, 문서 구분 라디오, 카드형/캘린더 전환. 건수는 항상 전체 기준
export function TenantStatusCardSection(props: TenantStatusCardSectionProps) {
    const { counts, isLoading, onSelect, docScope, onDocScopeChange, viewMode, onViewModeChange } = props;

    // 마우스를 올리면 상태 설명 툴팁 표시 (describeChild로 버튼 이름은 상태명 유지)
    const renderCount = (status: TodoStatusCardKey, label: ReactNode) => (
        <Tooltip title={CARD_TOOLTIPS[status]} describeChild arrow>
            <ButtonBase onClick={() => onSelect(status)} className={styles.countButton}>
                {label}
                <Typography component="span" className={styles.countValue}>
                    {isLoading ? <Skeleton width={24} /> : counts[status]}
                </Typography>
                <Typography component="span" className={styles.countUnit}>
                    건
                </Typography>
            </ButtonBase>
        </Tooltip>
    );

    return (
        <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
            useFlexGap
            columnGap={3}
            rowGap={1}
        >
            {/* 기존 -> 기안문서, 결재할 문서, 라디오+버튼 3구역 / 변경 -> 기안문서+결재할 문서를 왼쪽 구역으로 묶음 */}
            <Stack
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                useFlexGap
                columnGap={5}
                rowGap={0.5}
                className={styles.statusLeftGroup}
            >
                <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="center"
                    useFlexGap
                    columnGap={0.5}
                    rowGap={0.5}
                    className={styles.statusDraftGroup}
                >
                    {/* 기존 -> lucide FilePen 아이콘 / 변경 -> 시안 icon_기안.svg */}
                    <StatusIcon src={draftIconUrl} />
                    <Typography className={`${styles.statusLabel} ${styles.statusLabelDraft}`}>
                        기안문서
                    </Typography>
                    {DRAFT_STATUS_CARD_KEYS.map((status, index) => (
                        <Fragment key={status}>
                            {index > 0 ? (
                                <ChevronRight fontSize="small" className={styles.statusChevron} />
                            ) : null}
                            {renderCount(
                                status,
                                <Typography component="span" className={styles.statusName}>
                                    {status}
                                </Typography>,
                            )}
                        </Fragment>
                    ))}
                </Stack>

                {renderCount(
                    PENDING_APPROVAL_STATUS,
                    <>
                        {/* 기존 -> lucide ClipboardCheck 아이콘 / 변경 -> 시안 icon_sine.svg */}
                        <StatusIcon src={approvalIconUrl} />
                        <Typography component="span" className={`${styles.statusLabel} ${styles.statusLabelApproval}`}>
                            결재할 문서
                        </Typography>
                    </>,
                )}
            </Stack>

            <Stack
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                useFlexGap
                columnGap={2}
                rowGap={1}
            >
                <RadioGroup
                    row
                    aria-label="문서 구분"
                    value={docScope}
                    onChange={(event) => onDocScopeChange(event.target.value as TenantDocScope)}
                >
                    {DOC_SCOPE_OPTIONS.map((option) => (
                        <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={
                                <Radio
                                    disableRipple
                                    icon={<DocScopeRadioIcon checked={false} />}
                                    checkedIcon={<DocScopeRadioIcon checked />}
                                    className={styles.docScopeRadio}
                                />
                            }
                            label={option.label}
                            disabled={viewMode === 'calendar'}
                            className={styles.docScopeLabel}
                        />
                    ))}
                </RadioGroup>

                {/* 기존 -> TenantFilterSection 오른쪽 끝 / 변경 -> 검색필터 제거로 상태바로 이동 */}
                <Box className={styles.viewToggleWrap}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={viewMode}
                        onChange={(_, next: TenantViewMode | null) => {
                            if (next) {
                                onViewModeChange(next);
                            }
                        }}
                        aria-label="보기 형식"
                        className={styles.viewToggle}
                    >
                        <ToggleButton value="list" aria-label="카드형">
                            <LayoutGrid size={18} className={styles.toggleIcon} />
                            카드형
                        </ToggleButton>
                        <ToggleButton value="calendar" aria-label="캘린더형">
                            <CalendarDays size={18} className={styles.toggleIcon} />
                            캘린더
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Stack>
        </Stack>
    );
}