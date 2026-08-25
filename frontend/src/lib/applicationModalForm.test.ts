import { describe, expect, it } from 'vitest';

import {
  buildCreateApplicationPayload,
  buildUpdateApplicationPayload,
  isValidApplicationUrl,
  normalizeApplicationUrl,
  splitRequirementLines,
} from './applicationModalForm';

describe('application modal form helpers', () => {
  it('adds https to bare application urls', () => {
    expect(normalizeApplicationUrl('example.com/job')).toBe(
      'https://example.com/job'
    );
  });

  it('rejects malformed urls after normalization', () => {
    expect(isValidApplicationUrl('https://not a url')).toBe(false);
  });

  it('converts requirement textareas into trimmed arrays', () => {
    expect(splitRequirementLines(' React  \n\n TypeScript \n')).toEqual([
      'React',
      'TypeScript',
    ]);
  });

  it('builds create payloads with undefined optional fields', () => {
    expect(
      buildCreateApplicationPayload({
        company: 'Acme',
        jobTitle: 'Engineer',
        jobDescription: '',
        jobUrl: 'example.com/job',
        location: '杭州',
        statusId: 'status-1',
        appliedAt: '2026-03-25',
        salaryMin: '',
        salaryMax: '150',
        salaryCurrency: 'USD',
        recruiterName: '',
        recruiterTitle: 'Recruiter',
        recruiterLinkedinUrl: '',
        requirementsMustHave: 'React',
        requirementsNiceToHave: '',
        source: '',
        recruitmentCycle: '2027届秋招',
        recruitmentBatch: '正式批',
        targetTrack: 'Agent 开发',
        companyType: '民营',
        companyScale: '中型',
        priority: 'high',
        deadline: '2026-09-01',
        applicationChannel: '官网',
        referralCode: '',
        notes: '',
      })
    ).toEqual({
      company: 'Acme',
      job_title: 'Engineer',
      job_description: undefined,
      job_url: 'https://example.com/job',
      location: '杭州',
      status_id: 'status-1',
      applied_at: '2026-03-25',
      salary_min: undefined,
      salary_max: 150000,
      salary_currency: 'USD',
      recruiter_name: undefined,
      recruiter_title: 'Recruiter',
      recruiter_linkedin_url: undefined,
      requirements_must_have: ['React'],
      requirements_nice_to_have: undefined,
      source: undefined,
      recruitment_cycle: '2027届秋招',
      recruitment_batch: '正式批',
      target_track: 'Agent 开发',
      company_type: '民营',
      company_scale: '中型',
      priority: 'high',
      deadline: '2026-09-01',
      application_channel: '官网',
      referral_code: undefined,
      notes: undefined,
    });
  });

  it('builds update payloads with null optional fields', () => {
    expect(
      buildUpdateApplicationPayload({
        company: 'Acme',
        jobTitle: 'Engineer',
        jobDescription: '',
        jobUrl: '',
        location: '',
        statusId: 'status-1',
        appliedAt: '2026-03-25',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: '',
        recruiterName: '',
        recruiterTitle: '',
        recruiterLinkedinUrl: '',
        requirementsMustHave: '',
        requirementsNiceToHave: 'Docker',
        source: '',
        recruitmentCycle: '2027届秋招',
        recruitmentBatch: '补录',
        targetTrack: '',
        companyType: '',
        companyScale: '',
        priority: 'medium',
        deadline: '',
        applicationChannel: '',
        referralCode: '',
        notes: '',
      })
    ).toEqual({
      company: 'Acme',
      job_title: 'Engineer',
      job_description: null,
      job_url: null,
      location: null,
      status_id: 'status-1',
      applied_at: '2026-03-25',
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      recruiter_name: null,
      recruiter_title: null,
      recruiter_linkedin_url: null,
      requirements_must_have: null,
      requirements_nice_to_have: ['Docker'],
      source: null,
      recruitment_cycle: '2027届秋招',
      recruitment_batch: '补录',
      target_track: null,
      company_type: null,
      company_scale: null,
      priority: 'medium',
      deadline: null,
      application_channel: null,
      referral_code: null,
      notes: null,
    });
  });
});
