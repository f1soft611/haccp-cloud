import { useContext } from 'react';
import {
  FeedbackContext,
  type FeedbackContextValue,
} from '../providers/FeedbackProvider';

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider.');
  }

  return context;
}
