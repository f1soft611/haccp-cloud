import { describe, expect, it } from 'vitest';
import { toWorkCycleOptions } from '../shared/hooks/useWorkCycleOptions';

describe('toWorkCycleOptions', () => {
    it('WF_FORM_CYCLE 사용 코드만 정렬순으로 돌려준다', () => {
        expect(
            toWorkCycleOptions([
                { groupCode: 'WF_FORM_CYCLE', code: 'WEEK', codeName: '주', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
                { groupCode: 'WF_FORM_CYCLE', code: 'DAY', codeName: '일', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
                { groupCode: 'WF_FORM_CYCLE', code: 'EVENT', codeName: '발생시', parentCodeName: '', useAt: false, sortOrder: 5, codeDesc: '' },
                { groupCode: 'UNIT', code: 'KG', codeName: '킬로그램', parentCodeName: '', useAt: true, sortOrder: 1, codeDesc: '' },
            ]),
        ).toEqual([
            { code: 'DAY', name: '일' },
            { code: 'WEEK', name: '주' },
        ]);
    });
});