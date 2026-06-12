import { describe, expect, it } from 'vitest';
import { shouldEnableMocking } from '../app/runtime/mockMode';

describe('shouldEnableMocking', () => {
  it('enables mocking in development when no api base url is configured', () => {
    expect(
      shouldEnableMocking({
        isDev: true,
        explicitMockFlag: undefined,
        apiBaseUrl: undefined,
      }),
    ).toBe(true);
  });

  it('disables mocking in development when api base url exists', () => {
    expect(
      shouldEnableMocking({
        isDev: true,
        explicitMockFlag: undefined,
        apiBaseUrl: 'http://localhost:8080',
      }),
    ).toBe(false);
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

  it('disables mocking when explicit flag is false', () => {
    expect(
      shouldEnableMocking({
        isDev: true,
        explicitMockFlag: 'false',
        apiBaseUrl: undefined,
      }),
    ).toBe(false);
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
