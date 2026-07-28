import { describe, expect, it } from 'vitest';
import {
  canCancelApproval,
  canEditDocument,
  canSubmitApproval,
  isDocumentOwner,
} from './ownershipUtils';

describe('ownershipUtils', () => {
  describe('isDocumentOwner', () => {
    it('should return true when createdBy matches currentUserId', () => {
      const result = isDocumentOwner('user123', 'user123');
      expect(result).toBe(true);
    });

    it('should return false when createdBy does not match currentUserId', () => {
      const result = isDocumentOwner('user123', 'user456');
      expect(result).toBe(false);
    });

    it('should return false when createdBy is undefined', () => {
      const result = isDocumentOwner(undefined, 'user123');
      expect(result).toBe(false);
    });

    it('should return false when currentUserId is empty string', () => {
      const result = isDocumentOwner('user123', '');
      expect(result).toBe(false);
    });

    it('should handle whitespace by trimming', () => {
      const result = isDocumentOwner('  user123  ', '  user123  ');
      expect(result).toBe(true);
    });

    it('should be case-sensitive', () => {
      const result = isDocumentOwner('User123', 'user123');
      expect(result).toBe(false);
    });
  });

  describe('canEditDocument', () => {
    it('should return true when user is owner', () => {
      const result = canEditDocument('user123', 'user123');
      expect(result).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const result = canEditDocument('user123', 'user456');
      expect(result).toBe(false);
    });
  });

  describe('canSubmitApproval', () => {
    it('should return true when user is owner', () => {
      const result = canSubmitApproval('user123', 'user123');
      expect(result).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const result = canSubmitApproval('user123', 'user456');
      expect(result).toBe(false);
    });
  });

  describe('canCancelApproval', () => {
    it('should return true when user is owner', () => {
      const result = canCancelApproval('user123', 'user123');
      expect(result).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const result = canCancelApproval('user123', 'user456');
      expect(result).toBe(false);
    });
  });
});
