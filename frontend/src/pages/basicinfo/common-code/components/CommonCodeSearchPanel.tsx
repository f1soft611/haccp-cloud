import { TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';

// 작업지시 WorkOrderSearchPanel과 동일한 검색영역 구성
export function CommonCodeSearchPanel(props: {
    keyword: string;
    onKeywordChange: (next: string) => void;
    onSearch: () => void;
}) {
    const { keyword, onKeywordChange, onSearch } = props;

    return (
        <SearchFilterBar onSearch={onSearch}>
            <TextField
                size="small"
                label="그룹 검색"
                placeholder="그룹 코드/명/설명 검색"
                value={keyword}
                onChange={(event) => onKeywordChange(event.target.value)}
                sx={{ minWidth: { md: 320 } }}
            />
        </SearchFilterBar>
    );
}