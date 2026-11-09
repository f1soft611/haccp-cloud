import { AppTextField } from '../../../../shared/components/forms/AppTextField';
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
            <AppTextField
                size="small"
                placeholder="그룹 코드/명/설명 검색"
                slotProps={{ htmlInput: { 'aria-label': '그룹 코드/명/설명 검색' } }}
                value={keyword}
                onChange={onKeywordChange}
                sx={{ minWidth: { md: 320 } }}
            />
        </SearchFilterBar>
    );
}