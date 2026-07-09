import { Box, Button, Menu, Stack, Typography } from '@mui/material';
import { ColorPickerControl } from '../../components/reset/controls/ColorPickerControl';
import { standardExcelColors } from '../../utils/editorColorPalette';

type StandardColorMenuProps = {
  title: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  selectedColor: string;
  resetLabel: string;
  onClose: () => void;
  onSelectColor: (value: string) => void;
  onReset: () => void;
};

export function StandardColorMenu(props: StandardColorMenuProps) {
  const {
    title,
    anchorEl,
    open,
    selectedColor,
    resetLabel,
    onClose,
    onSelectColor,
    onReset,
  } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <Box sx={{ p: 1.5, width: 244 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          {title}
        </Typography>
        <Stack spacing={1.25} sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onReset();
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            {resetLabel}
          </Button>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 0.75,
            }}
          >
            {standardExcelColors.map((color) => {
              const isActive =
                color.toLowerCase() === selectedColor.toLowerCase();

              return (
                <Box
                  key={color}
                  component="button"
                  type="button"
                  aria-label={`${title} ${color}`}
                  onClick={() => {
                    onSelectColor(color);
                    onClose();
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: isActive ? 'primary.main' : 'divider',
                    boxShadow: isActive
                      ? '0 0 0 2px rgba(11, 107, 111, 0.16)'
                      : 'none',
                    bgcolor: color,
                    cursor: 'pointer',
                    p: 0,
                  }}
                />
              );
            })}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              사용자 지정
            </Typography>
            <ColorPickerControl
              title={`${title} 사용자 지정`}
              value={selectedColor}
              onChange={onSelectColor}
            />
          </Stack>
        </Stack>
      </Box>
    </Menu>
  );
}
