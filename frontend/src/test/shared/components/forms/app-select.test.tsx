import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { ThemeProvider } from '@mui/material/styles';
import { appTheme } from '../../../../app/theme';

const OPTIONS = [
    { value: 'Y', label: '사용' },
    { value: 'N', label: '미사용' },
];

function Harness({
    initial = 'Y',
    emptyLabel,
    options = OPTIONS,
    label = '사용여부',
}: {
    initial?: string;
    emptyLabel?: string;
    options?: { value: string; label: string }[];
    label?: string;
}) {
    const [value, setValue] = useState(initial);
    return (
        <>
            <AppSelect
                label={label}
                value={value}
                onChange={setValue}
                options={options}
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

    it('펼친 목록에 포커스 테두리와 같은 primary 색 1px 보더를 준다', async () => {
        render(
            <ThemeProvider theme={appTheme}>
                <Harness />
            </ThemeProvider>,
        );
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용여부' }));
        const listbox = await screen.findByRole('listbox');
        const paper = listbox.closest('.MuiPaper-root');

        expect(paper).not.toBeNull();
        expect(paper).toHaveStyle({
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'rgb(42, 91, 184)',
        });
    });

    it('emptyLabel 이 전체이고 빈 값이면 칸을 비우고 라벨을 칸 안에 "라벨 (전체)" 로 보여준다', () => {
        render(<Harness initial="" emptyLabel="전체" />);
        const label = screen.getByText('사용여부 (전체)');
        expect(label).not.toHaveClass('MuiInputLabel-shrink');

        // 접근성 이름은 원래 라벨 그대로, 값 '전체'는 화면에서만 숨김
        const combobox = screen.getByRole('combobox', { name: '사용여부' });
        const hiddenValue = within(combobox).getByText('전체');
        expect(hiddenValue).toHaveStyle({ position: 'absolute', width: '1px', height: '1px' });
    });

    it('선택된 옵션 문구가 전체이면 값과 상관없이 같은 표시를 한다', () => {
        render(
            <Harness
                initial="all"
                options={[
                    { value: 'all', label: '전체' },
                    { value: 'Y', label: '사용' },
                ]}
            />,
        );
        expect(screen.getByText('사용여부 (전체)')).not.toHaveClass('MuiInputLabel-shrink');
    });

    it('전체가 아닌 값을 고르면 라벨이 원래대로 뜨고 선택값을 보여준다', async () => {
        render(<Harness initial="" emptyLabel="전체" />);
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '사용여부' }));
        const listbox = await screen.findByRole('listbox');
        fireEvent.click(within(listbox).getByRole('option', { name: '사용' }));

        expect(screen.queryByText('사용여부 (전체)')).not.toBeInTheDocument();
        expect(screen.getByText('사용여부')).toHaveClass('MuiInputLabel-shrink');
        expect(screen.getByRole('combobox', { name: '사용여부' })).toHaveTextContent('사용');
    });

    it('문구가 정확히 전체가 아니면(예: 전체(수시제외)) 적용하지 않는다', () => {
        render(
            <Harness
                initial="all"
                label="주기"
                options={[{ value: 'all', label: '전체(수시제외)' }]}
            />,
        );
        expect(screen.queryByText('주기 (전체)')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '주기' })).toHaveTextContent('전체(수시제외)');
    });
});