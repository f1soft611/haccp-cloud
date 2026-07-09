import {
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { useState } from 'react';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import PaletteIcon from '@mui/icons-material/Palette';
import TableChartIcon from '@mui/icons-material/TableChart';
import ChecklistIcon from '@mui/icons-material/Checklist';
import type { Editor } from '@tiptap/react';
import { SUPPORTED_CODE_LANGUAGES } from '../extensions/codeBlockExtension';

type EditorToolbarProps = {
  editor: Editor;
  onPickImages: () => void;
};

function getActionSx(isActive: boolean) {
  return (theme: Theme) => ({
    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.16) : 'transparent',
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
  });
}

export function EditorToolbar(props: EditorToolbarProps) {
  const { editor, onPickImages } = props;
  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const openLinkPopover = (anchor: HTMLElement) => {
    const currentHref = String(editor.getAttributes('link').href ?? '');
    const currentTarget = String(
      editor.getAttributes('link').target ?? '_blank',
    );
    setLinkUrl(currentHref);
    setOpenInNewTab(currentTarget === '_blank');
    setLinkAnchor(anchor);
  };

  const closeLinkPopover = () => {
    setLinkAnchor(null);
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

  const imageAlign = String(editor.getAttributes('image').align ?? 'center');
  const imageWidth = String(editor.getAttributes('image').width ?? '100%');
  const codeLanguage = String(
    editor.getAttributes('codeBlock').language ?? 'plaintext',
  );
  const headingLevel = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph';

  return (
    <Stack
      direction="row"
      spacing={0.25}
      sx={{
        p: 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      <Tooltip title="실행 취소">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="다시 실행">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <TextField
        select
        size="small"
        value={headingLevel}
        onChange={(event) => {
          const value = event.target.value;

          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
            return;
          }

          const level = Number(value.replace('h', ''));
          editor
            .chain()
            .focus()
            .setHeading({ level: level as 1 | 2 | 3 })
            .run();
        }}
        sx={{ width: 120, mr: 0.25 }}
      >
        <MenuItem value="paragraph">본문</MenuItem>
        <MenuItem value="h1">제목 1</MenuItem>
        <MenuItem value="h2">제목 2</MenuItem>
        <MenuItem value="h3">제목 3</MenuItem>
      </TextField>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="굵게">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          sx={getActionSx(editor.isActive('bold'))}
        >
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="기울임">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          sx={getActionSx(editor.isActive('italic'))}
        >
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="밑줄">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          sx={getActionSx(editor.isActive('underline'))}
        >
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="취소선">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          sx={getActionSx(editor.isActive('strike'))}
        >
          <StrikethroughSIcon fontSize="small" />
        </IconButton>
      </Tooltip>

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
              editor.chain().focus().setColor(event.target.value).run();
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

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="글머리 기호">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={getActionSx(editor.isActive('bulletList'))}
        >
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="번호 목록">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={getActionSx(editor.isActive('orderedList'))}
        >
          <FormatListNumberedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="인용문">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          sx={getActionSx(editor.isActive('blockquote'))}
        >
          <FormatQuoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="할 일 목록">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          sx={getActionSx(editor.isActive('taskList'))}
        >
          <ChecklistIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="표 삽입">
        <IconButton
          size="small"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          sx={getActionSx(editor.isActive('table'))}
        >
          <TableChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="이미지 업로드">
        <IconButton size="small" onClick={onPickImages}>
          <ImageOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="코드 블록">
        <IconButton
          size="small"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleCodeBlock({ language: codeLanguage })
              .run()
          }
          sx={getActionSx(editor.isActive('codeBlock'))}
        >
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {editor.isActive('codeBlock') ? (
        <TextField
          select
          size="small"
          label="언어"
          value={codeLanguage}
          onChange={(event) => {
            editor
              .chain()
              .focus()
              .updateAttributes('codeBlock', {
                language: event.target.value,
              })
              .run();
          }}
          sx={{ minWidth: 140, ml: 0.75 }}
        >
          {SUPPORTED_CODE_LANGUAGES.map((language) => (
            <MenuItem key={language.value} value={language.value}>
              {language.label}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

      {editor.isActive('image') ? (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="왼쪽 정렬">
            <IconButton
              size="small"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { align: 'left' })
                  .run();
              }}
              sx={getActionSx(imageAlign === 'left')}
            >
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="가운데 정렬">
            <IconButton
              size="small"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { align: 'center' })
                  .run();
              }}
              sx={getActionSx(imageAlign === 'center')}
            >
              <FormatAlignCenterIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="오른쪽 정렬">
            <IconButton
              size="small"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { align: 'right' })
                  .run();
              }}
              sx={getActionSx(imageAlign === 'right')}
            >
              <FormatAlignRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <TextField
            select
            size="small"
            label="너비"
            value={imageWidth}
            onChange={(event) => {
              editor
                .chain()
                .focus()
                .updateAttributes('image', { width: event.target.value })
                .run();
            }}
            sx={{ width: 108, ml: 0.75 }}
          >
            <MenuItem value="30%">30%</MenuItem>
            <MenuItem value="50%">50%</MenuItem>
            <MenuItem value="70%">70%</MenuItem>
            <MenuItem value="100%">100%</MenuItem>
          </TextField>
        </>
      ) : null}

      <Tooltip title="구분선">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRuleIcon fontSize="small" />
        </IconButton>
      </Tooltip>

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
            <MenuItem
              sx={{ borderRadius: 1 }}
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
            </MenuItem>
            <MenuItem sx={{ borderRadius: 1 }} onClick={applyLink}>
              적용
            </MenuItem>
          </Stack>
        </Stack>
      </Popover>
    </Stack>
  );
}
