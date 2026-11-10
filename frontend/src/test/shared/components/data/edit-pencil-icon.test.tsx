import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';

describe('EditPencilIcon', () => {
  it('시안 SVG 파일을 장식용 이미지로 표시한다', () => {
    render(<EditPencilIcon />);

    const icon = screen.getByTestId('EditPencilIcon');
    expect(icon.tagName).toBe('IMG');
    expect(icon.getAttribute('src')).toContain('bticon_wri.svg');
    expect(icon.getAttribute('alt')).toBe('');
  });
});
