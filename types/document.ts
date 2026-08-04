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
  assignedUsers?: DocumentAssignment[];
}

export type SignatureStatus = 'PENDING' | 'SIGNED' | 'DECLINED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentAssignment {
  id: string;
  documentId: string;
  userId: string;
  assignedAt: string;
  signatureStatus: SignatureStatus;
  signatureUrl?: string | null;
  signedAt?: string | null;
  documentHashAtSign?: string | null;
  deviceInfo?: string | null;
  approvalStatus: ApprovalStatus;
  approvedById?: string | null;
  approvedBy?: { id: string; name: string; role: string } | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  user?: { id: string; name: string; role: string; email: string } | null;
  document?: Document & {
    project?: { id: string; name: string; year: number } | null;
    folder?: { id: string; name: string } | null;
    company?: { id: string; name: string } | null;
  };
}
