import { describe, expect, it } from 'vitest';
import {
    getCommonCodes,
    saveCommonCodeGroups,
    saveCommonCodeItems,
} from '../../services/basicinfo/commonCodeService';

describe('commonCodeService', () => {
    it('그룹과 상세 목록을 조회한다', async () => {
        const data = await getCommonCodes();
        expect(data.groups.map((group) => group.groupCode)).toEqual(['WF_FORM_CYCLE', 'UNIT']);
        expect(
            data.details.filter((detail) => detail.groupCode === 'WF_FORM_CYCLE').map((detail) => detail.code),
        ).toEqual(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'HALF', 'YEAR', 'ANYTIME']);
    });

    it('상세 저장은 기존 코드는 갱신하고 신규 코드는 추가한다', async () => {
        await saveCommonCodeItems([
            { groupCode: 'UNIT', code: 'KG', codeName: '킬로', parentCodeName: '', useAt: false, sortOrder: 10, codeDesc: '' },
            { groupCode: 'UNIT', code: 'T', codeName: '톤', parentCodeName: '', useAt: true, sortOrder: 60, codeDesc: '' },
        ]);
        const units = (await getCommonCodes()).details.filter((detail) => detail.groupCode === 'UNIT');
        expect(units.find((detail) => detail.code === 'KG')).toMatchObject({ codeName: '킬로', useAt: false });
        expect(units.map((detail) => detail.code)).toContain('T');
    });

    it('그룹 저장은 보낸 그룹만 남긴다', async () => {
        await saveCommonCodeGroups([{ groupCode: 'UNIT', groupName: '단위', groupDesc: '' }]);
        expect((await getCommonCodes()).groups.map((group) => group.groupCode)).toEqual(['UNIT']);
    });
});