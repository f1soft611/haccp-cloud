import { apiClient } from '../api/apiClient';

export type DocumentStatus = 'DRAFT' | 'ACTIVE';

export type DocumentTemplate = {
  id: string;
  tenantCode: string;
  title: string;
  category: string;
  content: string;
  status: DocumentStatus;
  version: number;
  updatedBy: string;
  updatedAt: string;
};

export type DocumentHistoryItem = {
  id: string;
  tenantCode: string;
  documentId: string;
  title: string;
  version: number;
  changedBy: string;
  changedAt: string;
  summary: string;
};

export async function listDocuments(
  tenantCode: string,
): Promise<DocumentTemplate[]> {
  const { data } = await apiClient.get<DocumentTemplate[]>('/documents', {
    headers: { 'x-tenant-code': tenantCode },
  });
  return data;
}

export async function createDocument(payload: {
  tenantCode: string;
  title: string;
  category: string;
  content: string;
  status: DocumentStatus;
  updatedBy: string;
}): Promise<DocumentTemplate> {
  const { data } = await apiClient.post<DocumentTemplate>(
    '/documents',
    payload,
    {
      headers: { 'x-tenant-code': payload.tenantCode },
    },
  );
  return data;
}

export async function listDocumentHistory(
  tenantCode: string,
): Promise<DocumentHistoryItem[]> {
  const { data } = await apiClient.get<DocumentHistoryItem[]>(
    '/document-history',
    {
      headers: { 'x-tenant-code': tenantCode },
    },
  );
  return data;
}
