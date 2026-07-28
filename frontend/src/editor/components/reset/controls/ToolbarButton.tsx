import { IconButton, Tooltip } from '@mui/material';
import type { MouseEvent, ReactNode } from 'react';

type ToolbarButtonProps = {
  title: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export function ToolbarButton(props: ToolbarButtonProps) {
  const { title, onClick, children, disabled = false } = props;

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onMouseDown={handleMouseDown}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
