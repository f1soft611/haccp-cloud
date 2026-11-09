import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppDateField } from '../../../../shared/components/forms/AppDateField';

describe('AppDateField', () => {
    it('날짜 입력칸을 만들고 선택한 YYYY-MM-DD 값을 onChange 로 넘긴다', () => {
        const onChange = vi.fn();
        render(<AppDateField label="입사일" value="" onChange={onChange} />);
        const input = screen.getByLabelText('입사일');
        expect(input).toHaveAttribute('type', 'date');

        fireEvent.change(input, { target: { value: '2026-11-06' } });
        expect(onChange).toHaveBeenCalledWith('2026-11-06');
    });

    it('값이 비어 있어도 라벨을 축소 상태로 표시한다', () => {
        const { container } = render(<AppDateField label="입사일" value="" onChange={() => undefined} />);
        expect(container.querySelector('label')).toHaveAttribute('data-shrink', 'true');
    });

    it('min, max 를 input 속성으로 전달한다', () => {
        render(
            <AppDateField
                label="등록일"
                value=""
                onChange={() => undefined}
                min="1900-01-01"
                max="2026-11-06"
            />,
        );
        const input = screen.getByLabelText('등록일');
        expect(input).toHaveAttribute('min', '1900-01-01');
        expect(input).toHaveAttribute('max', '2026-11-06');
    });

    it('helperText, error, disabled 를 전달한다', () => {
        render(
            <AppDateField
                label="퇴사일"
                value=""
                onChange={() => undefined}
                helperText="퇴사일은 입사일 이후여야 합니다."
                error
                disabled
            />,
        );
        const input = screen.getByLabelText('퇴사일');
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('퇴사일은 입사일 이후여야 합니다.')).toBeInTheDocument();
    });
});