import { forwardRef, useImperativeHandle, useState } from 'react';

export type SlashCommandItem = {
  title: string;
  description: string;
  searchTerms: string[];
  command: () => void;
};

export type SlashCommandListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export const SlashCommandList = forwardRef<
  SlashCommandListHandle,
  SlashCommandListProps
>(function SlashCommandList(props, ref) {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="slash-command-menu">
        <div className="slash-command-empty">결과가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="slash-command-menu">
      {items.map((item, index) => {
        const isActive = index === selectedIndex;

        return (
          <button
            key={item.title}
            type="button"
            className={`slash-command-item${isActive ? ' is-active' : ''}`}
            onClick={() => selectItem(index)}
          >
            <span className="slash-command-item-title">{item.title}</span>
            <span className="slash-command-item-description">
              {item.description}
            </span>
          </button>
        );
      })}
    </div>
  );
});
