import { Alert, Stack } from '@mui/material';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { APP_LABELS } from '../../../shared/constants/labels';
import { HaccpDocumentGrid } from './components/HaccpDocumentGrid';
import { HaccpDocumentSearchPanel } from './components/HaccpDocumentSearchPanel';
import { useHaccpDocumentManagement } from './hooks/useHaccpDocumentManagement';

export function HaccpDocumentManagementPage() {
  const {
    canViewAllDocuments,
    searchValue,
    setSearchValue,
    appliedFilters,
    detailOpen,
    setDetailOpen,
    activeFilterChips,
    categoryOptions,
    documentsQuery,
    rows,
    totalCount,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    handleReset,
    handleSearch,
  } = useHaccpDocumentManagement();

  return (
    <Stack spacing={2} data-testid="haccp-document-management-page">
      <PageHeader
        groupLabel={APP_LABELS.menu.documentGroup}
        title="HACCP 문서관리"
        description="업무분류, 기안번호, 제목 등 다양한 조건으로 문서를 조회하는 페이지 레이아웃입니다."
      />

      {documentsQuery.isError ? (
        <Alert severity="error">
          {extractApiErrorMessage(
            documentsQuery.error,
            'HACCP 문서 목록을 불러오지 못했습니다.',
          )}
        </Alert>
      ) : null}

      <HaccpDocumentSearchPanel
        value={searchValue}
        appliedFilters={appliedFilters}
        canViewAllDocuments={canViewAllDocuments}
        detailOpen={detailOpen}
        activeFilterChips={activeFilterChips}
        categoryOptions={categoryOptions}
        onChange={setSearchValue}
        onToggleDetail={() => setDetailOpen((prev) => !prev)}
        onReset={handleReset}
        onSearch={handleSearch}
      />

      <HaccpDocumentGrid
        rows={rows}
        loading={documentsQuery.isLoading}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}
