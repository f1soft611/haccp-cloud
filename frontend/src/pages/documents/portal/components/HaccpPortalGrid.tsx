import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Chip,
  IconButton,
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
import { resolveDraftRoute } from '../../../../shared/utils/workDraftRoute';
import type { PortalRow } from '../types';

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

  // ponytail: 포탈 API에 approvalId/writtenInCycle이 없어 항상 현재 주기 작성(idType=work)으로 연다
  const openDraft = (row: PortalRow) => {
    const path = resolveDraftRoute({ id: row.id });
    if (path) navigate(path);
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
          {/* 기존 -> 없음 / 변경 -> 분류 뒤 자동기록 칼럼 추가 */}
          <TableCell align="center" width={100}>자동기록</TableCell>
          <TableCell width={120} align="center">등록주기</TableCell>
          <TableCell align="center" width={200}>담당자</TableCell>
          <TableCell align="center" width={80}>작성</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                data-testid={`haccp-portal-grid-skeleton-row-${index}`}
              >
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
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
                {/* ponytail: 자동기록 데이터 필드 미정, API에 추가되면 값 연결 */}
                <TableCell align="center">-</TableCell>
                <TableCell align="center">
                  <Chip
                      size="small"
                      label={row.cycleName || row.cycle || '-'}
                      sx={{
                        height: 22,
                        fontWeight: 700,
                        ...getWorkCycleSx(row.cycle),
                      }}
                  />
                </TableCell>
                <TableCell>{row.assigneeSummary || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton
                      size="small"
                      color="primary"
                      aria-label="작성하러 가기"
                      onClick={() => openDraft(row)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </AdminGrid>
  );
}
