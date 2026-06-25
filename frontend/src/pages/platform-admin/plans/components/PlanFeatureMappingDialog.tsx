import {
  Alert,
  Button,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type {
  PlanFeatureItem,
  PlanSummary,
} from '../../../../services/plan/planAccessService';

export function PlanFeatureMappingDialog(props: {
  open: boolean;
  plan: PlanSummary | null;
  features: PlanFeatureItem[];
  loading?: boolean;
  saving?: boolean;
  error?: boolean;
  onToggle: (featureCode: string) => void;
  onLimitChange: (featureCode: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const {
    open,
    plan,
    features,
    loading = false,
    saving = false,
    error = false,
    onToggle,
    onLimitChange,
    onSave,
    onClose,
  } = props;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      title="기능 매핑"
      description={
        plan
          ? `${plan.planName || plan.planCode} (${plan.planCode}) 플랜의 기능 활성 상태를 편집하세요.`
          : '플랜을 선택한 뒤 기능 매핑을 편집하세요.'
      }
      actions={
        <>
          <Button
            variant="contained"
            disabled={!plan || saving}
            onClick={onSave}
          >
            저장
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      {error ? (
        <Alert severity="warning">기능 정보를 불러오지 못했습니다.</Alert>
      ) : null}

      <AdminGrid ariaLabel="플랜 기능 매핑 목록" maxHeight={520}>
        <TableHead>
          <TableRow>
            <TableCell>기능명</TableCell>
            <TableCell width={140}>기능 타입</TableCell>
            <TableCell width={120} align="center">
              활성 여부
            </TableCell>
            <TableCell width={220}>값</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && features.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary">
                  등록된 기능 정보가 없습니다.
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}

          {features.map((feature) => (
            <TableRow key={feature.featureCode} hover>
              <TableCell>
                <Typography variant="body2">{feature.featureName}</Typography>
                {feature.featureName !== feature.featureCode ? (
                  <Typography variant="caption" color="text.secondary">
                    {feature.featureCode}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>{feature.featureType}</TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={feature.enabled}
                  onChange={() => onToggle(feature.featureCode)}
                  inputProps={{
                    'aria-label': `${feature.featureName} 활성 여부`,
                  }}
                />
              </TableCell>
              <TableCell>
                {feature.featureType === 'LIMIT' ? (
                  <TextField
                    size="small"
                    type="number"
                    label={`${feature.featureCode} 값`}
                    value={feature.limitValue ?? ''}
                    onChange={(event) =>
                      onLimitChange(feature.featureCode, event.target.value)
                    }
                    disabled={!feature.enabled}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminGrid>
    </FormDialog>
  );
}
