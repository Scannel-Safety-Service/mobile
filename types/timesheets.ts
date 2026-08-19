export type TimesheetStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED';

export type DayOfWeek =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export interface MobileProject {
  id: string;
  name: string;
  year?: number;
}

export interface MobileDayEntry {
  dayOfWeek: DayOfWeek;
  date?: string;
  startTime?: string;
  finishTime?: string;
  breakMinutes: number;
  hoursWorked: number;
  projectId?: string;
  project?: MobileProject;
  notes?: string;
}

export interface MobileAttachment {
  id?: string;
  uri?: string;
  name: string;
  size?: number;
  mimeType?: string;
  fileUrl?: string;
}

export interface MobileTimesheet {
  id: string;
  companyId: string;
  userId: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeEmail: string;
  weekStartDate: string;
  weekEndDate: string;
  status: TimesheetStatus;
  expenseReimbursement: boolean;
  productivityScore?: number | null;
  comments?: string | null;
  totalHours: number;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  supervisorNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  entries: {
    id: string;
    dayOfWeek: DayOfWeek;
    date?: string | null;
    startTime?: string | null;
    finishTime?: string | null;
    breakMinutes: number;
    hoursWorked: number;
    projectId?: string | null;
    project?: { id: string; name: string } | null;
    notes?: string | null;
  }[];
  attachments: {
    id: string;
    fileUrl: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
  }[];
}
