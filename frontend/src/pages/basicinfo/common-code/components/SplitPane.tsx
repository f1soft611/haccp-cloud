import { Box } from '@mui/material';
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

const MIN_RATIO = 25;
const MAX_RATIO = 75;
const clampRatio = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));

export function SplitPane({ left, right, height = 640 }: { left: ReactNode; right: ReactNode; height?: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    // ponytail: 새로고침 시 40%로 복귀. 폭 기억이 필요하면 localStorage 저장 추가
    const [ratio, setRatio] = useState(40);

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const rect = container.getBoundingClientRect();
        setRatio(clampRatio(((event.clientX - rect.left) / rect.width) * 100));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') setRatio((prev) => clampRatio(prev - 5));
        if (event.key === 'ArrowRight') setRatio((prev) => clampRatio(prev + 5));
    };

    return (
        <Box ref={containerRef} sx={{ display: 'flex', height }}>
            <Box sx={{ width: `${ratio}%`, minWidth: 0 }}>{left}</Box>
            <Box
                role="separator"
                aria-orientation="vertical"
                aria-label="좌우 폭 조절"
                aria-valuenow={Math.round(ratio)}
                aria-valuemin={MIN_RATIO}
                aria-valuemax={MAX_RATIO}
                tabIndex={0}
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={handlePointerMove}
                onKeyDown={handleKeyDown}
                sx={{
                    width: 12,
                    flexShrink: 0,
                    cursor: 'col-resize',
                    touchAction: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::after': { content: '""', width: 2, height: 32, borderRadius: 1, bgcolor: 'divider' },
                    '&:hover::after, &:focus-visible::after': { bgcolor: 'primary.main' },
                }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>{right}</Box>
        </Box>
    );
}