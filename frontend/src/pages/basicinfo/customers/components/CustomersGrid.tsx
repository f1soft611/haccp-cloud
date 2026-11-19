import { ToggleLeft, ToggleRight } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  Skeleton,
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
import { INACTIVE_ROW_CLASS } from '../../../../app/theme';

type CustomersGridProps = {
  rows: CustomerItem[];
  loading?: boolean;
  onEdit: (customer: CustomerItem) => void;
  onToggleActive: (customer: CustomerItem) => void;
};

export function CustomersGrid({
  rows,
  loading,
  onEdit,
  onToggleActive,
}: CustomersGridProps) {

  return (
    <AdminGrid ariaLabel="거래처 목록">
      <TableHead>
        <TableRow>
          {/* 데이터 컬럼에 고정 너비를 줘야 빈 칸이 남는 폭을 차지함 (사용자관리와 동일) */}
          <TableCell width={100}>거래처코드</TableCell>
          <TableCell width={200}>거래처명</TableCell>
          <TableCell width={120}>대표자명</TableCell>
          <TableCell width={150}>사업자번호</TableCell>
          <TableCell width={150}>전화번호</TableCell>
          <TableCell aria-hidden />
          <TableCell width={80}>작업</TableCell>
          <TableCell width={90}>활성상태</TableCell>
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
                <TableCell aria-hidden />
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="rounded" width={32} height={32} sx={{ mx: 'auto' }} />
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} align="center">
              조회된 거래처가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => {
              const toggleLabel = row.active ? '비활성화' : '활성화';
              return (
                <TableRow key={row.id} hover className={row.active ? undefined : INACTIVE_ROW_CLASS}>
                  <TableCell align="center">{row.customerCode}</TableCell>
                  <TableCell align="center">{row.customerName}</TableCell>
                  <TableCell align="center">{row.presidentName || '-'}</TableCell>
                  <TableCell align="center">
                    {row.businessNo ? formatBusinessNo(row.businessNo) : '-'}
                  </TableCell>
                  <TableCell align="center">{row.telephoneNo || '-'}</TableCell>
                  <TableCell aria-hidden />
                  <TableCell align="center">
                    {/* 비활성 거래처는 수정 불가, 셀은 남겨 정렬 유지 (사용자관리와 동일) */}
                    {row.active ? (
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
                    ) : null}
                  </TableCell>
                  <TableCell align="center">
                    {/* 상태 칩 + 삭제 버튼을 하나로: 모양은 현재 상태, 툴팁은 누르면 할 동작 */}
                    <Tooltip title={toggleLabel}>
                      <span>
                        <GridIconButton
                          aria-label={toggleLabel}
                          aria-pressed={row.active}
                          onClick={() => onToggleActive(row)}
                          sx={{ color: row.active ? 'primary.main' : 'grey.400' }}
                        >
                          {row.active ? <ToggleRight /> : <ToggleLeft />}
                        </GridIconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          : null}
      </TableBody>
    </AdminGrid>
  );
}