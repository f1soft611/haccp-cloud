export type RadioOption = { code: string; name: string };

export type DocumentFieldRadioAttrs = {
    radioCode: string;
    radioName: string;
    value: string;
    valueName: string;
    options: string;
};

export const RADIO_PLACEHOLDER_TEXT = '라디오 종류를 선택하세요';
export const RADIO_EMPTY_KIND_TEXT = 'EDITOR_RADIO 상세코드가 없습니다';

function toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

// 노드 attrs 를 안전한 문자열 5개로 정규화
export function normalizeRadioAttrs(attrs: unknown): DocumentFieldRadioAttrs {
    const source = (attrs ?? {}) as Record<string, unknown>;
    return {
        radioCode: toText(source.radioCode),
        radioName: toText(source.radioName),
        value: toText(source.value),
        valueName: toText(source.valueName),
        options: toText(source.options),
    };
}

// 선택지 스냅샷을 data-options 에 넣을 JSON 문자열로 변환
export function serializeRadioOptions(options: RadioOption[]): string {
    return JSON.stringify(options.map(({ code, name }) => ({ code, name })));
}

// data-options JSON 을 선택지 배열로 복원, 형식이 틀리면 빈 배열
export function parseRadioOptions(text: string): RadioOption[] {
    if (!text) return [];
    try {
        const parsed: unknown = JSON.parse(text);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item): item is RadioOption =>
                typeof item?.code === 'string' && typeof item?.name === 'string',
        ).map(({ code, name }) => ({ code, name }));
    } catch {
        return [];
    }
}

// 읽기 화면과 HTML 에 쓰는 표시 텍스트: 선택된 값은 ◉, 나머지는 ○
export function formatRadioText(attrs: unknown): string {
    const { radioCode, radioName, value, options } = normalizeRadioAttrs(attrs);
    if (!radioCode) return RADIO_PLACEHOLDER_TEXT;
    const items = parseRadioOptions(options);
    if (items.length === 0) return radioName || RADIO_PLACEHOLDER_TEXT;
    return items.map((item) => `${item.code === value ? '◉' : '○'} ${item.name}`).join(' ');
}