import { DocumentSection } from './document';

export interface Category {
  id: string;
  name: string;
  section: DocumentSection;
  companyId: string | null;
  assignToAll: boolean;
  createdById: string;
  archivedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
