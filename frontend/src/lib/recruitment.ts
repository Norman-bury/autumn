import api, { withAxiosTimeZoneHeaders } from './api';
import type {
  CompanyPortal,
  RecruitmentEvent,
  RecruitmentEventCreate,
  RecruitmentEventStatus,
} from './types';

export async function listRecruitmentEvents(params?: {
  application_id?: string;
  status?: RecruitmentEventStatus;
  upcoming_only?: boolean;
}): Promise<RecruitmentEvent[]> {
  const response = await api.get('/api/recruitment-events', { params });
  return response.data;
}

export async function createRecruitmentEvent(
  data: RecruitmentEventCreate
): Promise<RecruitmentEvent> {
  const response = await api.post('/api/recruitment-events', data, {
    headers: withAxiosTimeZoneHeaders(),
  });
  return response.data;
}

export async function updateRecruitmentEvent(
  eventId: string,
  data: Partial<RecruitmentEventCreate>
): Promise<RecruitmentEvent> {
  const response = await api.patch(`/api/recruitment-events/${eventId}`, data);
  return response.data;
}

export async function deleteRecruitmentEvent(eventId: string): Promise<void> {
  await api.delete(`/api/recruitment-events/${eventId}`);
}

export async function listCompanyPortals(params?: {
  search?: string;
  city?: string;
  company_scale?: string;
  company_type?: string;
  recruitment_status?: CompanyPortal['recruitment_status'];
  active_only?: boolean;
}): Promise<CompanyPortal[]> {
  const response = await api.get('/api/company-portals', { params });
  return response.data;
}
