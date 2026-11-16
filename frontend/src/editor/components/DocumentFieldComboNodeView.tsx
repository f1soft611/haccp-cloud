import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getCommonCodes } from '../../services/basicinfo/commonCodeService';
import { toCommonCodeOptions } from '../../shared/hooks/useCommonCodeOptions';
import {
    COMBO_NO_GROUP_TEXT,
    COMBO_PLACEHOLDER_TEXT,
    COMBO_STYLE,
    getComboGroups,
    normalizeComboAttrs,
} from '../utils/documentFieldCombo';

const SELECT_STYLE = { fontSize: 13, border: 'none', background: 'transparent' };

// 편집 가능하면 그룹 선택 후 값 선택, 읽기 전용이면 선택된 코드명만 표시
export function DocumentFieldComboNodeView({ node, editor, updateAttributes }: NodeViewProps) {
    const { groupCode, value, valueName } = normalizeComboAttrs(node.attrs);
    const editable = editor.isEditable;
    // ponytail: useCommonCodeOptions 와 같은 queryKey 를 공유해 공통코드 조회는 화면당 1회
    const { data, isLoading } = useQuery({
        queryKey: ['common-codes'],
        queryFn: getCommonCodes,
        retry: false,
        enabled: editable,
    });
    const groups = useMemo(() => getComboGroups(data?.groups ?? []), [data]);
    const options = useMemo(() => toCommonCodeOptions(data?.details ?? [], groupCode), [data, groupCode]);

    if (!editable) {
        return (
            <NodeViewWrapper as="span" style={COMBO_STYLE}>
                {valueName || COMBO_PLACEHOLDER_TEXT}
            </NodeViewWrapper>
        );
    }

    if (!groupCode) {
        return (
            <NodeViewWrapper as="span" contentEditable={false} style={COMBO_STYLE}>
                <select
                    aria-label="콤보박스 코드그룹"
                    style={SELECT_STYLE}
                    value=""
                    disabled={isLoading || groups.length === 0}
                    onChange={(event) => updateAttributes({ groupCode: event.target.value, value: '', valueName: '' })}
                >
                    <option value="">
                        {!isLoading && groups.length === 0 ? COMBO_NO_GROUP_TEXT : COMBO_PLACEHOLDER_TEXT}
                    </option>
                    {groups.map((group) => (
                        <option key={group.code} value={group.code}>{group.name}</option>
                    ))}
                </select>
            </NodeViewWrapper>
        );
    }

    // 저장된 값이 이후 미사용 처리되어도 select 에서 사라지지 않게 임시 옵션으로 유지
    const missing = value !== '' && !options.some((option) => option.code === value);

    return (
        <NodeViewWrapper as="span" contentEditable={false} style={COMBO_STYLE}>
            <select
                aria-label="콤보박스 값"
                style={SELECT_STYLE}
                value={value}
                onChange={(event) => {
                    const next = options.find((option) => option.code === event.target.value);
                    updateAttributes({ value: next?.code ?? '', valueName: next?.name ?? '' });
                }}
            >
                <option value="">선택</option>
                {missing ? <option value={value}>(미사용) {valueName || value}</option> : null}
                {options.map((option) => (
                    <option key={option.code} value={option.code}>{option.name}</option>
                ))}
            </select>
        </NodeViewWrapper>
    );
}