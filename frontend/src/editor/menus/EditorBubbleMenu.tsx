import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Popover,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useState } from 'react';
import LinkIcon from '@mui/icons-material/Link';
import PaletteIcon from '@mui/icons-material/Palette';

type EditorBubbleMenuProps = {
  editor: Editor;
};

function getActionSx(isActive: boolean) {
  return (theme: Theme) => ({
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
  });
}

export function EditorBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor } = props;

  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const closeLinkPopover = () => {
    setLinkAnchor(null);
  };

  const openLinkPopover = (anchor: HTMLElement) => {
    const currentHref = String(editor.getAttributes('link').href ?? '');
    const currentTarget = String(
      editor.getAttributes('link').target ?? '_blank',
    );
    setLinkUrl(currentHref);
    setOpenInNewTab(currentTarget === '_blank');
    setLinkAnchor(anchor);
  };

  const applyLink = () => {
    const normalized = linkUrl.trim();
    if (!normalized) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      closeLinkPopover();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: normalized,
        target: openInNewTab ? '_blank' : '_self',
      })
      .run();
    closeLinkPopover();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: currentEditor, from, to }) => {
        if (currentEditor.isActive('table')) {
          return false;
        }

        return from !== to;
      }}
    >
      <Stack
        direction="row"
        spacing={0.25}
        sx={{
          p: 0.5,
          bgcolor: 'background.paper',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 2,
        }}
      >
        <Tooltip title="링크">
          <IconButton
            size="small"
            onClick={(event) => openLinkPopover(event.currentTarget)}
            sx={getActionSx(editor.isActive('link'))}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="텍스트 색상">
          <IconButton
            size="small"
            component="label"
            sx={getActionSx(editor.isActive('textStyle'))}
          >
            <PaletteIcon fontSize="small" />
            <input
              type="color"
              hidden
              onChange={(event) => {
                const color = event.target.value;
                editor.chain().focus().setColor(color).run();
              }}
            />
          </IconButton>
        </Tooltip>

        <Tooltip title="색상 제거">
          <IconButton
            size="small"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>A</span>
          </IconButton>
        </Tooltip>
      </Stack>

      <Popover
        open={Boolean(linkAnchor)}
        anchorEl={linkAnchor}
        onClose={closeLinkPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={1.25} sx={{ p: 1.5, minWidth: 280 }}>
          <TextField
            size="small"
            label="URL"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={openInNewTab}
                onChange={(event) => setOpenInNewTab(event.target.checked)}
              />
            }
            label="새 창에서 열기"
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .unsetLink()
                  .run();
                closeLinkPopover();
              }}
            >
              링크 해제
            </Button>
            <Button size="small" variant="contained" onClick={applyLink}>
              적용
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </BubbleMenu>
  );
}
