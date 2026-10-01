import { Button, Paper, Stack, TextField } from '@mui/material';

// 작업지시 WorkOrderSearchPanel과 동일한 검색영역 구성
export function CommonCodeSearchPanel(props: {
    keyword: string;
    onKeywordChange: (next: string) => void;
    onSearch: () => void;
    onSave: () => void;
    saveDisabled: boolean;
}) {
    const { keyword, onKeywordChange, onSearch, onSave, saveDisabled } = props;

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
                {/* 기존 -> 조회/저장 버튼을 함께 오른쪽 정렬 */}
                {/* 변경 -> 조회는 검색 필드 옆, 저장만 오른쪽 끝 정렬 */}
                <Button variant="contained" onClick={onSearch}>
                    조회
                </Button>
                <Button variant="outlined" disabled={saveDisabled} onClick={onSave} sx={{ ml: { md: 'auto' } }}>
                    저장
                </Button>
            </Stack>
        </Paper>
    );
}
