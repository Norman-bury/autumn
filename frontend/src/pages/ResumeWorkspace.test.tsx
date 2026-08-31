import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResumeWorkspace from './ResumeWorkspace';
import type { TailoredResume } from '../lib/types';

const {
  listTailoredResumes,
  createTailoredResume,
  updateTailoredResume,
  approveTailoredResume,
  downloadTailoredResume,
  toast,
} = vi.hoisted(() => ({
  listTailoredResumes: vi.fn(),
  createTailoredResume: vi.fn(),
  updateTailoredResume: vi.fn(),
  approveTailoredResume: vi.fn(),
  downloadTailoredResume: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('../contexts/ToastContext', () => ({
  useToastContext: () => toast,
}));

vi.mock('../lib/applications', () => ({
  getApplication: vi.fn(),
}));

vi.mock('../lib/jobLeads', () => ({
  getJobLead: vi.fn(),
}));

vi.mock('../lib/tailoredResumes', () => ({
  listTailoredResumes,
  createTailoredResume,
  updateTailoredResume,
  approveTailoredResume,
  downloadTailoredResume,
}));

const draft: TailoredResume = {
  id: 'resume-1',
  application_id: null,
  job_lead_id: null,
  company: null,
  job_title: 'AI研发工程师',
  source_resume_filename: 'master-188.pdf',
  jd_text: '负责Agent系统架构、RAG知识库和自动化评测。',
  jd_analysis: {
    keywords: ['Agent', 'RAG'],
    requirements: [
      {
        key: 'agent',
        label: 'Agent架构与工具编排',
        coverage: 'strong',
        evidence: ['EvalAgent'],
      },
    ],
    strong_count: 1,
    partial_count: 0,
    gap_count: 0,
  },
  content: {
    target_role: 'AI研发工程师',
    summary: '聚焦Agent、RAG与AI工程化。',
    core_skills: ['Agent', 'RAG', 'Python'],
    experiences: [
      {
        source_id: 'work-0',
        heading: '测试公司',
        subheading: 'Agent实习生',
        period: '2026-05 - 至今',
        bullets: ['构建Agent评测系统。'],
      },
    ],
    projects: [],
    education: [],
    additional: [],
  },
  validation: { valid: true, errors: [], warnings: [] },
  generation_strategy: 'deterministic',
  status: 'draft',
  docx_path: null,
  docx_filename: null,
  created_at: '2026-08-30T00:00:00Z',
  updated_at: '2026-08-30T00:00:00Z',
  approved_at: null,
};

describe('ResumeWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTailoredResumes.mockResolvedValue([]);
    createTailoredResume.mockResolvedValue(draft);
    updateTailoredResume.mockResolvedValue(draft);
    approveTailoredResume.mockResolvedValue({
      ...draft,
      status: 'approved',
      docx_path: 'uploads/resume.docx',
      docx_filename: 'AI研发工程师_定制简历.docx',
    });
  });

  it('generates an editable draft and approves it as DOCX', async () => {
    render(
      <MemoryRouter initialEntries={['/resumes']}>
        <ResumeWorkspace />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('岗位JD'), {
      target: {
        value: '负责Agent系统架构、工具编排、RAG知识库、自动化评测和工程落地。',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成草稿' }));

    expect(await screen.findByText('JD匹配')).toBeInTheDocument();
    expect(screen.getByText('Agent架构与工具编排')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('聚焦Agent、RAG与AI工程化。')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('个人概述'), {
      target: { value: '聚焦Agent系统落地与评测。' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存草稿' }));
    await waitFor(() => {
      expect(updateTailoredResume).toHaveBeenCalledWith(
        'resume-1',
        expect.objectContaining({ summary: '聚焦Agent系统落地与评测。' })
      );
    });

    fireEvent.change(screen.getByLabelText('个人概述'), {
      target: { value: '最终确认版本。' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认并生成DOCX' }));

    await waitFor(() => {
      expect(approveTailoredResume).toHaveBeenCalledWith(
        'resume-1',
        false,
        expect.objectContaining({ summary: '最终确认版本。' })
      );
    });
    expect(
      await screen.findByRole('button', { name: '下载DOCX' })
    ).toBeInTheDocument();
  });
});
