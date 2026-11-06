import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';

const OPTIONS = [
    { value: 'Y', label: '사용' },
    { value: 'N', label: '미사용' },
];

function Harness({ initial = 'Y', emptyLabel }: { initial?: string; emptyLabel?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <>
            <AppSelect
                label="사용여부"
                value={value}
                onChange={setValue}
                options={OPTIONS}
                emptyLabel={emptyLabel}
            />
            <span data-testid="value">{value}</span>
        </>
    );
}

describe('AppSelect', () => {
    it('옵션을 보여주고 선택한 값을 onChange 로 넘긴다', async () => {
        render(<Harness />);
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용여부' }));
        const listbox = await screen.findByRole('listbox');
        fireEvent.click(within(listbox).getByRole('option', { name: '미사용' }));
        expect(screen.getByTestId('value')).toHaveTextContent('N');
    });

    it('emptyLabel 을 넘기면 빈 값일 때 칸에 문구를 표시하고 빈 값을 고를 수 있다', async () => {
        render(<Harness initial="" emptyLabel="전체" />);
        const combobox = screen.getByRole('combobox', { name: '사용여부' });
        expect(combobox).toHaveTextContent('전체');

        fireEvent.mouseDown(combobox);
        const listbox = await screen.findByRole('listbox');
        expect(within(listbox).getByRole('option', { name: '전체' })).toBeInTheDocument();
    });

    it('emptyLabel 이 없으면 빈 항목을 추가하지 않는다', async () => {
        render(<Harness />);
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용여부' }));
        const listbox = await screen.findByRole('listbox');
        expect(within(listbox).getAllByRole('option')).toHaveLength(2);
    });

    it('helperText 와 disabled 를 전달한다', () => {
        render(
            <AppSelect
                label="플랜"
                value=""
                onChange={() => undefined}
                options={[]}
                helperText="사용 가능한 플랜이 없습니다."
                disabled
            />,
        );
        expect(screen.getByRole('combobox', { name: '플랜' })).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText('사용 가능한 플랜이 없습니다.')).toBeInTheDocument();
    });

    it('라벨이 없을 때 selectProps 로 접근성 이름을 줄 수 있다', () => {
        render(
            <AppSelect
                value="Y"
                onChange={() => undefined}
                options={OPTIONS}
                selectProps={{ SelectDisplayProps: { 'aria-label': '활성 상태' } }}
            />,
        );
        expect(screen.getByRole('combobox', { name: '활성 상태' })).toHaveTextContent('사용');
    });
});