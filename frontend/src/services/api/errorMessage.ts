import { isAxiosError } from 'axios';

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          resultMessage?: string;
          message?: string;
        }
      | undefined;

    const serverMessage =
      payload?.resultMessage?.trim() || payload?.message?.trim();

    if (serverMessage) {
      return serverMessage;
    }

    if (error.message?.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
