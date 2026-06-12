type MockModeOptions = {
  isDev: boolean;
  explicitMockFlag?: string;
  apiBaseUrl?: string;
};

export function shouldEnableMocking({
  isDev,
  explicitMockFlag,
  apiBaseUrl,
}: MockModeOptions): boolean {
  if (explicitMockFlag === 'true') {
    return true;
  }

  if (explicitMockFlag === 'false') {
    return false;
  }

  if (apiBaseUrl) {
    return false;
  }

  if (isDev) {
    return true;
  }

  // Fallback for deployed environments without backend wiring yet.
  return !apiBaseUrl;
}
