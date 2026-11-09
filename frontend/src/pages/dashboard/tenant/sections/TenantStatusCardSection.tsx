import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
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

const STATUS_BAR_RADIUS = '4px';

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
        <Box
            sx={{
                width: 21,
                height: 21,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid #989898',
                bgcolor: 'background.paper',
            }}
        >
            <Box
                data-testid="doc-scope-radio-dot"
                sx={{
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    bgcolor: checked ? '#375ACE' : '#D5DBEF',
                }}
            />
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
            <ButtonBase
                onClick={() => onSelect(status)}
                sx={{
                    gap: 0.5,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                }}
            >
                {label}
                <Typography
                    component="span"
                    fontWeight={600}
                    sx={{ color: '#0763CC', fontSize: 18 }}
                >
                    {isLoading ? <Skeleton width={24} /> : counts[status]}
                </Typography>
                <Typography component="span" sx={{ fontSize: 16, fontWeight: 500, color: '#5E5E5E' }}>
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
            <Stack
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                useFlexGap
                columnGap={0.5}
                rowGap={0.5}
                sx={{ flexBasis: { xs: '100%', xl: 'auto' } }}
            >
                <EditNoteOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography fontWeight={700} sx={{ mr: 1, fontSize: 16, color: '#1D1D1D' }}>
                    기안문서
                </Typography>
                {DRAFT_STATUS_CARD_KEYS.map((status, index) => (
                    <Fragment key={status}>
                        {index > 0 ? (
                            <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        ) : null}
                        {renderCount(
                            status,
                            <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: '#555555' }}>
                                {status}
                            </Typography>,
                        )}
                    </Fragment>
                ))}
            </Stack>

            {renderCount(
                PENDING_APPROVAL_STATUS,
                <>
                    <AssignmentTurnedInOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography component="span" fontWeight={700} sx={{ mr: 0.5, fontSize: 16, color: '#1D1D1D' }}>
                        결재할 문서
                    </Typography>
                </>,
            )}

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
                                    sx={{
                                        p: 0,
                                        mr: '9px',
                                        '&.Mui-focusVisible': {
                                            outline: '2px solid',
                                            outlineColor: 'primary.main',
                                            outlineOffset: 1,
                                        },
                                        '&.Mui-disabled': { opacity: 0.5 },
                                    }}
                                />
                            }
                            label={option.label}
                            disabled={viewMode === 'calendar'}
                            sx={{
                                ml: 0,
                                mr: '19px',
                                '& .MuiFormControlLabel-label': {
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: (theme) => (theme.palette.mode === 'light' ? '#262626' : theme.palette.text.primary),
                                },
                            }}
                        />
                    ))}
                </RadioGroup>

                {/* 기존 -> TenantFilterSection 오른쪽 끝 / 변경 -> 검색필터 제거로 상태바로 이동 */}
                <Box sx={{ flexShrink: 0 }}>
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
                        sx={{
                            gap: 0.5,
                            '& .MuiToggleButton-root': {
                                minWidth: 88,
                                height: 36,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: `${STATUS_BAR_RADIUS} !important`,
                                bgcolor: 'background.paper',
                                color: 'text.disabled',
                                fontWeight: 600,
                                '&:hover': { bgcolor: 'background.paper', color: 'text.secondary' },
                            },
                            '& .MuiToggleButton-root.Mui-selected': {
                                borderColor: 'text.secondary',
                                color: 'text.primary',
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'background.paper' },
                            },
                            '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
                                ml: 0,
                                borderLeft: '1px solid',
                                borderLeftColor: 'divider',
                            },
                            '& .MuiToggleButtonGroup-grouped.Mui-selected:not(:first-of-type)': {
                                borderLeftColor: 'text.secondary',
                            },
                        }}
                    >
                        <ToggleButton value="list" aria-label="카드형">
                            <GridViewOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                            카드형
                        </ToggleButton>
                        <ToggleButton value="calendar" aria-label="캘린더형">
                            <CalendarMonthOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                            캘린더
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Stack>
        </Stack>
    );
}