import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CommonCodeSelect } from '../../shared/components/forms/CommonCodeSelect';
import {COMMON_CODE_GROUP} from "../../shared/constants/commonCodeGroups.ts";

function Harness({ initial = '', emptyLabel }: { initial?: string; emptyLabel?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <>
            <CommonCodeSelect
                groupCode={COMMON_CODE_GROUP.ITEM_UNIT}
                label="단위"
                value={value}
                onChange={setValue}
                emptyLabel={emptyLabel}
            />
            <span data-testid="value">{value}</span>
        </>
    );
}

function renderSelect(initial?: string, emptyLabel?: string) {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <Harness initial={initial} emptyLabel={emptyLabel} />
        </QueryClientProvider>,
    );
}

describe('CommonCodeSelect', () => {
    it('공통코드 이름을 옵션으로 보여주고 선택 시 코드를 넘긴다', async () => {
        renderSelect();
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '단위' }));
        const listbox = await screen.findByRole('listbox');
        expect(within(listbox).getByRole('option', { name: '선택 안 함' })).toBeInTheDocument();
        fireEvent.click(await within(listbox).findByRole('option', { name: 'kg' }));
        expect(screen.getByTestId('value')).toHaveTextContent('KG');
    });

    it('옵션에 없는 기존 코드도 그대로 표시한다', async () => {
        renderSelect('OLD');
        expect(await screen.findByRole('combobox', { name: '단위' })).toHaveTextContent('OLD');
    });

    it('emptyLabel로 빈 값 옵션 문구를 바꿀 수 있다', async () => {
        renderSelect('', '전체');
        fireEvent.mouseDown(screen.getByRole('combobox', { name: '단위' }));
        const listbox = await screen.findByRole('listbox');
        expect(within(listbox).getByRole('option', { name: '전체' })).toBeInTheDocument();
        expect(within(listbox).queryByRole('option', { name: '선택 안 함' })).not.toBeInTheDocument();
    });
});