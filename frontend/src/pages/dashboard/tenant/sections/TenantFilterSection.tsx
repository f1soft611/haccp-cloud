import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
    Box,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import type { ReactNode } from 'react';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { useWorkCycleOptions } from '../../../../shared/hooks/useWorkCycleOptions';
import {
    TODO_STATUS_OPTIONS,
    type TenantTodoFilter,
    type TenantViewMode,
} from '../todoFilter';

const FILTER_RADIUS = '4px';
const FILTER_BUTTON_SIZE = 40;
const SEARCH_BUTTON_COLOR = '#2f3654';

type TenantFilterSectionProps = {
    value: TenantTodoFilter;
    categoryOptions: string[];
    viewMode: TenantViewMode;
    onChange: (value: TenantTodoFilter) => void;
    onReset: () => void;
    onSearch: () => void;
    onViewModeChange: (viewMode: TenantViewMode) => void;
};

// 기존 -> 자체 Paper, 윗줄 토글 + 아랫줄 라벨 붙은 조건 + 초기화/조회(contained)
// 변경 -> 바깥 패널(TenantDashboard) 안의 한 줄: 돋보기 + placeholder 조건 + 조회(outlined) + 초기화 아이콘, 오른쪽 끝 토글
export function TenantFilterSection(props: TenantFilterSectionProps) {
    const {
        value,
        categoryOptions,
        viewMode,
        onChange,
        onReset,
        onSearch,
        onViewModeChange,
    } = props;

    const cycleOptions = useWorkCycleOptions();

    // 기존 -> label 표시 / 변경 -> label 없이 빈 값이면 placeholder, 접근성 이름은 aria-label
    const selectField = (
        key: 'category' | 'cycle' | 'status',
        name: string,
        allLabel: string,
        options: { value: string; label: string }[],
        minWidth: number,
    ) => (
        <AppSelect
            size="small"
            value={value[key]}
            onChange={(next) => onChange({ ...value, [key]: next })}
            options={options}
            emptyLabel={allLabel}
            sx={{ minWidth, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: FILTER_RADIUS } }}
            selectProps={{
                SelectDisplayProps: { 'aria-label': name },
                renderValue: (selected): ReactNode =>
                    options.find((option) => option.value === selected)?.label ??
                    allLabel,
            }}
        />
    );

    const toOptions = (labels: readonly string[]) =>
        labels.map((label) => ({ value: label, label }));

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            useFlexGap
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ p: 2 }}
        >
            <SearchOutlinedIcon
                color="primary"
                sx={{ display: { xs: 'none', md: 'block' } }}
            />
            {selectField('category', '업무분류', '전체', toOptions(categoryOptions), 200)}
            {selectField(
                'cycle',
                '주기',
                '전체(수시제외)',
                cycleOptions.map((option) => ({ value: option.code, label: option.name })),
                150,
            )}
            {selectField('status', '상태', '전체', toOptions(TODO_STATUS_OPTIONS), 150)}

            <AppTextField
                size="small"
                placeholder="업무명을 입력하세요."
                value={value.keyword}
                onChange={(keyword) => onChange({ ...value, keyword })}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        onSearch();
                    }
                }}
                slotProps={{ htmlInput: { 'aria-label': '업무명' } }}
                sx={{
                    flex: { md: '0 1 400px' },
                    minWidth: 160,
                    '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: FILTER_RADIUS },
                }}
            />

            {/* 기존 -> 조회 outlined 글자 버튼 + 초기화 아이콘, 간격 8px */}
            {/* 변경 -> 조회 남색 채움 돋보기 아이콘 버튼 + 초기화 아이콘, 둘 다 40px 정사각형, 간격 4px */}
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <IconButton
                    aria-label="조회"
                    onClick={onSearch}
                    sx={{
                        width: FILTER_BUTTON_SIZE,
                        height: FILTER_BUTTON_SIZE,
                        borderRadius: FILTER_RADIUS,
                        bgcolor: SEARCH_BUTTON_COLOR,
                        color: 'common.white',
                        '&:hover': { bgcolor: SEARCH_BUTTON_COLOR, opacity: 0.9 },
                    }}
                >
                    <SearchOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                    aria-label="초기화"
                    onClick={onReset}
                    sx={{
                        width: FILTER_BUTTON_SIZE,
                        height: FILTER_BUTTON_SIZE,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: FILTER_RADIUS,
                        bgcolor: 'background.paper',
                    }}
                >
                    <RestartAltOutlinedIcon fontSize="small" />
                </IconButton>
            </Stack>

            {/* 기존 -> 검색조건 윗줄 오른쪽 / 변경 -> 같은 줄 오른쪽 끝: 리스트형/캘린더형 전환 */}
            <Box sx={{ ml: { md: 'auto' }, flexShrink: 0 }}>
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
                    // 기존 -> 붙어 있는 그룹, 선택 시 MUI 기본 회색 배경
                    // 변경 -> 떨어진 버튼, 선택 시 짙은 테두리 + 진한 글자, 미선택은 연한 테두리 + 회색 글자
                    sx={{
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            minWidth: 96,
                            height: FILTER_BUTTON_SIZE,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: `${FILTER_RADIUS} !important`,
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
    );
}