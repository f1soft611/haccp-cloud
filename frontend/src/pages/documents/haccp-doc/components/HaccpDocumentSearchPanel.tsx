import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  Button,
  Chip,
  Collapse,
  Divider,
  Checkbox,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
} from '@mui/material';
import type { HaccpDocFilterChip, HaccpDocSearchValue } from '../types';

const STATUS_OPTIONS = ['전체', '임시저장', '결재중', '승인', '반송'];
const PARTICIPANT_OPTIONS = ['기안자', '결재자', '참조자'];

export function HaccpDocumentSearchPanel(props: {
  value: HaccpDocSearchValue;
  appliedFilters: HaccpDocSearchValue;
  canViewAllDocuments: boolean;
  detailOpen: boolean;
  activeFilterChips: HaccpDocFilterChip[];
  categoryOptions: Array<{ id: string; name: string }>;
  onChange: (next: HaccpDocSearchValue) => void;
  onToggleDetail: () => void;
  onReset: () => void;
  onSearch: () => void;
}) {
  const {
    value,
    canViewAllDocuments,
    detailOpen,
    activeFilterChips,
    categoryOptions,
    onChange,
    onToggleDetail,
    onReset,
    onSearch,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
        >
          <TextField
            select
            size="small"
            label="업무분류"
            value={value.workType}
            onChange={(event) =>
              onChange({
                ...value,
                workType: event.target.value,
              })
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="전체">전체</MenuItem>
            {categoryOptions.map((cat) => (
              <MenuItem key={cat.id} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="제목"
            value={value.title}
            onChange={(event) =>
              onChange({
                ...value,
                title: event.target.value,
              })
            }
            sx={{ flex: 1, minWidth: 220 }}
          />

          <TextField
            select
            size="small"
            label="상태"
            value={value.status}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value,
              })
            }
            sx={{ minWidth: 140 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onReset}>
              초기화
            </Button>
            <Button variant="contained" onClick={onSearch}>
              조회
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Button
            variant="text"
            startIcon={<TuneRoundedIcon />}
            onClick={onToggleDetail}
            sx={{
              width: { xs: '100%', md: 'auto' },
              alignSelf: 'flex-start',
            }}
          >
            {detailOpen ? '상세조건 닫기' : '상세조건'}
          </Button>

          {activeFilterChips.length > 0 ? (
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              useFlexGap
              flexWrap="wrap"
            >
              {activeFilterChips.map((chip) => (
                <Chip
                  key={chip.key}
                  size="small"
                  label={chip.label}
                  variant="outlined"
                />
              ))}
            </Stack>
          ) : null}
        </Stack>

        <Collapse in={detailOpen} timeout="auto" unmountOnExit={false}>
          <Stack spacing={1.2}>
            <Divider />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  type="date"
                  label="시작일"
                  value={value.startDate}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      startDate: event.target.value,
                    })
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="종료일"
                  value={value.endDate}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      endDate: event.target.value,
                    })
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                size="small"
                label="기안번호"
                value={value.draftNumber}
                onChange={(event) =>
                  onChange({
                    ...value,
                    draftNumber: event.target.value,
                  })
                }
                sx={{ minWidth: 180 }}
              />

              <TextField
                select
                size="small"
                label="참여유형"
                value={value.participantType}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    Array.isArray(selected) && selected.length > 0
                      ? selected.join(', ')
                      : '전체',
                }}
                onChange={(event) =>
                  onChange({
                    ...value,
                    participantType:
                      typeof event.target.value === 'string'
                        ? event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter((item) => item.length > 0)
                        : event.target.value,
                  })
                }
                sx={{ minWidth: 160 }}
              >
                {PARTICIPANT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox
                      checked={value.participantType.includes(option)}
                    />
                    <ListItemText primary={option} />
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="작성자"
                value={value.writer}
                disabled={!canViewAllDocuments}
                onChange={(event) =>
                  onChange({
                    ...value,
                    writer: event.target.value,
                  })
                }
                sx={{ minWidth: 160 }}
              />
            </Stack>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
