/**
 * Check if a user is the owner of a document.
 * Only the document creator can perform save, submit, and cancel operations.
 */
export function isDocumentOwner(
  createdBy: string | undefined,
  currentUserId: string,
): boolean {
  const normalized = String(createdBy || '').trim();
  const currentNormalized = String(currentUserId || '').trim();

  if (!normalized || !currentNormalized) {
    return false;
  }

  return normalized === currentNormalized;
}

export function canEditDocument(
  createdBy: string | undefined,
  currentUserId: string,
): boolean {
  return isDocumentOwner(createdBy, currentUserId);
}

export function canSubmitApproval(
  createdBy: string | undefined,
  currentUserId: string,
): boolean {
  return isDocumentOwner(createdBy, currentUserId);
}

export function canCancelApproval(
  createdBy: string | undefined,
  currentUserId: string,
): boolean {
  return isDocumentOwner(createdBy, currentUserId);
}
