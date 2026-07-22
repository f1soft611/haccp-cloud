import type { HaccpPortalDocumentItem } from '../../../services/documents/haccpPortalService';

export type PortalSectionKey = string;

export type PortalSection = {
  key: PortalSectionKey;
  title: string;
  items: HaccpPortalDocumentItem[];
};
