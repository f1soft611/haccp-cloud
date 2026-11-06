import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';

function Harness() {
    const [value, setValue] = useState('');
    return (
        <>
            <AppTextField label="품명" value={value} onChange={setValue} />
            <span data-testid="value">{value}</span>
        </>
    );
}

describe('AppTextField', () => {
    it('입력한 문자열을 onChange 로 넘긴다', () => {
        render(<Harness />);
        fireEvent.change(screen.getByLabelText('품명'), { target: { value: '사과' } });
        expect(screen.getByTestId('value')).toHaveTextContent('사과');
    });

    it('type 이 number 여도 onChange 는 문자열을 넘긴다', () => {
        const onChange = vi.fn();
        render(<AppTextField label="수량" type="number" value="" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText('수량'), { target: { value: '3' } });
        expect(onChange).toHaveBeenCalledWith('3');
    });

    it('onChange 없이 읽기 전용 칸으로 쓸 수 있다', () => {
        render(<AppTextField label="코드" value="A01" slotProps={{ input: { readOnly: true } }} />);
        expect(screen.getByLabelText('코드')).toHaveAttribute('readonly');
        expect(screen.getByLabelText('코드')).toHaveValue('A01');
    });

    it('helperText, error, disabled 를 전달한다', () => {
        render(<AppTextField label="이름" value="" helperText="필수 입력입니다." error disabled />);
        const input = screen.getByLabelText('이름');
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('필수 입력입니다.')).toBeInTheDocument();
    });

    it('slotProps 의 htmlInput 속성을 input 에 전달한다', () => {
        render(<AppTextField label="코드" value="" slotProps={{ htmlInput: { maxLength: 20 } }} />);
        expect(screen.getByLabelText('코드')).toHaveAttribute('maxlength', '20');
    });
});