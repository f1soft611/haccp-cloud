import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../../../editor/utils/sanitizeHtml';

describe('sanitizeHtml', () => {
    it('블록 태그는 text-align 만 남긴다', () => {
        expect(sanitizeHtml('<p style="text-align:center;color:red">a</p>')).toBe(
            '<p style="text-align:center">a</p>',
        );
    });

    it('밑줄(u), 취소선(s) 태그를 유지한다', () => {
        expect(sanitizeHtml('<p><u>a</u><s>b</s></p>')).toBe(
            '<p><u>a</u><s>b</s></p>',
        );
    });

    it('script 와 on* 속성을 제거한다', () => {
        const result = sanitizeHtml(
            '<p onclick="alert(1)">a<script>alert(1)</script></p>',
        );
        expect(result).toBe('<p>a</p>');
    });

    it('preserveTextStyles 이면 span 의 글꼴, 크기, 색상을 남긴다', () => {
        expect(
            sanitizeHtml(
                '<span style="font-family:함초롬바탕;font-size:14pt;color:#0000ff">a</span>',
                { preserveTextStyles: true },
            ),
        ).toBe(
            '<span style="font-family:함초롬바탕;font-size:14pt;color:#0000ff">a</span>',
        );
    });
});