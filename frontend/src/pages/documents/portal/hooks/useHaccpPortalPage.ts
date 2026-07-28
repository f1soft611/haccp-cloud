import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  listHaccpPortalDocuments,
  type HaccpPortalDocumentItem,
} from '../../../../services/documents/haccpPortalService';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { PortalSection } from '../types';

function normalizeCategoryTitle(value: string): string {
  const normalized = value.trim();
  return normalized || '기타문서';
}

function buildSections(items: HaccpPortalDocumentItem[]): PortalSection[] {
  const grouped = new Map<string, HaccpPortalDocumentItem[]>();

  items.forEach((item) => {
    const categoryTitle = normalizeCategoryTitle(item.categoryName);
    const bucket = grouped.get(categoryTitle) ?? [];
    bucket.push(item);
    grouped.set(categoryTitle, bucket);
  });

  return [...grouped.entries()].map(([title, sectionItems], index) => ({
    key: `category-${index}-${title}`,
    title,
    items: sectionItems,
  }));
}

export function useHaccpPortalPage() {
  const tenantCode = useAuthStore((state) => state.tenantCode || 'PLATFORM');

  const documentsQuery = useQuery({
    queryKey: ['haccp-portal-documents', tenantCode],
    queryFn: () => listHaccpPortalDocuments({ tenantCode }),
    retry: false,
  });

  const sections = useMemo<PortalSection[]>(() => {
    return buildSections(documentsQuery.data ?? []);
  }, [documentsQuery.data]);

  return {
    documentsQuery,
    sections,
  };
}
