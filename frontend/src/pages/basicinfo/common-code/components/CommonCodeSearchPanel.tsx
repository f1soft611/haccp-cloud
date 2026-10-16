import { Button, Paper, Stack, TextField } from '@mui/material';

// 작업지시 WorkOrderSearchPanel과 동일한 검색영역 구성
// 기존 -> 검색 + 조회 + 저장(전체 저장) 버튼
// 변경 -> 저장은 그룹/상세 그리드별로 분리되어 검색영역에는 조회만
export function CommonCodeSearchPanel(props: {
    keyword: string;
    onKeywordChange: (next: string) => void;
    onSearch: () => void;
}) {
    const { keyword, onKeywordChange, onSearch } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                useFlexGap
                alignItems={{ xs: 'stretch', md: 'center' }}
            >
                <TextField
                    size="small"
                    label="그룹 검색"
                    placeholder="그룹 코드/명/설명 검색"
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    sx={{ minWidth: { md: 320 } }}
                />
                <Button variant="contained" onClick={onSearch}>
                    조회
                </Button>
            </Stack>
        </Paper>
    );
}