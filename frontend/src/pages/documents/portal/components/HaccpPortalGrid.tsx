import {
  Chip,
  Link,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getWorkCycleSx } from '../../../dashboard/tenant/utils';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { PortalRow } from '../types';

// 기존 -> 분류별 카드 패널(Grid + Paper) 3열 레이아웃
// 변경 -> AdminGrid 단일 데이터 그리드
export function HaccpPortalGrid({
  rows,
  loading,
}: {
  rows: PortalRow[];
  loading: boolean;
}) {
  const navigate = useNavigate();

  const openDocument = (row: PortalRow) => {
    const query = new URLSearchParams();
    if (row.categoryName) query.set('workType', row.categoryName);
    if (row.divisionName) query.set('workDivision', row.divisionName);
    if (row.id) query.set('workDivisionId', row.id);
    navigate(`/docs/haccp-doc?${query.toString()}`);
  };

  return (
    <AdminGrid ariaLabel="HACCP 문서포탈 목록">
      <TableHead>
        <TableRow>
          <TableCell width={72} align="center">
            No
          </TableCell>
          <TableCell align="center" sx={{ minWidth: 200 }}>구분명</TableCell>
          <TableCell align="center" width={200}>분류</TableCell>
          <TableCell width={120} align="center">등록주기</TableCell>
          <TableCell align="center" width={200}>담당자</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                data-testid={`haccp-portal-grid-skeleton-row-${index}`}
              >
                {Array.from({ length: 5 }).map((__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center">
              조회된 문서가 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row, index) => (
              <TableRow key={`${row.id}-${index}`} hover>
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell>
                  <Link
                    component="button"
                    underline="hover"
                    fontWeight={700}
                    color="inherit"
                    onClick={() => openDocument(row)}
                  >
                    {row.divisionName || '-'}
                  </Link>
                </TableCell>
                <TableCell>{row.categoryName}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={row.cycleLabel}
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      ...getWorkCycleSx(row.cycleLabel),
                    }}
                  />
                </TableCell>
                <TableCell>{row.assigneeSummary || '-'}</TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
