/**
 * User profile data for autofill.
 */
export interface AutofillProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  linkedin_url: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  highest_degree?: string | null;
  current_school?: string | null;
  major?: string | null;
  education_start_date?: string | null;
  education_end_date?: string | null;
  graduation_year?: string | null;
  target_roles?: string[] | null;
  preferred_locations?: string[] | null;
  expected_salary?: string | null;
  authorized_to_work?: string | null;
  requires_sponsorship?: boolean | null;
  skills?: string[] | null;
  self_summary?: string | null;
}

/**
 * Supported field types for autofill.
 */
export type FieldType =
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'city'
  | 'country'
  | 'linkedin_url'
  | 'github_url'
  | 'portfolio_url'
  | 'highest_degree'
  | 'current_school'
  | 'major'
  | 'education_start_date'
  | 'education_end_date'
  | 'graduation_year'
  | 'target_roles'
  | 'preferred_locations'
  | 'expected_salary'
  | 'work_authorization'
  | 'requires_sponsorship'
  | 'relocation'
  | 'available_start_date'
  | 'notice_period'
  | 'employment_status'
  | 'voluntary_self_identification'
  | 'gender'
  | 'race_ethnicity'
  | 'veteran_status'
  | 'disability_status'
  | 'background_check'
  | 'non_compete'
  | 'skills'
  | 'self_summary';

/**
 * JobHuntBot-derived safety policy for each detected field.
 * Safe fields can be filled from confirmed profile facts. Sensitive fields are
 * detected but skipped until the product has explicit user-confirmed answers.
 * Never fields are intentionally not autofilled.
 */
export type FieldRiskLevel = 'safe' | 'sensitive' | 'never';

export interface FieldPolicy {
  riskLevel: FieldRiskLevel;
  autofillAllowed: boolean;
  skipReason?: string;
}

/**
 * Pattern configuration for a field type.
 */
export interface FieldPattern {
  autocomplete: string[];
  labelPatterns: RegExp[];
  placeholderPatterns: RegExp[];
  namePatterns: RegExp[];
  idPatterns: RegExp[];
}

/**
 * Scored field candidate.
 */
export interface ScoredField {
  element: HTMLInputElement | HTMLTextAreaElement;
  fieldType: FieldType;
  score: number;
}

/**
 * Result of form scanning.
 */
export interface FormScanResult {
  hasApplicationForm: boolean;
  fillableFields: ScoredField[];
  totalRelevantFields: number;
}

/**
 * Result of autofill operation.
 */
export interface AutofillResult {
  filledCount: number;
  skippedCount: number;
  fields: {
    fieldType: FieldType;
    filled: boolean;
    score: number;
    riskLevel: FieldRiskLevel;
    skipReason?: string;
  }[];
}

/**
 * Checks if the profile has any data that can be used for autofill.
 */
export function hasAutofillData(profile: AutofillProfile | null): boolean {
  if (!profile) {
    return false;
  }

  return (
    !!profile.first_name ||
    !!profile.last_name ||
    !!profile.email ||
    !!profile.phone ||
    !!profile.city ||
    !!profile.country ||
    !!profile.linkedin_url ||
    !!profile.github_url ||
    !!profile.portfolio_url ||
    !!profile.highest_degree ||
    !!profile.current_school ||
    !!profile.major ||
    !!profile.education_start_date ||
    !!profile.education_end_date ||
    !!profile.graduation_year ||
    !!profile.target_roles?.length ||
    !!profile.preferred_locations?.length ||
    !!profile.expected_salary ||
    !!profile.skills?.length ||
    !!profile.self_summary
  );
}
