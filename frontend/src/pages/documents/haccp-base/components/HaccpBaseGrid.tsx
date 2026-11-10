import {
  Box,
  Chip,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { FileText } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import {
  getWorkCycleSx,
} from '../../../dashboard/tenant/utils';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { HaccpBaseRow } from '../types';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

export function HaccpBaseGrid(props: {
  rows: HaccpBaseRow[];
  loading: boolean;
  onEdit: (row: HaccpBaseRow) => void;
  onOpenEditorPage: (rowId: string) => void;
}) {
  const { rows, loading, onEdit, onOpenEditorPage } = props;

  return (
      <AdminGrid ariaLabel="HACCP 양식 목록" minWidth={1142}>
      <TableHead>
        <TableRow>
          <TableCell width={72} align="center">
            No
          </TableCell>
          <TableCell sx={{ minWidth: 200 }} align="center">업무명</TableCell>
          <TableCell width={200} align="center">업무분류</TableCell>
          <TableCell width={120} align="center">
            작성주기
          </TableCell>
          <TableCell width={70} align="center">
            만료일
          </TableCell>
          <TableCell width={70} align="center">
            결재
          </TableCell>
          <TableCell width={70} align="center">
            사용
          </TableCell>
          <TableCell width={110} align="center">
            검토/승인
          </TableCell>
          <TableCell width={90} align="center">
            담당자
          </TableCell>
          <TableCell width={70} align="center">
            문서
          </TableCell>
          <TableCell width={70} align="center">
            수정
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={`haccp-base-grid-skeleton-${index}`}
                data-testid={`haccp-base-grid-skeleton-row-${index}`}
              >
                <TableCell align="center">
                  <Skeleton variant="text" width={24} sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="72%" />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width="64%" />
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
                      width={52}
                      height={24}
                      sx={{ mx: 'auto' }}
                  />
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
                    width={52}
                    height={24}
                    sx={{ mx: 'auto' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={120}
                    height={54}
                    sx={{ mx: 'auto', borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton variant="text" width="62%" sx={{ mx: 'auto' }} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={28}
                    height={28}
                    sx={{ mx: 'auto', borderRadius: 1.5 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={28}
                    height={28}
                    sx={{ mx: 'auto', borderRadius: 1.5 }}
                  />
                </TableCell>
              </TableRow>
            ))
          : null}

        {!loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} align="center">
              조회된 양식이 없습니다.
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell align="center">{row.no}</TableCell>
                <TableCell>
                  {row.divisionName}
                </TableCell>
                <TableCell>{row.categoryName}</TableCell>
                <TableCell align="center">
                  <Chip
                      size="small"
                      label={row.cycleName || row.cycle || '-'}
                      sx={getWorkCycleSx(row.cycle)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                      size="small"
                      label={row.expirationApply === 'Y' ? '해당' : '미해당'}
                      color={row.expirationApply === 'Y' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                      size="small"
                      label={row.approvalApply === 'Y' ? '적용' : '미적용'}
                      color={row.approvalApply === 'Y' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                      size="small"
                      label={row.useAt === 'Y' ? '사용' : '미사용'}
                    color={row.useAt === 'Y' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack
                    spacing={0.75}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      // 기존 -> isDarkMode 로 색 분기 / 변경 -> surface 토큰
                      borderColor: 'surface.outline',
                      bgcolor: 'surface.muted',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr',
                        columnGap: 0.75,
                        rowGap: 0.3,
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        검토
                      </Typography>
                      <Chip
                        size="small"
                        label={row.reviewerName || '-'}
                        variant="outlined"
                        color="info"
                        sx={{ justifySelf: 'start', fontWeight: 600 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        승인
                      </Typography>
                      <Chip
                        size="small"
                        label={row.approverName || '-'}
                        variant="outlined"
                        color="warning"
                        sx={{ justifySelf: 'start', fontWeight: 600 }}
                      />
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>
                    {row.assigneeSummary || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip
                    title={
                      row.hasDocument
                        ? '생성된 문서 내역 보기'
                        : '문서 생성 페이지로 이동'
                    }
                  >
                    <GridIconButton
                      aria-label={
                        row.hasDocument
                          ? '문서 내역 보기'
                          : '문서 생성 페이지 이동'
                      }
                      tone={row.hasDocument ? 'document' : 'muted'}
                      onClick={() => onOpenEditorPage(row.id)}
                    >
                      {/* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */}
                      <FileText />
                    </GridIconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" justifyContent="center">
                    <Tooltip title="업무 수정">
                      <GridIconButton
                        aria-label="업무 수정"
                        onClick={() => onEdit(row)}
                      >
                        <EditPencilIcon />
                      </GridIconButton>
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
