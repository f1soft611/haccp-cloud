import { isAxiosError } from 'axios';

function readStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  const candidate = error as {
    response?: { data?: unknown };
    message?: unknown;
  };

  const payload = candidate?.response?.data;
  if (payload && typeof payload === 'object') {
    const structuredPayload = payload as {
      resultMessage?: unknown;
      message?: unknown;
      errorMessage?: unknown;
    };

    const serverMessage =
      readStringValue(structuredPayload.resultMessage) ||
      readStringValue(structuredPayload.message) ||
      readStringValue(structuredPayload.errorMessage);

    if (serverMessage) {
      return serverMessage;
    }
  } else if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (readStringValue(candidate?.message)) {
    return readStringValue(candidate?.message);
  }

  if (isAxiosError(error) && error.message?.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
