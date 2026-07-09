export type HaccpWorkDocumentState = {
  created: boolean;
  updatedAt: string;
};

type HaccpWorkUiState = {
  documents: Record<string, HaccpWorkDocumentState>;
};

const STORAGE_KEY = 'haccp-base-work-ui-state';

const DEFAULT_STATE: HaccpWorkUiState = {
  documents: {},
};

function readState(): HaccpWorkUiState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<HaccpWorkUiState>;
    return {
      documents: parsed.documents ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(next: HaccpWorkUiState) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getWorkDocumentState(
  workId: string,
): HaccpWorkDocumentState | null {
  const state = readState();
  return state.documents[workId] ?? null;
}

export function setWorkDocumentState(workId: string, created: boolean) {
  const state = readState();
  writeState({
    ...state,
    documents: {
      ...state.documents,
      [workId]: {
        created,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}
