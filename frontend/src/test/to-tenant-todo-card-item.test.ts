import { describe, expect, it } from 'vitest';
import { toTenantTodoCardItem } from '../pages/dashboard/tenant/hooks/useTenantDashboardData';
import type { HaccpBaseWorkItem } from '../services/documents/haccpBaseWorkService';

function buildRawItem(
    overrides: Partial<HaccpBaseWorkItem> = {},
): HaccpBaseWorkItem {
    return {
        id: '1',
        tenantCode: 'TENANT-A',
        categoryGroupId: '10',
        categoryCode: 'HA',
        categoryName: 'HACCP (HA)',
        categorySortOrder: 1,
        divisionCode: '001',
        divisionName: '점검 문서',
        cycle: '월',
        active: true,
        assigneeIds: [],
        referenceIds: [],
        assigneeMapped: true,
        hasDocument: true,
        ...overrides,
    };
}

describe('toTenantTodoCardItem', () => {
    it('falls back to division name then category name when title is missing', () => {
        const result = toTenantTodoCardItem(buildRawItem({ title: undefined }));
        expect(result.title).toBe('점검 문서');
    });

    it('routes to approval id when an approval id exists', () => {
        const result = toTenantTodoCardItem(buildRawItem({ approvalId: '9001' }));
        expect(result.routeIdType).toBe('approval');
        expect(result.routeId).toBe('9001');
    });

    it('routes to the work id when there is no approval id', () => {
        const result = toTenantTodoCardItem(buildRawItem());
        expect(result.routeIdType).toBe('work');
        expect(result.routeId).toBe('1');
    });
});