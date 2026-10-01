import { describe, expect, it } from 'vitest';
import { resolveDraftRoute } from '../shared/utils/workDraftRoute';

describe('resolveDraftRoute', () => {
    it('returns null when there is no usable id', () => {
        expect(resolveDraftRoute({ id: '' })).toBeNull();
    });

    it('routes to the work id when not written in the current cycle', () => {
        expect(
            resolveDraftRoute({
                id: '101',
                approvalId: '9001',
                writtenInCycle: false,
            }),
        ).toBe('/approvals/draft/101?idType=work');
    });

    it('routes to the approval id when written in the current cycle and an approval id exists', () => {
        expect(
            resolveDraftRoute({
                id: '101',
                approvalId: '9001',
                writtenInCycle: true,
            }),
        ).toBe('/approvals/draft/9001?idType=approval');
    });

    it('falls back to the work id when written in cycle but no approval id exists', () => {
        expect(resolveDraftRoute({ id: '101', writtenInCycle: true })).toBe(
            '/approvals/draft/101?idType=work',
        );
    });
});