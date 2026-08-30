import api from './api';
import type { EmailSyncConfig, EmailSyncResult, RecruitmentMail } from './types';

export interface EmailSyncConfigUpdate {
  provider: string;
  imap_host: string;
  imap_port: number;
  username: string;
  password?: string | null;
  use_ssl: boolean;
  enabled: boolean;
}

export async function getEmailSyncConfig(): Promise<EmailSyncConfig | null> {
  const response = await api.get('/api/email-sync/config');
  return response.data;
}

export async function updateEmailSyncConfig(
  data: EmailSyncConfigUpdate
): Promise<EmailSyncConfig> {
  const response = await api.put('/api/email-sync/config', data);
  return response.data;
}

export async function listRecruitmentMails(): Promise<RecruitmentMail[]> {
  const response = await api.get('/api/email-sync/messages');
  return response.data;
}

export async function syncRecruitmentMails(): Promise<EmailSyncResult> {
  const response = await api.post('/api/email-sync/sync');
  return response.data;
}
