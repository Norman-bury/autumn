import api from './api';
import type {
  TailoredResume,
  TailoredResumeContent,
  TailoredResumeCreate,
} from './types';

export async function listTailoredResumes(): Promise<TailoredResume[]> {
  const response = await api.get<TailoredResume[]>('/api/tailored-resumes');
  return response.data;
}

export async function createTailoredResume(
  data: TailoredResumeCreate
): Promise<TailoredResume> {
  const response = await api.post<TailoredResume>(
    '/api/tailored-resumes',
    data
  );
  return response.data;
}

export async function updateTailoredResume(
  id: string,
  content: TailoredResumeContent
): Promise<TailoredResume> {
  const response = await api.patch<TailoredResume>(
    `/api/tailored-resumes/${id}`,
    { content }
  );
  return response.data;
}

export async function approveTailoredResume(
  id: string,
  attachToApplication: boolean
): Promise<TailoredResume> {
  const response = await api.post<TailoredResume>(
    `/api/tailored-resumes/${id}/approve`,
    { attach_to_application: attachToApplication }
  );
  return response.data;
}

export async function downloadTailoredResume(
  resume: TailoredResume
): Promise<void> {
  const response = await api.get(
    `/api/tailored-resumes/${resume.id}/download`,
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = resume.docx_filename || 'tailored-resume.docx';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
