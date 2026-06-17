import { Box, Stack, Typography } from '@mui/material';

export type PageHeaderProps = {
  title: string;
  groupLabel?: string;
  description?: string;
};

export function PageHeader({
  title,
  groupLabel,
  description,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        pl: 2,
        borderLeft: '4px solid',
        borderColor: 'primary.main',
      }}
    >
      {groupLabel ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.4}
          sx={{ mb: 0.35 }}
        >
          <Typography variant="caption" color="text.secondary">
            {groupLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ›
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Stack>
      ) : null}

      <Typography
        component="h1"
        variant="h5"
        fontWeight={700}
        sx={{ lineHeight: 1.15 }}
      >
        {title}
      </Typography>

      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
