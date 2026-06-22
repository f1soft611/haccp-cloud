import {
  Alert,
  Snackbar,
  type AlertColor,
  type SnackbarCloseReason,
} from '@mui/material';
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type FeedbackSeverity = AlertColor;

export type FeedbackContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  clearFeedback: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

type FeedbackState = {
  open: boolean;
  message: string;
  severity: FeedbackSeverity;
};

const INITIAL_STATE: FeedbackState = {
  open: false,
  message: '',
  severity: 'info',
};

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_STATE);

  const show = useCallback((severity: FeedbackSeverity, message: string) => {
    setFeedback({ open: true, message, severity });
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback((current) => ({ ...current, open: false }));
  }, []);

  const handleClose = useCallback(
    (_event?: Event | React.SyntheticEvent, reason?: SnackbarCloseReason) => {
      if (reason === 'clickaway') {
        return;
      }
      clearFeedback();
    },
    [clearFeedback],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      showSuccess: (message) => show('success', message),
      showError: (message) => show('error', message),
      showInfo: (message) => show('info', message),
      showWarning: (message) => show('warning', message),
      clearFeedback,
    }),
    [clearFeedback, show],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        open={feedback.open}
        autoHideDuration={2800}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={feedback.severity}
          variant="filled"
          sx={{ minWidth: 280, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}
