import { Box, Button, Divider, Menu, Stack, Typography } from '@mui/material';
import { ColorPickerControl } from '../../components/reset/controls/ColorPickerControl';
import { standardExcelColors } from '../../utils/editorColorPalette';
import type { CellBorderStyle } from '../../utils/editorTableTypes';

type TableBorderMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  selectedColor: string;
  onClose: () => void;
  onApplyBorder: (style: CellBorderStyle, width?: string) => void;
  onSelectColor: (value: string) => void;
  onReset: () => void;
};

export function TableBorderMenu(props: TableBorderMenuProps) {
  const {
    anchorEl,
    open,
    selectedColor,
    onClose,
    onApplyBorder,
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
      <Box sx={{ p: 1.5, width: 260 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          셀 테두리
        </Typography>
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onApplyBorder('solid');
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            전체 테두리
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onApplyBorder('solid', '2px');
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            굵은 테두리
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onApplyBorder('dashed');
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            점선 테두리
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onApplyBorder('double', '3px');
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            이중 테두리
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              onReset();
              onClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            테두리 제거
          </Button>
        </Stack>
        <Divider sx={{ my: 1.25 }} />
        <Typography variant="caption" color="text.secondary">
          테두리 색상
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0.75,
            mt: 1,
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
                aria-label={`테두리 색상 ${color}`}
                onClick={() => {
                  onSelectColor(color);
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
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 1.25 }}
        >
          <Typography variant="caption" color="text.secondary">
            사용자 지정
          </Typography>
          <ColorPickerControl
            title="테두리 색상 사용자 지정"
            value={selectedColor}
            onChange={onSelectColor}
          />
        </Stack>
      </Box>
    </Menu>
  );
}
