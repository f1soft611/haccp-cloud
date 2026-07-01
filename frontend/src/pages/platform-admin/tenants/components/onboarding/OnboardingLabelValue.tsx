import { Box, Typography } from '@mui/material';

type OnboardingLabelValueProps = {
  label: string;
  value: string;
};

export function OnboardingLabelValue({
  label,
  value,
}: OnboardingLabelValueProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 140, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || '—'}
      </Typography>
    </Box>
  );
}
