import { Trash } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Chip,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import type { CustomerItem } from '../../../../services/basicinfo/customersService';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { formatBusinessNo } from '../../../../shared/utils/businessNumberFormat';
import { GridIconButton } from "../../../../shared/components/data/GridIconButton";

type CustomersGridProps = {
  rows: CustomerItem[];
  loading?: boolean;
  onEdit: (customer: CustomerItem) => void;
  onDelete: (customer: CustomerItem) => void;
};

export function CustomersGrid({
  rows,
  loading,
  onEdit,
  onDelete,
}: CustomersGridProps) {

  return (
    <AdminGrid ariaLabel="거래처 목록">
      <TableHead>
        <TableRow>
          <TableCell width={100}>거래처코드</TableCell>
          <TableCell>거래처명</TableCell>
          <TableCell>대표자명</TableCell>
          <TableCell>사업자번호</TableCell>
          <TableCell>전화번호</TableCell>
          <TableCell width={90} align="center">
            상태
          </TableCell>
          <TableCell width={120} align="center">
            작업
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`customers-grid-skeleton-${index}`}>
                <TableCell>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="78%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="58%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={48}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> spacing 1 / 변경 -> HACCP 문서현황 기준 spacing 0.5 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Skeleton variant="rounded" width={32} height={32} />
                    <Skeleton variant="rounded" width={32} height={32} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
              조회된 거래처가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.customerCode}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.presidentName || '-'}</TableCell>
                <TableCell>
                  {row.businessNo ? formatBusinessNo(row.businessNo) : '-'}
                </TableCell>
                <TableCell>{row.telephoneNo || '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={row.active ? 'success' : 'default'}
                    label={row.active ? '사용' : '미사용'}
                  />
                </TableCell>
                <TableCell align="center">
                  {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="거래처 수정">
                      <span>
                        <GridIconButton
                          aria-label="거래처 수정"
                          onClick={() => onEdit(row)}
                        >
                          <EditPencilIcon />
                        </GridIconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="거래처 삭제">
                      <span>
                        <GridIconButton
                            aria-label="거래처 삭제"
                            tone="danger"
                            onClick={() => onDelete(row)}
                        >
                          <Trash />
                        </GridIconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
