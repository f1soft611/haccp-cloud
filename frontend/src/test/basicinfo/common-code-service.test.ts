import { describe, expect, it } from 'vitest';
import { getCommonCodes } from '../../services/basicinfo/commonCodeService';

describe('commonCodeService', () => {
    it('그룹과 상세 목록을 조회한다', async () => {
        const data = await getCommonCodes();
        expect(data.groups.map((group) => group.groupCode)).toEqual(['OCCUR_CYCLE', 'UNIT']);
        expect(
            data.details.filter((detail) => detail.groupCode === 'OCCUR_CYCLE').map((detail) => detail.code),
        ).toEqual(['DAY', 'WEEK', 'MONTH', 'EVENT']);
    });
});