import { DocumentSection } from '../types/document';

export interface FolderDefinition {
  key: DocumentSection;
  label: string;
  icon: string;
  hasSubfolders: boolean;
  hasIndividuals?: boolean;
}

export const PREDEFINED_FOLDERS: FolderDefinition[] = [
  {
    key: DocumentSection.SAFETY_STATEMENT,
    label: 'Safety Statements',
    icon: 'shield-checkmark',
    hasSubfolders: false,
  },
  {
    key: DocumentSection.COMPANY_DOCUMENTS,
    label: 'Company Documents',
    icon: 'business',
    hasSubfolders: true,
  },
  {
    key: DocumentSection.RISK_ASSESSMENT,
    label: 'Risk Assessment',
    icon: 'warning',
    hasSubfolders: true,
  },
  {
    key: DocumentSection.METHOD_STATEMENTS,
    label: 'Method Statements',
    icon: 'clipboard',
    hasSubfolders: false,
  },
  {
    key: DocumentSection.TRAINING_REGISTER,
    label: 'Training Registers',
    icon: 'school',
    hasSubfolders: false,
  },
  {
    key: DocumentSection.TRAINING_QUALIFICATIONS,
    label: 'Training Qualifications',
    icon: 'ribbon',
    hasSubfolders: false,
    hasIndividuals: true,
  },
];
