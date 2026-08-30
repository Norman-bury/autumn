import api from './api';
import type { ResumeParseResponse, UserProfile } from './types';

interface UserProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  city?: string | null;
  country?: string | null;
  highest_degree?: string | null;
  graduation_year?: string | null;
  target_roles?: string[] | null;
  preferred_locations?: string[] | null;
  expected_salary?: string | null;
  authorized_to_work?: string | null;
  requires_sponsorship?: boolean | null;
  work_history?: Record<string, unknown>[] | null;
  education?: Record<string, unknown>[] | null;
  skills?: string[] | null;
  projects?: Record<string, unknown>[] | null;
  certificates?: string[] | null;
  languages?: string[] | null;
  self_summary?: string | null;
}

/**
 * Get the current user's profile.
 * Creates an empty profile if one doesn't exist.
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await api.get('/api/profile');
  return response.data;
}

/**
 * Update the current user's profile.
 * Only provided fields will be updated.
 */
export async function updateProfile(
  data: UserProfileUpdate
): Promise<UserProfile> {
  const response = await api.put('/api/profile', data);
  return response.data;
}

export async function uploadResume(file: File): Promise<ResumeParseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
