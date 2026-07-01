import {
  Chip,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { GridPaginationBar } from '../../../../shared/components/data/GridPaginationBar';
import { type PlatformTenantManagementItem } from '../../../../services/platform-admin/tenants/platformTenantManagementService';

type PlatformTenantGridProps = {
  rows: PlatformTenantManagementItem[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onRowClick?: (row: PlatformTenantManagementItem) => void;
  onPageChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
};

function renderOnboardingLabel(
  status: PlatformTenantManagementItem['onboardingStatus'],
) {
  if (status === 'ACTIVE') return '온보딩 완료';
  if (status === 'FIRST_SETUP_COMPLETED') return '초기 설정 완료';
  if (status === 'EMAIL_VERIFIED') return '메일 인증 완료';
  if (status === 'EMAIL_SENT') return '메일 발송 완료';
  return '메일 발송 대기';
}

function renderOnboardingColor(
  status: PlatformTenantManagementItem['onboardingStatus'],
) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'EMAIL_VERIFIED' || status === 'FIRST_SETUP_COMPLETED') {
    return 'info' as const;
  }
  return 'warning' as const;
}

export function PlatformTenantGrid({
  rows,
  loading,
  pageIndex,
  pageSize,
  totalCount,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}: PlatformTenantGridProps) {
  return (
    <>
      <AdminGrid ariaLabel="업체 목록">
        <TableHead>
          <TableRow>
            <TableCell>업체코드</TableCell>
            <TableCell>업체명</TableCell>
            <TableCell align="center">플랜</TableCell>
            <TableCell>관리자명</TableCell>
            <TableCell>관리자이메일</TableCell>
            <TableCell align="center">사용유무</TableCell>
            <TableCell align="center">온보딩 상태</TableCell>
            <TableCell align="center">생성일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={`platform-tenant-grid-skeleton-${index}`}
                  data-testid={`platform-tenant-grid-skeleton-row-${index}`}
                >
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="72%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={56}
                      height={24}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="68%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="88%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={52}
                      height={24}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={96}
                      height={24}
                      sx={{ mx: 'auto' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="text" width="65%" />
                  </TableCell>
                </TableRow>
              ))
            : null}

          {!loading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                조회 결과가 없습니다.
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? rows.map((row) => (
                <TableRow
                  key={row.tenantCode}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={
                    onRowClick
                      ? {
                          cursor: 'pointer',
                        }
                      : undefined
                  }
                >
                  <TableCell>{row.tenantCode}</TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.planCode || row.planName || '-'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.adminName}</TableCell>
                  <TableCell>{row.adminEmail}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status === 'ACTIVE' ? '활성' : '비활성'}
                      size="small"
                      color={row.status === 'ACTIVE' ? 'success' : 'default'}
                      variant={row.status === 'ACTIVE' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={renderOnboardingLabel(row.onboardingStatus)}
                      size="small"
                      color={renderOnboardingColor(row.onboardingStatus)}
                      variant={
                        row.onboardingStatus === 'ACTIVE'
                          ? 'filled'
                          : 'outlined'
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    {row.createdAt ? row.createdAt.slice(0, 10) : '-'}
                  </TableCell>
                </TableRow>
              ))
            : null}
        </TableBody>
      </AdminGrid>

      <GridPaginationBar
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}
