export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  is_default?: boolean;
  order?: number;
}

export interface RoundType {
  id: string;
  name: string;
  is_default?: boolean;
}

export interface RoundMedia {
  id: string;
  file_path: string;
  media_type: string;
  uploaded_at: string;
}

export interface Round {
  id: string;
  round_type: RoundType;
  scheduled_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  notes_summary: string | null;
  transcript_path: string | null;
  transcript_original_filename: string | null;
  transcript_summary: string | null;
  media: RoundMedia[];
  created_at: string;
}

export interface Application {
  id: string;
  company: string;
  job_title: string;
  job_description: string | null;
  job_url: string | null;
  status: Status;
  cv_path: string | null;
  cover_letter_path: string | null;
  applied_at: string;
  created_at: string;
  updated_at: string;
  rounds?: Round[];
  // New fields from job lead conversion
  job_lead_id: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  recruiter_name: string | null;
  recruiter_title: string | null;
  recruiter_linkedin_url: string | null;
  requirements_must_have: string[];
  requirements_nice_to_have: string[];
  skills: string[];
  years_experience_min: number | null;
  years_experience_max: number | null;
  source: string | null;
  recruitment_cycle: string;
  recruitment_batch: string;
  target_track: string | null;
  company_type: string | null;
  company_scale: string | null;
  priority: 'high' | 'medium' | 'low';
  deadline: string | null;
  application_channel: string | null;
  referral_code: string | null;
  notes: string | null;
  recruitment_events?: RecruitmentEvent[];
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApplicationCreate {
  company: string;
  job_title: string;
  job_description?: string;
  job_url?: string;
  status_id: string;
  applied_at?: string;
  location?: string | null;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  recruiter_name?: string;
  recruiter_title?: string;
  recruiter_linkedin_url?: string;
  requirements_must_have?: string[];
  requirements_nice_to_have?: string[];
  skills?: string[];
  years_experience_min?: number | null;
  years_experience_max?: number | null;
  source?: string;
  recruitment_cycle?: string;
  recruitment_batch?: string;
  target_track?: string;
  company_type?: string;
  company_scale?: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string | null;
  application_channel?: string;
  referral_code?: string;
  notes?: string;
}

export interface ApplicationUpdate {
  company?: string;
  job_title?: string;
  job_description?: string | null;
  job_url?: string | null;
  status_id?: string;
  applied_at?: string;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  recruiter_name?: string | null;
  recruiter_title?: string | null;
  recruiter_linkedin_url?: string | null;
  requirements_must_have?: string[] | null;
  requirements_nice_to_have?: string[] | null;
  skills?: string[] | null;
  years_experience_min?: number | null;
  years_experience_max?: number | null;
  source?: string | null;
  recruitment_cycle?: string | null;
  recruitment_batch?: string | null;
  target_track?: string | null;
  company_type?: string | null;
  company_scale?: string | null;
  priority?: 'high' | 'medium' | 'low' | null;
  deadline?: string | null;
  application_channel?: string | null;
  referral_code?: string | null;
  notes?: string | null;
}

export type RecruitmentEventType =
  | 'application'
  | 'written_test'
  | 'assessment'
  | 'interview'
  | 'hr_interview'
  | 'medical'
  | 'background_check'
  | 'offer'
  | 'signing'
  | 'follow_up'
  | 'other';

export type RecruitmentEventStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'missed';

export interface RecruitmentEvent {
  id: string;
  application_id: string;
  event_type: RecruitmentEventType;
  title: string;
  status: RecruitmentEventStatus;
  scheduled_at: string | null;
  deadline_at: string | null;
  result: string | null;
  link: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: string;
  job_title?: string;
}

export interface RecruitmentEventCreate {
  application_id: string;
  event_type: RecruitmentEventType;
  title: string;
  status?: RecruitmentEventStatus;
  scheduled_at?: string | null;
  deadline_at?: string | null;
  result?: string | null;
  link?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface CompanyPortal {
  id: string;
  user_id: string | null;
  company_name: string;
  company_type: string;
  company_scale: string;
  industry: string;
  city: string;
  careers_url: string;
  campus_url: string | null;
  focus_roles: string[];
  recruitment_cycle: string;
  recruitment_status:
    | 'open'
    | 'closing_soon'
    | 'rolling'
    | 'closed'
    | 'not_started'
    | 'needs_review';
  application_deadline: string | null;
  verification_status: 'verified' | 'needs_review' | 'expired';
  verified_at: string | null;
  evidence_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoundCreate {
  round_type_id: string;
  scheduled_at?: string;
  notes_summary?: string;
  transcript_summary?: string;
}

export interface RoundUpdate {
  round_type_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  outcome?: string;
  notes_summary?: string;
  transcript_summary?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  from_status: Status | null;
  to_status: Status;
  changed_at: string;
  note: string | null;
}

export type JobLeadStatus = 'pending' | 'extracted' | 'failed' | 'converted';

export interface JobLead {
  id: string;
  title: string | null;
  company: string | null;
  url: string;
  status: JobLeadStatus;
  description: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  recruiter_name: string | null;
  recruiter_title: string | null;
  recruiter_linkedin_url: string | null;
  requirements_must_have: string[];
  requirements_nice_to_have: string[];
  skills: string[];
  years_experience_min: number | null;
  years_experience_max: number | null;
  source: string | null;
  posted_date: string | null;
  scraped_at: string;
  converted_to_application_id: string | null;
  error_message: string | null;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  authorized_to_work: string | null;
  requires_sponsorship: boolean | null;
}

export interface APIKey {
  id: string;
  label: string;
  preset: string;
  scopes: string[];
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface APIKeyCreateResponse extends APIKey {
  api_key: string;
}
