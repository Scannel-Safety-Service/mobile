import { apiRequest } from './api';
import { MobileTimesheet, MobileProject } from '../types/timesheets';

export async function fetchTimesheets(status?: string): Promise<MobileTimesheet[]> {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  const response = await apiRequest(`/timesheets${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timesheets');
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchTimesheetById(id: string): Promise<MobileTimesheet> {
  const response = await apiRequest(`/timesheets/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timesheet details');
  }
  const result = await response.json();
  return result.data;
}

export async function fetchLiveProjects(): Promise<MobileProject[]> {
  const response = await apiRequest('/projects?limit=100');
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  const rawList = result.data?.items || result.data || [];
  return rawList.map((p: any) => ({
    id: p.id,
    name: p.name,
    year: p.year,
  }));
}

export interface SubmitTimesheetPayload {
  employeeFirstName: string;
  employeeLastName: string;
  employeeEmail: string;
  weekStartDate: string;
  weekEndDate: string;
  status?: 'PENDING' | 'DRAFT';
  expenseReimbursement?: boolean;
  productivityScore?: number;
  comments?: string;
  entries: {
    dayOfWeek: string;
    date?: string;
    startTime?: string;
    finishTime?: string;
    breakMinutes?: number;
    hoursWorked?: number;
    projectId?: string;
    notes?: string;
  }[];
}

export async function submitTimesheet(
  payload: SubmitTimesheetPayload,
  attachments?: { uri: string; name: string; type: string }[],
): Promise<MobileTimesheet> {
  let body: any;

  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append('employeeFirstName', payload.employeeFirstName);
    formData.append('employeeLastName', payload.employeeLastName);
    formData.append('employeeEmail', payload.employeeEmail);
    formData.append('weekStartDate', payload.weekStartDate);
    formData.append('weekEndDate', payload.weekEndDate);
    if (payload.status) formData.append('status', payload.status);
    formData.append('expenseReimbursement', String(Boolean(payload.expenseReimbursement)));
    if (payload.productivityScore !== undefined) {
      formData.append('productivityScore', String(payload.productivityScore));
    }
    if (payload.comments) formData.append('comments', payload.comments);
    formData.append('entries', JSON.stringify(payload.entries));

    attachments.forEach((att) => {
      formData.append('files', {
        uri: att.uri,
        name: att.name,
        type: att.type || 'image/jpeg',
      } as any);
    });

    body = formData;
  } else {
    body = JSON.stringify(payload);
  }

  const response = await apiRequest('/timesheets', {
    method: 'POST',
    body,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to submit timesheet');
  }

  return result.data;
}

export async function updateTimesheet(
  id: string,
  payload: Partial<SubmitTimesheetPayload>,
  attachments?: { uri: string; name: string; type: string }[],
): Promise<MobileTimesheet> {
  let body: any;

  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    if (payload.employeeFirstName) formData.append('employeeFirstName', payload.employeeFirstName);
    if (payload.employeeLastName) formData.append('employeeLastName', payload.employeeLastName);
    if (payload.employeeEmail) formData.append('employeeEmail', payload.employeeEmail);
    if (payload.weekStartDate) formData.append('weekStartDate', payload.weekStartDate);
    if (payload.weekEndDate) formData.append('weekEndDate', payload.weekEndDate);
    if (payload.status) formData.append('status', payload.status);
    if (payload.expenseReimbursement !== undefined) {
      formData.append('expenseReimbursement', String(Boolean(payload.expenseReimbursement)));
    }
    if (payload.productivityScore !== undefined) {
      formData.append('productivityScore', String(payload.productivityScore));
    }
    if (payload.comments !== undefined) formData.append('comments', payload.comments);
    if (payload.entries) formData.append('entries', JSON.stringify(payload.entries));

    attachments.forEach((att) => {
      formData.append('files', {
        uri: att.uri,
        name: att.name,
        type: att.type || 'image/jpeg',
      } as any);
    });

    body = formData;
  } else {
    body = JSON.stringify(payload);
  }

  const response = await apiRequest(`/timesheets/${id}`, {
    method: 'PATCH',
    body,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to update timesheet');
  }

  return result.data;
}
