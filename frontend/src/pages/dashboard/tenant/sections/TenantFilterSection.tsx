import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import {
    Box,
    Button,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useWorkCycleOptions } from '../../../../shared/hooks/useWorkCycleOptions';
import {
    TODO_STATUS_OPTIONS,
    type TenantTodoFilter,
    type TenantViewMode,
} from '../todoFilter';

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
        <TextField
            select
            size="small"
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            sx={{ minWidth, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
            slotProps={{
                select: {
                    displayEmpty: true,
                    SelectDisplayProps: { 'aria-label': name },
                    // 기존 -> options 에 없는 '' 이면 placeholder(name)
                    // 변경 -> '' 이면 allLabel(전체, 전체(수시제외))
                    renderValue: (selected): ReactNode =>
                        options.find((option) => option.value === selected)?.label ??
                        allLabel,
                },
            }}
        >
            <MenuItem value="">{allLabel}</MenuItem>
            {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
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

            <TextField
                size="small"
                placeholder="업무명을 입력하세요."
                value={value.keyword}
                onChange={(event) => onChange({ ...value, keyword: event.target.value })}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        onSearch();
                    }
                }}
                slotProps={{ htmlInput: { 'aria-label': '업무명' } }}
                sx={{
                    flex: { md: '0 1 400px' },
                    minWidth: 160,
                    '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
                }}
            />

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button
                    variant="outlined"
                    onClick={onSearch}
                    sx={{ whiteSpace: 'nowrap', bgcolor: 'background.paper', }}
                >
                    조회
                </Button>
                <IconButton
                    aria-label="초기화"
                    onClick={onReset}
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
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
                    sx={{ bgcolor: 'background.paper' }}
                >
                    <ToggleButton value="list" aria-label="리스트형">
                        <ViewListOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                        리스트
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