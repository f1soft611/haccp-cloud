import { describe, expect, it } from 'vitest';
import {
    getCommonCodeName,
    toCommonCodeOptions,
} from '../../shared/hooks/useCommonCodeOptions';

const detail = (groupCode: string, code: string, codeName: string, useAt: boolean, sortOrder: number | null) => ({
    groupCode, code, codeName, parentCodeName: '', useAt, sortOrder, codeDesc: '',
});

describe('toCommonCodeOptions', () => {
    it('지정 그룹의 사용 코드만 정렬순으로 돌려준다', () => {
        expect(
            toCommonCodeOptions(
                [
                    detail('ITEM_UNIT', 'G', 'g', true, 20),
                    detail('ITEM_UNIT', 'KG', 'kg', true, 10),
                    detail('ITEM_UNIT', 'TON', '톤', false, 5),
                    detail('WF_FORM_CYCLE', 'DAY', '일', true, 1),
                    detail('ITEM_UNIT', 'EA', '개', true, null),
                ],
                'ITEM_UNIT',
            ),
        ).toEqual([
            { code: 'EA', name: '개' },
            { code: 'KG', name: 'kg' },
            { code: 'G', name: 'g' },
        ]);
    });
});

describe('getCommonCodeName', () => {
    const options = [{ code: 'KG', name: 'kg' }];

    it('매칭되면 이름을 돌려준다', () => {
        expect(getCommonCodeName(options, 'KG')).toBe('kg');
    });

    it('매칭되지 않으면 코드를 그대로 돌려준다', () => {
        expect(getCommonCodeName(options, 'OLD')).toBe('OLD');
    });

    it('빈 값이면 빈 문자열을 돌려준다', () => {
        expect(getCommonCodeName(options, '')).toBe('');
        expect(getCommonCodeName(options, null)).toBe('');
        expect(getCommonCodeName(options, undefined)).toBe('');
    });
});