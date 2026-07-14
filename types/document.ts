export enum DocumentSection {
  SAFETY_STATEMENT = 'SAFETY_STATEMENT',
  COMPANY_DOCUMENTS = 'COMPANY_DOCUMENTS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  METHOD_STATEMENTS = 'METHOD_STATEMENTS',
  TRAINING_REGISTER = 'TRAINING_REGISTER',
  TRAINING_QUALIFICATIONS = 'TRAINING_QUALIFICATIONS',
  ASSET_DOCUMENTS = 'ASSET_DOCUMENTS',
}

export interface Document {
  id: string;
  title: string | null;
  description: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  companyId: string;
  userId: string | null;
  categoryId: string | null;
  section: DocumentSection;
  fileUrl: string;
  originalFileName: string;
  documentType: string | null;
  inspectionType: string | null;
  archivedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  assetId: string | null;
  projectId: string | null;
  folderId: string | null;
}
