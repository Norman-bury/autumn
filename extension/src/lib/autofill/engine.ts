/**
 * Main autofill engine that orchestrates detection and filling.
 */

import type {
  AutofillProfile,
  AutofillResult,
  FieldPolicy,
  FieldType,
} from './types';
import { scanForFillableFields } from './detection';
import { fillField } from './filling';

const SENSITIVE_FIELD_TYPES = new Set<FieldType>([
  'expected_salary',
  'work_authorization',
  'requires_sponsorship',
  'relocation',
  'available_start_date',
  'notice_period',
  'employment_status',
]);

const NEVER_AUTOFILL_FIELD_TYPES = new Set<FieldType>([
  'voluntary_self_identification',
  'gender',
  'race_ethnicity',
  'veteran_status',
  'disability_status',
  'background_check',
  'non_compete',
]);

/**
 * Field type to profile field mapping.
 */
const FIELD_TO_PROFILE: Record<
  FieldType,
  keyof AutofillProfile | '__combined__' | null
> = {
  first_name: 'first_name',
  last_name: 'last_name',
  full_name: '__combined__', // Special handling: combines first_name + last_name
  email: 'email',
  phone: 'phone',
  city: 'city',
  country: 'country',
  linkedin_url: 'linkedin_url',
  github_url: 'github_url',
  portfolio_url: 'portfolio_url',
  highest_degree: 'highest_degree',
  current_school: 'current_school',
  major: 'major',
  education_start_date: 'education_start_date',
  education_end_date: 'education_end_date',
  graduation_year: 'graduation_year',
  target_roles: 'target_roles',
  preferred_locations: 'preferred_locations',
  expected_salary: 'expected_salary',
  work_authorization: 'authorized_to_work',
  requires_sponsorship: 'requires_sponsorship',
  relocation: null,
  available_start_date: null,
  notice_period: null,
  employment_status: null,
  voluntary_self_identification: null,
  gender: null,
  race_ethnicity: null,
  veteran_status: null,
  disability_status: null,
  background_check: null,
  non_compete: null,
  skills: 'skills',
  self_summary: 'self_summary',
};

function getFieldPolicy(fieldType: FieldType): FieldPolicy {
  if (NEVER_AUTOFILL_FIELD_TYPES.has(fieldType)) {
    return {
      riskLevel: 'never',
      autofillAllowed: false,
      skipReason:
        'JobHuntBot safety boundary: voluntary identity, legal, background, or non-compete fields require manual review.',
    };
  }

  if (SENSITIVE_FIELD_TYPES.has(fieldType)) {
    return {
      riskLevel: 'sensitive',
      autofillAllowed: false,
      skipReason:
        'JobHuntBot safety boundary: sensitive work authorization, sponsorship, compensation, start-date, relocation, or employment-status fields need explicit user confirmation.',
    };
  }

  return { riskLevel: 'safe', autofillAllowed: true };
}

/**
 * Get the value for a field type from the profile.
 * Handles combined fields like full_name.
 */
function getFieldValue(
  fieldType: FieldType,
  profile: AutofillProfile
): string | null {
  if (fieldType === 'full_name') {
    if (
      profile.first_name &&
      profile.last_name &&
      /[\u4e00-\u9fff]/.test(`${profile.first_name}${profile.last_name}`)
    ) {
      return `${profile.last_name}${profile.first_name}`;
    }
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  const profileKey = FIELD_TO_PROFILE[fieldType] as keyof AutofillProfile;
  if (!profileKey) {
    return null;
  }
  const value = profile[profileKey];
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return Array.isArray(value) ? value.join(', ') : (value ?? null);
}

/**
 * Autofill engine class.
 */
export class AutofillEngine {
  private lastScanResult: ReturnType<typeof scanForFillableFields> | null =
    null;

  /**
   * Scan the page for fillable fields.
   */
  scan(): ReturnType<typeof scanForFillableFields> {
    this.lastScanResult = scanForFillableFields();
    return this.lastScanResult;
  }

  /**
   * Get the last scan result without re-scanning.
   */
  getLastScanResult(): ReturnType<typeof scanForFillableFields> | null {
    return this.lastScanResult;
  }

  /**
   * Fill all detected fields with profile data.
   */
  fill(profile: AutofillProfile): AutofillResult {
    const scanResult = this.scan();
    const result: AutofillResult = {
      filledCount: 0,
      skippedCount: 0,
      fields: [],
    };

    for (const scoredField of scanResult.fillableFields) {
      const policy = getFieldPolicy(scoredField.fieldType);
      const value = getFieldValue(scoredField.fieldType, profile);

      const fieldResult = {
        fieldType: scoredField.fieldType,
        filled: false,
        score: scoredField.score,
        riskLevel: policy.riskLevel,
        skipReason: policy.autofillAllowed ? undefined : policy.skipReason,
      };

      if (!policy.autofillAllowed) {
        result.skippedCount++;
        result.fields.push(fieldResult);
        continue;
      }

      if (!value || value.trim() === '') {
        result.skippedCount++;
        fieldResult.skipReason = 'No confirmed profile value available.';
        result.fields.push(fieldResult);
        continue;
      }

      const filled = fillField(scoredField.element, value);
      fieldResult.filled = filled;

      if (filled) {
        result.filledCount++;
      } else {
        result.skippedCount++;
        fieldResult.skipReason = 'Field was disabled, read-only, hidden, already filled, or rejected by the page.';
      }

      result.fields.push(fieldResult);
    }

    return result;
  }

  /**
   * Check if the page has fillable fields.
   */
  hasFillableFields(): boolean {
    const result = this.scan();
    return result.fillableFields.length > 0;
  }

  /**
   * Check if the page appears to be an application form.
   */
  isApplicationForm(): boolean {
    const result = this.scan();
    return result.hasApplicationForm;
  }

  /**
   * Get count of fillable fields.
   */
  getFillableFieldCount(): number {
    const result = this.scan();
    return result.fillableFields.length;
  }
}

/**
 * Singleton instance for use in content script.
 */
let engineInstance: AutofillEngine | null = null;

/**
 * Get or create the autofill engine instance.
 */
export function getAutofillEngine(): AutofillEngine {
  if (!engineInstance) {
    engineInstance = new AutofillEngine();
  }
  return engineInstance;
}

/**
 * Reset the engine instance (useful for testing).
 */
export function resetAutofillEngine(): void {
  engineInstance = null;
}
