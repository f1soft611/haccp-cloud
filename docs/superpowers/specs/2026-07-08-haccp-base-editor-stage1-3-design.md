# HACCP Base Editor Stage 1-3 Design and Handoff (2026-07-08)

## Goal

Build a reusable, extension-driven editor foundation in frontend for HaccpBaseEditorPage with:

- Stage 1: basic editor blocks
- Stage 2: top toolbar and bubble menu
- Stage 3: slash commands

## Implemented Scope

### Stage 1: Basic editor

- Replaced HaccpBaseEditorPage content area with Tiptap-based editor.
- Enabled base blocks and marks through extension composition:
  - paragraph
  - heading(1~3)
  - bold/italic/underline/strike
  - bullet list / ordered list
  - blockquote
  - code block
  - horizontal rule
- Added local storage persistence keyed by baseId.
- Existing document-created state is synchronized through setWorkDocumentState.

### Stage 2: Toolbar and Bubble menu

- Top toolbar implemented in separate menu component.
- Active state highlighting for formatting controls.
- Undo/Redo controls included.
- Bubble menu implemented for text selection with:
  - bold
  - italic
  - underline
  - link insert/edit (with open in new tab option)
  - text color picker

### Stage 3: Slash command

- Slash command extension added as independent module.
- Trigger: '/' in editor.
- Menu items implemented:
  - Heading 1/2
  - Table insertion
  - Image placeholder block
  - Code block
  - Divider
  - Quote
  - Todo list
- Suggestion popup backed by tippy.js.

## Code Structure (as requested)

- src/editor/components
- src/editor/extensions
- src/editor/menus
- src/editor/hooks
- src/editor/utils

## Added/Updated Files

### Added

- frontend/src/editor/components/NotionLikeEditor.tsx
- frontend/src/editor/components/SlashCommandList.tsx
- frontend/src/editor/components/editor.css
- frontend/src/editor/extensions/baseExtensions.ts
- frontend/src/editor/extensions/slashCommandExtension.ts
- frontend/src/editor/hooks/useEditorDocument.ts
- frontend/src/editor/menus/EditorToolbar.tsx
- frontend/src/editor/menus/EditorBubbleMenu.tsx
- frontend/src/editor/utils/documentStorage.ts

### Updated

- frontend/src/pages/documents/haccp-base/HaccpBaseEditorPage.tsx
- frontend/package.json (dependencies)

## Architecture Notes

- Extension-first design: each feature capability is encapsulated in extension or menu module.
- Page-level business state (baseId, target work validation, created state) remains in page component.
- Editor state lifecycle and persistence are isolated in hook + utility.
- UI menus are stateless and driven by editor instance.

## Deferred Items (for next steps)

### Stage 4: Table + context menu

- Status: In progress (implemented in current working tree)
- Implemented:
  - right-click context menu on table cells only
  - add/remove row
  - add/remove column
  - header row toggle
  - merge cells / split cell
  - cell selection action
  - copy/paste menu actions
- Added modules:
  - frontend/src/editor/menus/TableContextMenu.tsx
  - frontend/src/editor/hooks/useEditorContextMenu.ts
  - frontend/src/editor/extensions/tableActionsExtension.ts
- Integrated into NotionLikeEditor and wired with editor chain commands.

### Stage 5: Drag and drop

- Status: In progress (implemented in current working tree)
- Implemented:
  - left drag handle rail next to editor content
  - top-level block reordering with @dnd-kit sortable strategy
  - editor JSON content reorder sync via editor commands
- Added modules:
  - frontend/src/editor/hooks/useEditorBlockDnD.ts
  - frontend/src/editor/components/BlockDragHandleRail.tsx
- Integrated into NotionLikeEditor with new layout container.

### Stage 6: Image/link/code improvements

- Status: In progress (implemented in current working tree)
- Implemented:
  - image drag/drop upload and file-picker upload
  - image alignment(left/center/right) + width presets(30/50/70/100)
  - link editing popover UI (URL + open-in-new-tab + unlink)
  - code block lowlight extension with language selector
- Added modules:
  - frontend/src/editor/extensions/imageExtension.ts
  - frontend/src/editor/extensions/codeBlockExtension.ts
  - frontend/src/editor/hooks/useEditorImageUpload.ts
- Updated modules:
  - frontend/src/editor/extensions/baseExtensions.ts
  - frontend/src/editor/menus/EditorToolbar.tsx
  - frontend/src/editor/menus/EditorBubbleMenu.tsx
  - frontend/src/editor/components/NotionLikeEditor.tsx

### Stage 7: AI and collaboration foundation

- AI command gateway abstraction (provider-agnostic).
- Collaboration adapter boundary for Yjs awareness and presence.
- Keep plugin API stable for upcoming comments/versioning/mentions/math/mermaid/export/import.

## Known Constraints

- Repository-wide TypeScript strict mode is not enabled at tsconfig.app level yet.
- New editor module is written with explicit types and strict-friendly patterns.
- If strict mode is required globally, a separate migration task is recommended to avoid broad unrelated breakage.

## Verification Steps Used

- npm install for Tiptap and supporting packages.
- Existing relevant test suite to be rerun after integration.

## Next Task Entry Point

Start with Stage 4 by creating:

- src/editor/menus/TableContextMenu.tsx
- src/editor/hooks/useEditorContextMenu.ts
- src/editor/extensions/tableActionsExtension.ts
  and wire them into NotionLikeEditor.tsx.
