import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useQuery } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { getCommonCodes } from '../../services/basicinfo/commonCodeService';
import { COMMON_CODE_GROUP } from '../../shared/constants/commonCodeGroups';
import { toCommonCodeOptions } from '../../shared/hooks/useCommonCodeOptions';
import { COMBO_STYLE, getEditorItemOptions } from '../utils/documentFieldCombo';
import {
    formatRadioText,
    normalizeRadioAttrs,
    RADIO_EMPTY_KIND_TEXT,
    RADIO_PLACEHOLDER_TEXT,
    serializeRadioOptions,
} from '../utils/documentFieldRadio';

const SELECT_STYLE = { fontSize: 13, border: 'none', background: 'transparent', maxWidth: '100%', cursor: 'pointer' };
const LABEL_STYLE = { display: 'inline-flex', alignItems: 'center', gap: 2, marginRight: 8, cursor: 'pointer' };

// 편집 가능하면 종류 선택 후 라디오로 값 선택, 읽기 전용이면 스냅샷으로 ◉/○ 텍스트 표시
export function DocumentFieldRadioNodeView({ node, editor, updateAttributes }: NodeViewProps) {
    const attrs = normalizeRadioAttrs(node.attrs);
    const { radioCode, value, valueName } = attrs;
    const editable = editor.isEditable;
    // 묶음마다 고유한 name: 브라우저 라디오 동작용, 실제 값은 노드 attr
    const name = useId();
    // ponytail: 콤보, useCommonCodeOptions 와 같은 queryKey 를 공유해 공통코드 조회는 화면당 1회
    const { data, isLoading } = useQuery({
        queryKey: ['common-codes'],
        queryFn: getCommonCodes,
        retry: false,
        enabled: editable,
    });
    const groups = data?.groups ?? [];
    const details = data?.details ?? [];
    const kinds = useMemo(
        () => toCommonCodeOptions(data?.details ?? [], COMMON_CODE_GROUP.EDITOR_RADIO),
        [data],
    );
    const options = useMemo(
        () => getEditorItemOptions(data?.groups ?? [], data?.details ?? [], COMMON_CODE_GROUP.EDITOR_RADIO, radioCode),
        [data, radioCode],
    );

    if (!editable) {
        return (
            <NodeViewWrapper as="span" style={COMBO_STYLE}>
                {formatRadioText(attrs)}
            </NodeViewWrapper>
        );
    }

    if (!radioCode) {
        return (
            <NodeViewWrapper as="span" contentEditable={false} style={COMBO_STYLE}>
                <select
                    aria-label="라디오버튼 종류"
                    style={SELECT_STYLE}
                    value=""
                    disabled={isLoading || kinds.length === 0}
                    onChange={(event) => {
                        const kind = kinds.find((option) => option.code === event.target.value);
                        if (!kind) return;
                        updateAttributes({
                            radioCode: kind.code,
                            radioName: kind.name,
                            value: '',
                            valueName: '',
                            options: serializeRadioOptions(
                                getEditorItemOptions(groups, details, COMMON_CODE_GROUP.EDITOR_RADIO, kind.code),
                            ),
                        });
                    }}
                >
                    <option value="">
                        {!isLoading && kinds.length === 0 ? RADIO_EMPTY_KIND_TEXT : RADIO_PLACEHOLDER_TEXT}
                    </option>
                    {kinds.map((kind) => (
                        <option key={kind.code} value={kind.code}>{kind.name}</option>
                    ))}
                </select>
            </NodeViewWrapper>
        );
    }

    // 저장된 값이 이후 미사용 처리되어도 사라지지 않게 임시 선택지로 유지
    const missing = value !== '' && !options.some((option) => option.code === value);
    const shown = missing ? [...options, { code: value, name: `(미사용) ${valueName || value}` }] : options;

    // 같은 라디오를 다시 누르면 해제, 다른 것을 누르면 선택하고 선택지 스냅샷도 최신으로 갱신
    const select = (code: string) => {
        if (code === value) {
            updateAttributes({ value: '', valueName: '' });
            return;
        }
        const next = options.find((option) => option.code === code);
        if (!next) return;
        updateAttributes({ value: next.code, valueName: next.name, options: serializeRadioOptions(options) });
    };

    return (
        <NodeViewWrapper as="span" contentEditable={false} style={COMBO_STYLE}>
            {shown.map((option) => (
                <label key={option.code} style={LABEL_STYLE}>
                    <input
                        type="radio"
                        name={name}
                        checked={option.code === value}
                        readOnly
                        onClick={() => select(option.code)}
                    />
                    {option.name}
                </label>
            ))}
        </NodeViewWrapper>
    );
}