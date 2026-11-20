import { describe, expect, it } from 'vitest';
import {
    formatRadioText,
    normalizeRadioAttrs,
    parseRadioOptions,
    RADIO_PLACEHOLDER_TEXT,
    serializeRadioOptions,
} from '../../editor/utils/documentFieldRadio';

const yesNo = serializeRadioOptions([
    { code: 'Y', name: '예' },
    { code: 'N', name: '아니오' },
]);

describe('normalizeRadioAttrs', () => {
    it('문자열이 아닌 값은 빈 문자열로 바꾸고 공백을 제거한다', () => {
        expect(
            normalizeRadioAttrs({ radioCode: ' YES_NO ', radioName: '예아니오', value: 'Y', valueName: null, options: 1 }),
        ).toEqual({ radioCode: 'YES_NO', radioName: '예아니오', value: 'Y', valueName: '', options: '' });
        expect(normalizeRadioAttrs(undefined)).toEqual({
            radioCode: '',
            radioName: '',
            value: '',
            valueName: '',
            options: '',
        });
    });
});

describe('parseRadioOptions', () => {
    it('직렬화한 선택지를 그대로 복원한다', () => {
        expect(parseRadioOptions(yesNo)).toEqual([
            { code: 'Y', name: '예' },
            { code: 'N', name: '아니오' },
        ]);
    });

    it('빈 문자열, 깨진 JSON, 배열이 아닌 값은 빈 배열', () => {
        expect(parseRadioOptions('')).toEqual([]);
        expect(parseRadioOptions('{broken')).toEqual([]);
        expect(parseRadioOptions('{"code":"Y"}')).toEqual([]);
    });

    it('code, name 이 문자열이 아닌 항목은 버린다', () => {
        expect(parseRadioOptions('[{"code":"Y","name":"예"},{"code":1},null]')).toEqual([
            { code: 'Y', name: '예' },
        ]);
    });
});

describe('formatRadioText', () => {
    it('종류가 없으면 플레이스홀더', () => {
        expect(formatRadioText({})).toBe(RADIO_PLACEHOLDER_TEXT);
    });

    it('선택된 값은 ◉, 나머지는 ○ 로 표시한다', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', value: 'N', options: yesNo })).toBe('○ 예 ◉ 아니오');
    });

    it('아무것도 안 골랐으면 모두 ○', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', value: '', options: yesNo })).toBe('○ 예 ○ 아니오');
    });

    it('스냅샷이 비어 있으면 종류명을 보여준다', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', radioName: '예아니오', options: '' })).toBe('예아니오');
    });
});