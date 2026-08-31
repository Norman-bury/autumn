import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useToastContext } from '../contexts/ToastContext';
import { getApplication } from '../lib/applications';
import { getJobLead } from '../lib/jobLeads';
import {
  approveTailoredResume,
  createTailoredResume,
  downloadTailoredResume,
  listTailoredResumes,
  updateTailoredResume,
} from '../lib/tailoredResumes';
import type {
  TailoredResume,
  TailoredResumeContent,
  TailoredResumeEntry,
} from '../lib/types';

const COVERAGE_LABEL = {
  strong: '强匹配',
  partial: '部分匹配',
  gap: '缺少证据',
} as const;

const COVERAGE_CLASS = {
  strong: 'bg-green-bright/15 text-green-bright',
  partial: 'bg-yellow/15 text-yellow',
  gap: 'bg-red-bright/15 text-red-bright',
} as const;

export default function ResumeWorkspace() {
  const toast = useToastContext();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const jobLeadId = searchParams.get('jobLeadId');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('AI研发工程师');
  const [jobDescription, setJobDescription] = useState('');
  const [resumes, setResumes] = useState<TailoredResume[]>([]);
  const [draft, setDraft] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const loadResumes = useCallback(async () => {
    try {
      setResumes(await listTailoredResumes());
    } catch {
      toast.error('无法加载定制简历');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    async function loadSource() {
      try {
        if (applicationId) {
          const application = await getApplication(applicationId);
          setCompany(application.company);
          setJobTitle(application.job_title);
          setJobDescription(application.job_description || '');
        } else if (jobLeadId) {
          const jobLead = await getJobLead(jobLeadId);
          setCompany(jobLead.company || '');
          setJobTitle(jobLead.title || '目标岗位');
          setJobDescription(jobLead.description || '');
        }
      } catch {
        toast.error('无法读取岗位信息');
      }
    }
    void loadSource();
  }, [applicationId, jobLeadId, toast]);

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    if (jobDescription.trim().length < 20) {
      toast.error('请粘贴完整岗位JD');
      return;
    }
    setGenerating(true);
    try {
      const created = await createTailoredResume({
        company: company || undefined,
        job_title: jobTitle || undefined,
        job_description: jobDescription,
        application_id: applicationId || undefined,
        job_lead_id: jobLeadId || undefined,
      });
      setDraft(created);
      setResumes((current) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
      toast.success('定制简历草稿已生成');
    } catch {
      toast.error('生成失败，请确认母版资料和JD完整');
    } finally {
      setGenerating(false);
    }
  }

  function updateContent(update: (content: TailoredResumeContent) => void) {
    if (!draft || draft.status !== 'draft') return;
    const content = structuredClone(draft.content);
    update(content);
    setDraft({ ...draft, content });
  }

  function updateEntry(
    section: 'experiences' | 'projects',
    index: number,
    next: Partial<TailoredResumeEntry>
  ) {
    updateContent((content) => {
      content[section][index] = { ...content[section][index], ...next };
    });
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await updateTailoredResume(draft.id, draft.content);
      setDraft(updated);
      setResumes((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success('草稿已保存');
    } catch {
      toast.error('草稿保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!draft) return;
    setApproving(true);
    try {
      const attachToApplication = Boolean(draft.application_id);
      const approved = await approveTailoredResume(
        draft.id,
        attachToApplication,
        draft.content
      );
      setDraft(approved);
      setResumes((current) =>
        current.map((item) => (item.id === approved.id ? approved : item))
      );
      toast.success(
        attachToApplication ? 'DOCX已生成并绑定投递' : 'DOCX已生成'
      );
    } catch {
      toast.error('确认失败，请先处理事实校验问题');
    } finally {
      setApproving(false);
    }
  }

  async function handleDownload(resume: TailoredResume) {
    try {
      await downloadTailoredResume(resume);
    } catch {
      toast.error('下载失败');
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-fg0 text-2xl font-bold">定制简历</h1>
            <p className="text-muted mt-1 text-sm">
              母版：当前Profile简历 · 输出：DOCX · 提交前人工确认
            </p>
          </div>
          {draft && (
            <span className="bg-bg2 text-muted rounded px-2.5 py-1 text-xs">
              {draft.status === 'approved' ? '已确认' : '草稿'}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-tertiary bg-secondary border p-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label
                  htmlFor="resume-company"
                  className="text-muted mb-1 block text-sm"
                >
                  公司
                </label>
                <input
                  id="resume-company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="bg-bg2 text-fg1 focus:ring-accent w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="resume-role"
                  className="text-muted mb-1 block text-sm"
                >
                  岗位
                </label>
                <input
                  id="resume-role"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  className="bg-bg2 text-fg1 focus:ring-accent w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="resume-jd"
                  className="text-muted mb-1 block text-sm"
                >
                  岗位JD
                </label>
                <textarea
                  id="resume-jd"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={16}
                  className="bg-bg2 text-fg1 focus:ring-accent w-full resize-y rounded px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={generating}
                className="bg-accent text-bg0 hover:bg-accent-bright flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i
                  className={`bi-${generating ? 'arrow-repeat animate-spin' : 'stars'}`}
                />
                {generating ? '生成中...' : '生成草稿'}
              </button>
            </form>

            <div className="border-tertiary mt-6 border-t pt-4">
              <h2 className="text-fg1 mb-3 text-sm font-semibold">历史版本</h2>
              {loading ? (
                <p className="text-muted text-sm">加载中...</p>
              ) : resumes.length === 0 ? (
                <p className="text-muted text-sm">暂无版本</p>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      type="button"
                      onClick={() => setDraft(resume)}
                      className={`border-tertiary w-full cursor-pointer border px-3 py-2 text-left ${
                        draft?.id === resume.id
                          ? 'bg-bg3'
                          : 'bg-bg1 hover:bg-bg2'
                      }`}
                    >
                      <span className="text-fg1 block truncate text-sm font-medium">
                        {resume.company ? `${resume.company} · ` : ''}
                        {resume.job_title}
                      </span>
                      <span className="text-muted mt-1 block text-xs">
                        {resume.status === 'approved' ? '已确认' : '草稿'} ·{' '}
                        {new Date(resume.created_at).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            {!draft ? (
              <div className="border-tertiary text-muted flex min-h-96 items-center justify-center border border-dashed">
                <div className="text-center">
                  <i className="bi-file-earmark-person mb-3 block text-3xl" />
                  <p>选择历史版本或生成新草稿</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <section className="border-tertiary border-b pb-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-fg0 text-lg font-semibold">JD匹配</h2>
                    <span className="text-muted text-xs">
                      来源：{draft.source_resume_filename || '结构化Profile'}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {draft.jd_analysis.requirements.map((requirement) => (
                      <div
                        key={requirement.key}
                        className="border-tertiary bg-secondary border px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-fg1 text-sm font-medium">
                            {requirement.label}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${COVERAGE_CLASS[requirement.coverage]}`}
                          >
                            {COVERAGE_LABEL[requirement.coverage]}
                          </span>
                        </div>
                        <p className="text-muted mt-1 line-clamp-2 text-xs">
                          {requirement.evidence.join('；') ||
                            '母版中没有直接证据'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label
                    htmlFor="resume-summary"
                    className="text-fg1 mb-2 block font-semibold"
                  >
                    个人概述
                  </label>
                  <textarea
                    id="resume-summary"
                    value={draft.content.summary}
                    disabled={draft.status !== 'draft'}
                    onChange={(event) =>
                      updateContent((content) => {
                        content.summary = event.target.value;
                      })
                    }
                    rows={3}
                    className="border-tertiary bg-bg1 text-fg1 focus:ring-accent w-full border px-3 py-2 focus:ring-1 focus:outline-none disabled:opacity-75"
                  />
                </section>

                <section>
                  <label
                    htmlFor="resume-skills"
                    className="text-fg1 mb-2 block font-semibold"
                  >
                    核心技能
                  </label>
                  <textarea
                    id="resume-skills"
                    value={draft.content.core_skills.join('、')}
                    disabled={draft.status !== 'draft'}
                    onChange={(event) =>
                      updateContent((content) => {
                        content.core_skills = event.target.value
                          .split(/[、,，\n]/)
                          .map((item) => item.trim())
                          .filter(Boolean);
                      })
                    }
                    rows={2}
                    className="border-tertiary bg-bg1 text-fg1 focus:ring-accent w-full border px-3 py-2 focus:ring-1 focus:outline-none disabled:opacity-75"
                  />
                </section>

                {(['experiences', 'projects'] as const).map((section) => (
                  <section key={section}>
                    <h2 className="text-fg1 mb-3 font-semibold">
                      {section === 'experiences' ? '实习经历' : '项目经历'}
                    </h2>
                    <div className="divide-tertiary border-tertiary divide-y border-y">
                      {draft.content[section].map((entry, index) => (
                        <div key={entry.source_id} className="py-4">
                          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <span className="text-fg1 font-semibold">
                                {entry.heading}
                              </span>
                              {entry.subheading && (
                                <span className="text-muted ml-2 text-sm">
                                  {entry.subheading}
                                </span>
                              )}
                            </div>
                            <span className="text-muted text-xs">
                              {entry.period}
                            </span>
                          </div>
                          <textarea
                            aria-label={`${entry.heading}要点`}
                            value={entry.bullets.join('\n')}
                            disabled={draft.status !== 'draft'}
                            onChange={(event) =>
                              updateEntry(section, index, {
                                bullets: event.target.value
                                  .split('\n')
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                            rows={Math.max(2, entry.bullets.length)}
                            className="border-tertiary bg-bg1 text-fg1 focus:ring-accent w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-75"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <section>
                  <h2 className="text-fg1 mb-3 font-semibold">教育经历</h2>
                  <div className="divide-tertiary border-tertiary divide-y border-y">
                    {draft.content.education.map((item) => (
                      <div
                        key={item.source_id}
                        className="flex flex-wrap justify-between gap-2 py-3"
                      >
                        <div>
                          <span className="text-fg1 font-semibold">
                            {item.institution}
                          </span>
                          <span className="text-muted ml-2 text-sm">
                            {item.field_of_study} · {item.degree}
                          </span>
                        </div>
                        <span className="text-muted text-xs">
                          {item.period}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label
                    htmlFor="resume-additional"
                    className="text-fg1 mb-2 block font-semibold"
                  >
                    其他
                  </label>
                  <textarea
                    id="resume-additional"
                    value={draft.content.additional.join('\n')}
                    disabled={draft.status !== 'draft'}
                    onChange={(event) =>
                      updateContent((content) => {
                        content.additional = event.target.value
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean);
                      })
                    }
                    rows={Math.max(2, draft.content.additional.length)}
                    className="border-tertiary bg-bg1 text-fg1 focus:ring-accent w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-75"
                  />
                </section>

                {draft.validation.errors.length > 0 && (
                  <div className="border-red-bright bg-red-bright/10 text-red-bright border px-4 py-3 text-sm">
                    {draft.validation.errors.join('；')}
                  </div>
                )}
                {draft.validation.warnings.length > 0 && (
                  <div className="border-yellow bg-yellow/10 text-yellow border px-4 py-3 text-sm">
                    {draft.validation.warnings.join('；')}
                  </div>
                )}

                <div className="border-tertiary flex flex-wrap justify-end gap-2 border-t pt-4">
                  {draft.status === 'draft' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-fg1 hover:bg-bg2 flex cursor-pointer items-center gap-2 rounded px-4 py-2 disabled:opacity-50"
                      >
                        <i className="bi-save" />
                        {saving ? '保存中...' : '保存草稿'}
                      </button>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approving}
                        className="bg-accent text-bg0 hover:bg-accent-bright flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-medium disabled:opacity-50"
                      >
                        <i className="bi-check2-circle" />
                        {approving ? '生成中...' : '确认并生成DOCX'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(draft)}
                      className="bg-accent text-bg0 hover:bg-accent-bright flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-medium"
                    >
                      <i className="bi-download" />
                      下载DOCX
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
