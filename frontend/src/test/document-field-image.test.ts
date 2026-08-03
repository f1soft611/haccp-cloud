import { describe, expect, it } from 'vitest';
import {
  createDocumentFieldImageNode,
  createDefaultDocumentFieldImageAttributes,
} from '../editor/extensions/documentFieldImageExtension';
import {
  normalizeImageWidth,
  resolveImageWidthFromDelta,
} from '../editor/extensions/imageExtension';

describe('documentFieldImageExtension', () => {
  it('creates a placeholder node with default attributes', () => {
    const node = createDocumentFieldImageNode();

    expect(node).toEqual({
      type: 'documentFieldImage',
      attrs: createDefaultDocumentFieldImageAttributes(),
    });
  });

  it('preserves provided image attributes', () => {
    const node = createDocumentFieldImageNode({
      src: 'https://example.com/image.png',
      alt: '문서필드 이미지',
      width: '50%',
      align: 'left',
    });

    expect(node.attrs).toMatchObject({
      src: 'https://example.com/image.png',
      alt: '문서필드 이미지',
      width: '50%',
      align: 'left',
    });
  });

  it('normalizes resize widths for the image control', () => {
    expect(normalizeImageWidth('75%')).toBe('75%');
    expect(normalizeImageWidth('120%')).toBe('100%');
    expect(normalizeImageWidth('abc')).toBe('100%');
  });

  it('computes width from drag deltas', () => {
    expect(resolveImageWidthFromDelta('80%', 40, 400)).toBe('90%');
    expect(resolveImageWidthFromDelta('20%', -400, 400)).toBe('20%');
  });
});
