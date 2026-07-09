import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import BorderColorRounded from '@mui/icons-material/BorderColorRounded';
import CheckBoxRounded from '@mui/icons-material/CheckBoxRounded';
import FormatAlignCenterRounded from '@mui/icons-material/FormatAlignCenterRounded';
import FormatAlignLeftRounded from '@mui/icons-material/FormatAlignLeftRounded';
import FormatAlignRightRounded from '@mui/icons-material/FormatAlignRightRounded';
import FormatColorFillRounded from '@mui/icons-material/FormatColorFillRounded';
import FormatColorTextRounded from '@mui/icons-material/FormatColorTextRounded';
import FormatBoldRounded from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRounded from '@mui/icons-material/FormatItalicRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';
import TitleRounded from '@mui/icons-material/TitleRounded';
import { Button, Divider, MenuItem, Select, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Editor } from '@tiptap/react';
import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTableSelectionGuard } from '../../hooks/useTableSelectionGuard';
import { StandardColorMenu } from '../../menus/reset/StandardColorMenu';
import { TableBorderMenu } from '../../menus/reset/TableBorderMenu';
import { TableEditMenu } from '../../menus/reset/TableEditMenu';
import type {
  CellBorderStyle,
  CellVerticalAlign,
} from '../../utils/editorTableTypes';
import { ToolbarButton } from './controls/ToolbarButton';

type ResetEditorToolbarProps = {
  editor: Editor;
  disabled?: boolean;
};

export function ResetEditorToolbar(props: ResetEditorToolbarProps) {
  const { editor, disabled = false } = props;
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { rememberCurrentCell, ensureTableCellSelection, runCellCommand } =
    useTableSelectionGuard(editor);

  const [textColor, setTextColor] = useState('#0f172a');
  const [textHighlightColor, setTextHighlightColor] = useState('#fff59d');
  const [cellBackgroundColor, setCellBackgroundColor] = useState('#d8e6f5');
  const [cellBorderColor, setCellBorderColor] = useState('#7f7f7f');
  const [fontSize, setFontSize] = useState('15px');

  const [tableMenuAnchor, setTableMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [textColorMenuAnchor, setTextColorMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [textHighlightMenuAnchor, setTextHighlightMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [cellColorMenuAnchor, setCellColorMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [cellBorderMenuAnchor, setCellBorderMenuAnchor] =
    useState<HTMLElement | null>(null);
  const textSelectionBookmarkRef = useRef<ReturnType<
    Editor['state']['selection']['getBookmark']
  > | null>(null);

  useEffect(() => {
    const captureSelection = () => {
      textSelectionBookmarkRef.current = editor.state.selection.getBookmark();
    };

    editor.on('selectionUpdate', captureSelection);
    captureSelection();

    return () => {
      editor.off('selectionUpdate', captureSelection);
    };
  }, [editor]);

  const restoreTextSelection = () => {
    if (!textSelectionBookmarkRef.current) {
      return;
    }

    try {
      const { state, view } = editor;
      const restoredSelection = textSelectionBookmarkRef.current.resolve(
        state.doc,
      );
      view.dispatch(state.tr.setSelection(restoredSelection));
    } catch {
      // Ignore stale bookmark.
    }
  };

  const insertBaseTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 4, withHeaderRow: false })
      .run();
  };

  const applyCellBackground = (backgroundColor: string | null) => {
    runCellCommand(() =>
      editor
        .chain()
        .focus()
        .setCellAttribute('backgroundColor', backgroundColor)
        .run(),
    );
  };

  const applyCellVerticalAlign = (verticalAlign: CellVerticalAlign) => {
    runCellCommand(() =>
      editor
        .chain()
        .focus()
        .setCellAttribute('verticalAlign', verticalAlign)
        .run(),
    );
  };

  const applyCellBorder = (
    borderStyle: CellBorderStyle,
    borderWidth = '1px',
  ) => {
    if (borderStyle === 'none') {
      runCellCommand(() =>
        editor
          .chain()
          .focus()
          .setCellAttribute('borderStyle', 'none')
          .setCellAttribute('borderColor', null)
          .setCellAttribute('borderWidth', '0')
          .run(),
      );
      return;
    }

    runCellCommand(() =>
      editor
        .chain()
        .focus()
        .setCellAttribute('borderStyle', borderStyle)
        .setCellAttribute('borderColor', cellBorderColor)
        .setCellAttribute('borderWidth', borderWidth)
        .run(),
    );
  };

  const handleSetTextColor = (value: string) => {
    restoreTextSelection();
    setTextColor(value);
    editor.chain().focus().setColor(value).run();
  };

  const handleSetTextHighlightColor = (value: string) => {
    restoreTextSelection();
    setTextHighlightColor(value);
    editor.chain().focus().setHighlight({ color: value }).run();
  };

  const handleSetFontSize = (value: string) => {
    setFontSize(value);
    editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
  };

  const handleSetTextAlign = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().setTextAlign(align).run();
  };

  const handleSetCellBackgroundColor = (value: string) => {
    setCellBackgroundColor(value);
    applyCellBackground(value);
  };

  const handleResetTextColor = () => {
    setTextColor('#0f172a');
    editor.chain().focus().unsetColor().run();
  };

  const handleResetTextHighlightColor = () => {
    setTextHighlightColor('#fff59d');
    editor.chain().focus().unsetHighlight().run();
  };

  const handleResetCellBackgroundColor = () => {
    setCellBackgroundColor('#d8e6f5');
    applyCellBackground(null);
  };

  const handleSetCellBorderColor = (value: string) => {
    setCellBorderColor(value);
    runCellCommand(() =>
      editor
        .chain()
        .focus()
        .setCellAttribute('borderStyle', 'solid')
        .setCellAttribute('borderColor', value)
        .setCellAttribute('borderWidth', '1px')
        .run(),
    );
  };

  const handleResetCellBorder = () => {
    setCellBorderColor('#7f7f7f');
    applyCellBorder('none');
  };

  const runTableCommand = (
    command: () => void,
    requireCellSelection = true,
  ) => {
    if (requireCellSelection && !ensureTableCellSelection()) {
      setTableMenuAnchor(null);
      return;
    }

    command();
    setTableMenuAnchor(null);
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: isDarkMode ? 'grey.900' : 'grey.50',
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiSelect-select': {
            color: isDarkMode ? 'grey.100' : 'text.primary',
          },
          '& .MuiSvgIcon-root': {
            color: isDarkMode ? 'grey.100' : undefined,
          },
        }}
      >
        <Select
          size="small"
          value={fontSize}
          onChange={(event) => handleSetFontSize(event.target.value)}
          disabled={disabled}
          sx={{ minWidth: 92, '& .MuiSelect-select': { py: 0.5 } }}
        >
          <MenuItem value="12px">12px</MenuItem>
          <MenuItem value="14px">14px</MenuItem>
          <MenuItem value="15px">15px</MenuItem>
          <MenuItem value="16px">16px</MenuItem>
          <MenuItem value="18px">18px</MenuItem>
          <MenuItem value="20px">20px</MenuItem>
          <MenuItem value="24px">24px</MenuItem>
        </Select>
        <ToolbarButton
          title="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <FormatBoldRounded fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          title="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <FormatItalicRounded fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          title="제목 추가"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
        >
          <TitleRounded fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          title="체크리스트"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          disabled={disabled}
        >
          <CheckBoxRounded fontSize="small" />
        </ToolbarButton>
        <Divider orientation="vertical" flexItem />
        <ToolbarButton
          title="좌측 정렬"
          onClick={() => handleSetTextAlign('left')}
          disabled={disabled}
        >
          <FormatAlignLeftRounded fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          title="가운데 정렬"
          onClick={() => handleSetTextAlign('center')}
          disabled={disabled}
        >
          <FormatAlignCenterRounded fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          title="우측 정렬"
          onClick={() => handleSetTextAlign('right')}
          disabled={disabled}
        >
          <FormatAlignRightRounded fontSize="small" />
        </ToolbarButton>
        <Divider orientation="vertical" flexItem />
        {/* <ToolbarButton
          title="표 삽입"
          onClick={insertBaseTable}
          disabled={disabled}
        >
          <TableRowsRounded fontSize="small" />
        </ToolbarButton> */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<FormatColorTextRounded />}
          endIcon={<ArrowDropDownRounded />}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            rememberCurrentCell();
            setTextColorMenuAnchor(event.currentTarget);
          }}
          disabled={disabled}
          sx={{ whiteSpace: 'nowrap', borderBottom: `3px solid ${textColor}` }}
        >
          글자색
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FormatColorFillRounded />}
          endIcon={<ArrowDropDownRounded />}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            rememberCurrentCell();
            setTextHighlightMenuAnchor(event.currentTarget);
          }}
          disabled={disabled}
          sx={{
            whiteSpace: 'nowrap',
            borderBottom: `3px solid ${textHighlightColor}`,
          }}
        >
          배경색
        </Button>
        <Divider orientation="vertical" flexItem />
        <Button
          size="small"
          variant="outlined"
          startIcon={<TableRowsRounded />}
          endIcon={<ArrowDropDownRounded />}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            rememberCurrentCell();
            setTableMenuAnchor(event.currentTarget);
          }}
          disabled={disabled}
          sx={{ whiteSpace: 'nowrap' }}
        >
          표 편집
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FormatColorFillRounded />}
          endIcon={<ArrowDropDownRounded />}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            rememberCurrentCell();
            setCellColorMenuAnchor(event.currentTarget);
          }}
          disabled={disabled}
          sx={{
            whiteSpace: 'nowrap',
            borderBottom: `3px solid ${cellBackgroundColor}`,
          }}
        >
          셀 색상
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<BorderColorRounded />}
          endIcon={<ArrowDropDownRounded />}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            rememberCurrentCell();
            setCellBorderMenuAnchor(event.currentTarget);
          }}
          disabled={disabled}
          sx={{
            whiteSpace: 'nowrap',
            borderBottom: `3px solid ${cellBorderColor}`,
          }}
        >
          테두리
        </Button>
      </Stack>

      <StandardColorMenu
        title="글자 색상"
        anchorEl={textColorMenuAnchor}
        open={Boolean(textColorMenuAnchor)}
        selectedColor={textColor}
        resetLabel="자동"
        onClose={() => setTextColorMenuAnchor(null)}
        onSelectColor={handleSetTextColor}
        onReset={handleResetTextColor}
      />

      <StandardColorMenu
        title="셀 배경 색상"
        anchorEl={cellColorMenuAnchor}
        open={Boolean(cellColorMenuAnchor)}
        selectedColor={cellBackgroundColor}
        resetLabel="셀 배경 제거"
        onClose={() => setCellColorMenuAnchor(null)}
        onSelectColor={handleSetCellBackgroundColor}
        onReset={handleResetCellBackgroundColor}
      />

      <StandardColorMenu
        title="글자 배경색"
        anchorEl={textHighlightMenuAnchor}
        open={Boolean(textHighlightMenuAnchor)}
        selectedColor={textHighlightColor}
        resetLabel="배경 제거"
        onClose={() => setTextHighlightMenuAnchor(null)}
        onSelectColor={handleSetTextHighlightColor}
        onReset={handleResetTextHighlightColor}
      />

      <TableBorderMenu
        anchorEl={cellBorderMenuAnchor}
        open={Boolean(cellBorderMenuAnchor)}
        selectedColor={cellBorderColor}
        onClose={() => setCellBorderMenuAnchor(null)}
        onApplyBorder={applyCellBorder}
        onSelectColor={handleSetCellBorderColor}
        onReset={handleResetCellBorder}
      />

      <TableEditMenu
        anchorEl={tableMenuAnchor}
        open={Boolean(tableMenuAnchor)}
        onClose={() => setTableMenuAnchor(null)}
        onInsertTable={insertBaseTable}
        onRunTableCommand={runTableCommand}
        onApplyCellVerticalAlign={applyCellVerticalAlign}
        onAddRowAfter={() => {
          editor.chain().focus().addRowAfter().run();
        }}
        onAddColumnAfter={() => {
          editor.chain().focus().addColumnAfter().run();
        }}
        onDeleteRow={() => {
          editor.chain().focus().deleteRow().run();
        }}
        onDeleteColumn={() => {
          editor.chain().focus().deleteColumn().run();
        }}
        onMergeCells={() => {
          editor.chain().focus().mergeCells().run();
        }}
        onSplitCell={() => {
          editor.chain().focus().splitCell().run();
        }}
      />
    </>
  );
}
