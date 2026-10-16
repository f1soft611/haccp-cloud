import type { CSSProperties } from 'react';

export type DocumentFieldAttendee = {
    userId: string;
    name: string;
    signatureImage?: string;
};

export const ATTENDEES_PLACEHOLDER_TEXT =
    '문서필드 참석자 · 클릭하여 참석자를 선택하세요.';

const BORDER = '1px solid #334155';

// 미리보기(dangerouslySetInnerHTML)·인쇄에도 그대로 보이도록 인라인 스타일만 사용한다.
export const ATTENDEES_STYLES = {
    placeholder: {
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '40px',
        padding: '0.5rem 0.75rem',
        border: '1px dashed #94a3b8',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        color: '#475569',
        fontSize: '13px',
        maxWidth: '100%',
    },
    list: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
    },
    card: {
        width: '88px',
        border: BORDER,
        boxSizing: 'border-box',
        textAlign: 'center',
        fontSize: '13px',
        breakInside: 'avoid',
    },
    name: {
        padding: '4px 2px',
        borderBottom: BORDER,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    sign: {
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
} satisfies Record<string, CSSProperties>;

export function toStyleText(style: CSSProperties): string {
    return Object.entries(style)
    .map(
        ([key, value]) =>
            `${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}: ${value}`,
    )
    .join('; ');
}

function parseJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return [];
    }
}

export function normalizeAttendees(value: unknown): DocumentFieldAttendee[] {
    const list = typeof value === 'string' ? parseJson(value) : value;
    if (!Array.isArray(list)) {
        return [];
    }

    return list.flatMap((item) => {
        const userId = String(item?.userId ?? '').trim();
        if (!userId) {
            return [];
        }

        const name = String(item?.name ?? '').trim() || userId;
        const signatureImage = String(item?.signatureImage ?? '').trim();

        return [signatureImage ? { userId, name, signatureImage } : { userId, name }];
    });
}