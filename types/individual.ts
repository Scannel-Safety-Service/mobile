export interface Individual {
  id: string;
  companyId: string;
  userId: string;
  name: string;
  archivedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
