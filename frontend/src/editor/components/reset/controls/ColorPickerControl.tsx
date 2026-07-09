import { Box, Tooltip } from '@mui/material';
import type { ChangeEvent } from 'react';

type ColorPickerControlProps = {
  title: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPickerControl(props: ColorPickerControlProps) {
  const { title, value, onChange } = props;

  return (
    <Tooltip title={title}>
      <Box
        component="input"
        type="color"
        aria-label={title}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        sx={{
          width: 28,
          height: 28,
          p: 0,
          border: 'none',
          borderRadius: 1,
          bgcolor: 'transparent',
          cursor: 'pointer',
          '&::-webkit-color-swatch-wrapper': {
            p: 0,
          },
          '&::-webkit-color-swatch': {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          },
        }}
      />
    </Tooltip>
  );
}
