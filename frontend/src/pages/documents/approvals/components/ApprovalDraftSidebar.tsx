import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import {
  Autocomplete,
  Box,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { HaccpBaseWorkItem } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';

type SignerRole = 'drafter' | 'reviewer' | 'approver';

type SignerLineItem = {
  role: SignerRole;
  roleLabel: string;
  name: string;
  appStatus?: string;
  signatureImage?: string;
  stampImage?: string;
};

const FALLBACK_STAMP_BY_ROLE: Record<SignerRole, string> = {
  drafter: '/project.png',
  reviewer: '/confirm.png',
  approver: '/approve.png',
};

type ApprovalDraftSidebarProps = {
  isDarkMode: boolean;
  embedded?: boolean;
  work?: HaccpBaseWorkItem;
  drafterName: string;
  drafterProfile?: UserItem;
  reviewerProfile?: UserItem;
  approverProfile?: UserItem;
  referenceOptions: UserItem[];
  selectedReferences: UserItem[];
  onChangeReferences: (next: string[]) => void;
};

function normalizeStatus(value: string | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getStatusLabel(value: string): string {
  if (value === 'approved') {
    return '승인';
  }
  if (value === 'confirmed') {
    return '확인';
  }
  if (value === 'returned') {
    return '반송';
  }
  return '대기';
}

function getStatusChipColor(
  value: string,
): 'default' | 'success' | 'info' | 'warning' | 'error' {
  if (value === 'approved') {
    return 'success';
  }
  if (value === 'confirmed') {
    return 'info';
  }
  if (value === 'returned') {
    return 'error';
  }
  return 'default';
}

export function ApprovalDraftSidebar(props: ApprovalDraftSidebarProps) {
  const {
    isDarkMode,
    embedded = false,
    work,
    drafterName,
    drafterProfile,
    reviewerProfile,
    approverProfile,
    referenceOptions,
    selectedReferences,
    onChangeReferences,
  } = props;

  const signerLine: SignerLineItem[] = [
    {
      role: 'drafter',
      roleLabel: '기안',
      name: drafterName || '-',
      appStatus: work?.drafterAppStatus,
      signatureImage: drafterProfile?.signatureImage,
      stampImage: drafterProfile?.stampImage,
    },
    {
      role: 'reviewer',
      roleLabel: '검토',
      name: work?.reviewerName || '-',
      appStatus: work?.reviewerAppStatus,
      signatureImage: reviewerProfile?.signatureImage,
      stampImage: reviewerProfile?.stampImage,
    },
    {
      role: 'approver',
      roleLabel: '승인',
      name: work?.approverName || '-',
      appStatus: work?.approverAppStatus,
      signatureImage: approverProfile?.signatureImage,
      stampImage: approverProfile?.stampImage,
    },
  ];

  const approvalStatus = String(work?.approvalStatusType ?? '')
    .trim()
    .toLowerCase();
  const hasSubmitted =
    approvalStatus.length > 0 && approvalStatus !== 'pre_apply';
  const isApproved = approvalStatus === 'approved';

  const canShowSignerImage = (item: SignerLineItem): boolean => {
    if (item.role === 'drafter') {
      return hasSubmitted;
    }
    return isApproved;
  };

  const resolveSignerImage = (item: SignerLineItem): string => {
    if (item.signatureImage && item.signatureImage.trim()) {
      return item.signatureImage;
    }
    return FALLBACK_STAMP_BY_ROLE[item.role];
  };

  const content = (
    <Stack
      divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        sx={{ py: 1 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minWidth: 76, pt: { md: 0.75 } }}
        >
          결재선
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          sx={{ flex: 1 }}
        >
          {signerLine.map((item, index) => (
            <Stack
              key={item.role}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Stack
                direction="row"
                spacing={0.9}
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.7,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isDarkMode
                    ? 'rgba(148,163,184,0.28)'
                    : 'rgba(15,23,42,0.12)',
                  bgcolor: isDarkMode
                    ? 'rgba(30,41,59,0.35)'
                    : 'rgba(248,250,252,0.7)',
                }}
              >
                <Chip
                  size="small"
                  variant="outlined"
                  color={
                    item.role === 'drafter'
                      ? 'default'
                      : item.role === 'reviewer'
                        ? 'info'
                        : 'warning'
                  }
                  label={item.roleLabel}
                />
                <Typography variant="body2" fontWeight={700}>
                  {item.name}
                </Typography>
                <Chip
                  size="small"
                  color={getStatusChipColor(normalizeStatus(item.appStatus))}
                  variant="outlined"
                  label={getStatusLabel(normalizeStatus(item.appStatus))}
                />
                {canShowSignerImage(item) ? (
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isDarkMode
                        ? 'rgba(148,163,184,0.32)'
                        : 'rgba(15,23,42,0.12)',
                      bgcolor: isDarkMode
                        ? 'rgba(255,255,255,0.96)'
                        : 'rgba(255,255,255,0.9)',
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src={resolveSignerImage(item)}
                      alt={`${item.roleLabel} 이미지`}
                      onError={(event) => {
                        const target = event.currentTarget;
                        const fallback = FALLBACK_STAMP_BY_ROLE[item.role];
                        if (target.src.endsWith(fallback)) {
                          return;
                        }
                        target.src = fallback;
                      }}
                      sx={{
                        width: 30,
                        height: 30,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.disabled">
                    미결
                  </Typography>
                )}
              </Stack>

              {index < signerLine.length - 1 ? (
                <ChevronRightRounded sx={{ color: 'text.disabled' }} />
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.25}
        sx={{ py: 1 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minWidth: 76, pt: { md: 1.2 } }}
        >
          참조
        </Typography>

        <Box sx={{ flex: 1 }}>
          <Autocomplete
            multiple
            options={referenceOptions}
            value={selectedReferences}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, selected) =>
              option.id === selected.id
            }
            onChange={(_, selected) => {
              onChangeReferences(selected.map((item) => item.id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="참조자 이름으로 검색"
                size="small"
              />
            )}
          />
        </Box>
      </Stack>
    </Stack>
  );

  if (embedded) {
    return <Box sx={{ pt: 0.25 }}>{content}</Box>;
  }

  return (
    <Paper
      sx={{
        p: { xs: 1.25, md: 1.75 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: isDarkMode
          ? 'rgba(148,163,184,0.24)'
          : 'rgba(15,23,42,0.12)',
        bgcolor: 'background.paper',
      }}
    >
      {content}
    </Paper>
  );
}
