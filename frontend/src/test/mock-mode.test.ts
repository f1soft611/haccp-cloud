import { describe, expect, it } from 'vitest';
import { shouldEnableMocking } from '../app/runtime/mockMode';

describe('shouldEnableMocking', () => {
  it('enables mocking in development', () => {
    expect(
      shouldEnableMocking({
        isDev: true,
        explicitMockFlag: undefined,
        apiBaseUrl: undefined,
      }),
    ).toBe(true);
  });

  it('enables mocking when explicit flag is true', () => {
    expect(
      shouldEnableMocking({
        isDev: false,
        explicitMockFlag: 'true',
        apiBaseUrl: 'https://api.example.com',
      }),
    ).toBe(true);
  });

  it('enables mocking in production when api base url is missing', () => {
    expect(
      shouldEnableMocking({
        isDev: false,
        explicitMockFlag: undefined,
        apiBaseUrl: undefined,
      }),
    ).toBe(true);
  });

  it('disables mocking in production when api base url exists and flag is not true', () => {
    expect(
      shouldEnableMocking({
        isDev: false,
        explicitMockFlag: 'false',
        apiBaseUrl: 'https://api.example.com',
      }),
    ).toBe(false);
  });
});
