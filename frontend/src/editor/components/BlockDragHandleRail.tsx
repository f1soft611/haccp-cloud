import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

type BlockItem = {
  id: string;
  label: string;
  height: number;
};

type BlockDragHandleRailProps = {
  blocks: BlockItem[];
  onReorder: (activeId: string, overId: string) => void;
};

type SortableHandleProps = {
  id: string;
  label: string;
  height: number;
};

function SortableHandle(props: SortableHandleProps) {
  const { id, label, height } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={`editor-block-handle${isDragging ? ' is-dragging' : ''}`}
      aria-label={`${label} 블록 순서 이동`}
      title={`${label} 블록 이동`}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon fontSize="small" />
    </button>
  );
}

export function BlockDragHandleRail(props: BlockDragHandleRailProps) {
  const { blocks, onReorder } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    onReorder(String(active.id), String(over.id));
  };

  if (blocks.length === 0) {
    return <div className="editor-block-rail" aria-hidden="true" />;
  }

  return (
    <div className="editor-block-rail" aria-label="블록 순서 핸들">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <SortableHandle
              key={block.id}
              id={block.id}
              label={block.label}
              height={block.height}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
