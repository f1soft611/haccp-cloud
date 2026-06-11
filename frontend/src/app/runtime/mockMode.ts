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
  if (isDev) {
    return true;
  }

  if (explicitMockFlag === 'true') {
    return true;
  }

  // Fallback for deployed environments without backend wiring yet.
  return !apiBaseUrl;
}
