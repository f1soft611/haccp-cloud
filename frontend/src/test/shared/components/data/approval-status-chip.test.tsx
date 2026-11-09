import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApprovalStatusChip } from '../../../../shared/components/data/ApprovalStatusChip';

// 상태 칩의 문구와 배경, 글자색 확인용
function renderChip(label: string) {
  render(<ApprovalStatusChip label={label} />);
  return screen.getByText(label).closest('.MuiChip-root');
}

describe('ApprovalStatusChip', () => {
  it.each([
    ['결재진행중', '#D9F3FC', '#087DBD'],
    ['미작성', '#E9EFF1', '#879499'],
    ['승인', '#D8F4E9', '#079E63'],
    ['반려', '#FFDFF8', '#CF014E'],
  ])('%s 칩은 상태명만 지정된 색으로 표시한다', (label, backgroundColor, color) => {
    const chip = renderChip(label);

    expect(chip).toHaveTextContent(new RegExp(`^${label}$`));
    expect(chip).toHaveStyle({ backgroundColor, color });
  });

  it.each([
    ['작성', '#D8F4E9', '#079E63'],
    ['확인', '#D8F4E9', '#079E63'],
    ['대기', '#E9EFF1', '#879499'],
  ])('결재선 %s 칩은 지정된 상태 색을 사용한다', (label, backgroundColor, color) => {
    expect(renderChip(label)).toHaveStyle({ backgroundColor, color });
  });

  it.each([
    ['결재진행중', '13px'],
    ['미작성', '10px'],
    ['승인', '10px'],
    ['반려', '10px'],
  ])('%s 칩의 라벨 좌우 패딩은 %s 이다', (label, padding) => {
    render(<ApprovalStatusChip label={label} />);

    expect(screen.getByText(label)).toHaveStyle({
      paddingLeft: padding,
      paddingRight: padding,
    });
  });
});