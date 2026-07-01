import {
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { APP_LABELS } from '../../../../../shared/constants/labels';
import { type SampleTenantItem } from '../../../../../services/organization/tenantService';

type OnboardingHistorySectionProps = {
  loading: boolean;
  error: boolean;
  rows: SampleTenantItem[];
};

export function OnboardingHistorySection({
  loading,
  error,
  rows,
}: OnboardingHistorySectionProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {APP_LABELS.onboarding.sampleTenantListTitle}
      </Typography>

      {loading && (
        <Typography variant="body2" color="text.secondary">
          {APP_LABELS.onboarding.sampleTenantListLoading}
        </Typography>
      )}
      {error && (
        <Alert severity="error">
          {APP_LABELS.onboarding.sampleTenantListError}
        </Alert>
      )}
      {!loading && !error && rows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {APP_LABELS.onboarding.sampleTenantListEmpty}
        </Typography>
      )}
      {!loading && !error && rows.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                {APP_LABELS.dashboard.platformAdmin.table.tenantCode}
              </TableCell>
              <TableCell>
                {APP_LABELS.dashboard.platformAdmin.table.companyName}
              </TableCell>
              <TableCell>{APP_LABELS.field.adminEmail}</TableCell>
              <TableCell>
                {APP_LABELS.dashboard.platformAdmin.table.issuedAt}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.tenantCode} hover>
                <TableCell>
                  <Chip
                    label={item.tenantCode}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{item.companyName}</TableCell>
                <TableCell>{item.adminEmail}</TableCell>
                <TableCell>
                  {item.issuedAt ? item.issuedAt.slice(0, 10) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
