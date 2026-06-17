import { Typography } from '@mui/material';
import { APP_LABELS } from '../shared/constants/labels';

export function NotFoundPage() {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        {APP_LABELS.pageTitle.notFound}
      </Typography>
      <Typography>{APP_LABELS.message.notFoundDescription}</Typography>
    </>
  );
}
