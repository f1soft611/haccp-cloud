// 부서 그리드 전원 버튼: 배정된 인원이 있는 사용 중 부서는 미사용 전환 버튼을 막는다
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DepartmentTreeGrid } from '../../../../pages/organization/departments/components/DepartmentTreeGrid';
import type { DepartmentItem } from '../../../../services/organization/departmentsService';

function dept(overrides: Partial<DepartmentItem>): DepartmentItem {
  return {
    id: 'D-1',
    tenantCode: 'TENANT_A',
    name: '품질팀',
    parentId: null,
    parentName: null,
    sortOrder: 0,
    active: true,
    hasChildren: false,
    hasMembers: false,
    ...overrides,
  };
}

function renderGrid(item: DepartmentItem) {
  render(
    <DepartmentTreeGrid
      rows={[{ dept: item, children: [] }]}
      expandedIds={new Set()}
      pageIndex={0}
      pageSize={10}
      totalCount={1}
      onToggleExpand={vi.fn()}
      onEdit={vi.fn()}
      onToggleActive={vi.fn()}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
    />,
  );
}

describe('DepartmentTreeGrid toggle button', () => {
  it('disables deactivate when department has assigned users', () => {
    renderGrid(dept({ hasMembers: true }));

    expect(
      screen.getByRole('button', {
        name: '배정된 인원이 있어 미사용으로 변경할 수 없습니다.',
      }),
    ).toBeDisabled();
  });

  it('shows child-department reason first when both apply', () => {
    renderGrid(dept({ hasChildren: true, hasMembers: true }));

    expect(
      screen.getByRole('button', {
        name: '하위 부서가 있어 미사용으로 변경할 수 없습니다.',
      }),
    ).toBeDisabled();
  });

  it('allows activating an inactive department with assigned users', () => {
    renderGrid(dept({ active: false, hasMembers: true }));

    expect(
      screen.getByRole('button', { name: '사용으로 변경' }),
    ).toBeEnabled();
  });
});