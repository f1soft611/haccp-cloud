import { describe, expect, it } from 'vitest';
import { appTheme } from '../app/theme';

describe('light theme palette', () => {
  it('uses mint primary colors as the default light theme', () => {
    expect(appTheme.palette.mode).toBe('light');
    expect(appTheme.palette.primary.main).toBe('#0f766e');
    expect(appTheme.palette.secondary.main).toBe('#14b8a6');
    expect(appTheme.palette.background.default).toBe('#ecfdf5');
  });
});
