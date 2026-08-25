import { useEffect, useRef, useState } from 'react';
import { createApplication, updateApplication } from '../lib/applications';
import {
  buildCreateApplicationPayload,
  buildUpdateApplicationPayload,
  getApplicationModalDefaults,
  getApplicationModalValues,
  isValidApplicationUrl,
  normalizeApplicationUrl,
  type ApplicationModalFormValues,
} from '../lib/applicationModalForm';
import { listStatuses } from '../lib/settings';
import { statusLabel } from '../lib/recruitmentLabels';
import type {
  Status,
  Application,
  ApplicationCreate,
  ApplicationUpdate,
} from '../lib/types';
import Dropdown from './Dropdown';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (applicationId: string) => void;
  application?: Application; // undefined = create, defined = edit
  prefill?: Partial<ApplicationModalFormValues>;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  application,
  prefill,
}: ApplicationModalProps) {
  const isEditing = Boolean(application);
  const initializedFormKeyRef = useRef<string | null>(null);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrlError, setJobUrlError] = useState('');
  const [statusId, setStatusId] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('CNY');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterTitle, setRecruiterTitle] = useState('');
  const [recruiterLinkedinUrl, setRecruiterLinkedinUrl] = useState('');
  const [requirementsMustHave, setRequirementsMustHave] = useState('');
  const [requirementsNiceToHave, setRequirementsNiceToHave] = useState('');
  const [source, setSource] = useState('');
  const [recruitmentCycle, setRecruitmentCycle] = useState('');
  const [recruitmentBatch, setRecruitmentBatch] = useState('');
  const [targetTrack, setTargetTrack] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyScale, setCompanyScale] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [deadline, setDeadline] = useState('');
  const [applicationChannel, setApplicationChannel] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [notes, setNotes] = useState('');

  function applyFormValues(
    values: ReturnType<typeof getApplicationModalValues>
  ) {
    setCompany(values.company);
    setJobTitle(values.jobTitle);
    setJobDescription(values.jobDescription);
    setJobUrl(values.jobUrl);
    setLocation(values.location);
    setStatusId(values.statusId);
    setAppliedAt(values.appliedAt);
    setSalaryMin(values.salaryMin);
    setSalaryMax(values.salaryMax);
    setSalaryCurrency(values.salaryCurrency);
    setRecruiterName(values.recruiterName);
    setRecruiterTitle(values.recruiterTitle);
    setRecruiterLinkedinUrl(values.recruiterLinkedinUrl);
    setRequirementsMustHave(values.requirementsMustHave);
    setRequirementsNiceToHave(values.requirementsNiceToHave);
    setSource(values.source);
    setRecruitmentCycle(values.recruitmentCycle);
    setRecruitmentBatch(values.recruitmentBatch);
    setTargetTrack(values.targetTrack);
    setCompanyType(values.companyType);
    setCompanyScale(values.companyScale);
    setPriority(values.priority);
    setDeadline(values.deadline);
    setApplicationChannel(values.applicationChannel);
    setReferralCode(values.referralCode);
    setNotes(values.notes);
  }

  function handleJobUrlBlur() {
    if (jobUrl) {
      const normalized = normalizeApplicationUrl(jobUrl);
      setJobUrl(normalized);
      if (!isValidApplicationUrl(normalized)) {
        setJobUrlError('请输入有效链接');
      } else {
        setJobUrlError('');
      }
    }
  }

  // Load statuses on mount
  useEffect(() => {
    async function loadStatuses() {
      try {
        const data = await listStatuses();
        setStatuses(data);
        if (!application) {
          const defaultStatusId = getApplicationModalDefaults(data).statusId;
          setStatusId((current) => current || defaultStatusId);
        }
      } catch {
        setError('无法加载投递阶段');
      }
    }
    loadStatuses();
  }, [application]);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (!isOpen) {
      initializedFormKeyRef.current = null;
      return;
    }

    const formKey =
      isEditing && application
        ? application.id
        : `create:${prefill?.company || ''}:${prefill?.jobUrl || ''}`;
    if (initializedFormKeyRef.current === formKey) {
      return;
    }

    setError('');
    setJobUrlError('');

    if (isEditing && application) {
      applyFormValues(getApplicationModalValues(application));
    } else {
      applyFormValues({
        ...getApplicationModalDefaults(statuses),
        ...prefill,
      });
    }

    initializedFormKeyRef.current = formKey;
  }, [
    isOpen,
    isEditing,
    application,
    statuses,
    prefill?.company,
    prefill?.jobUrl,
  ]);

  // Escape key handler
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !jobTitle || !statusId) {
      setError('请填写公司、岗位和当前阶段');
      return;
    }

    const normalizedUrl = normalizeApplicationUrl(jobUrl);
    if (normalizedUrl && !isValidApplicationUrl(normalizedUrl)) {
      setJobUrlError('请输入有效链接');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const values = {
        company,
        jobTitle,
        jobDescription,
        jobUrl: normalizedUrl,
        location,
        statusId,
        appliedAt,
        salaryMin,
        salaryMax,
        salaryCurrency,
        recruiterName,
        recruiterTitle,
        recruiterLinkedinUrl,
        requirementsMustHave,
        requirementsNiceToHave,
        source,
        recruitmentCycle,
        recruitmentBatch,
        targetTrack,
        companyType,
        companyScale,
        priority,
        deadline,
        applicationChannel,
        referralCode,
        notes,
      };

      if (isEditing && application) {
        const data: ApplicationUpdate = buildUpdateApplicationPayload(values);
        await updateApplication(application.id, data);
        onSuccess(application.id);
        onClose();
      } else {
        const data: ApplicationCreate = buildCreateApplicationPayload(values);
        const created = await createApplication(data);
        onSuccess(created.id);
        onClose();
      }
    } catch {
      setError('保存投递记录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-bg0/80 fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-bg1 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-tertiary flex flex-shrink-0 items-center justify-between border-b p-4">
          <h3 id="modal-title" className="text-primary font-medium">
            {isEditing ? '编辑投递' : '新增投递'}
          </h3>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="text-fg1 hover:bg-bg2 hover:text-fg0 cursor-pointer rounded p-2 transition-all duration-200 ease-in-out"
          >
            <i className="bi bi-x-lg icon-xl" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto p-6"
        >
          {error && (
            <div className="bg-red-bright/20 border-red-bright text-red-bright rounded border px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="company"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                公司 <span className="text-red-bright">*</span>
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="job-title"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                岗位 <span className="text-red-bright">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                城市
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="杭州"
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="application-status"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                当前阶段 <span className="text-red-bright">*</span>
              </label>
              <Dropdown
                id="application-status"
                options={[
                  { value: '', label: '选择阶段' },
                  ...statuses.map((status) => ({
                    value: status.id,
                    label: statusLabel(status.name),
                  })),
                ]}
                value={statusId}
                onChange={(value) => setStatusId(value)}
                placeholder="选择阶段"
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="applied-date"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                投递日期
              </label>
              <input
                id="applied-date"
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                投递截止
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-bg2 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="recruitment-batch"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                招聘批次
              </label>
              <Dropdown
                id="recruitment-batch"
                options={['提前批', '正式批', '补录', '日常实习'].map(
                  (value) => ({ value, label: value })
                )}
                value={recruitmentBatch}
                onChange={setRecruitmentBatch}
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="target-track"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                目标方向
              </label>
              <Dropdown
                id="target-track"
                options={[
                  'Agent 开发',
                  '大模型评测',
                  '大模型应用',
                  '大模型算法',
                  '具身数据评估',
                  'AI Infra',
                ].map((value) => ({ value, label: value }))}
                value={targetTrack}
                onChange={setTargetTrack}
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="company-scale"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                公司规模
              </label>
              <Dropdown
                id="company-scale"
                options={['初创', '成长型', '中型', '大型'].map((value) => ({
                  value,
                  label: value,
                }))}
                value={companyScale}
                onChange={setCompanyScale}
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="company-type"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                企业类型
              </label>
              <Dropdown
                id="company-type"
                options={['民营', '国企', '央企', '外企', '事业单位'].map(
                  (value) => ({ value, label: value })
                )}
                value={companyType}
                onChange={setCompanyType}
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                优先级
              </label>
              <Dropdown
                id="priority"
                options={[
                  { value: 'high', label: '重点' },
                  { value: 'medium', label: '正常' },
                  { value: 'low', label: '备选' },
                ]}
                value={priority}
                onChange={(value) =>
                  setPriority(value as 'high' | 'medium' | 'low')
                }
                containerBackground="bg1"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="job-url"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                岗位链接
              </label>
              <input
                id="job-url"
                type="text"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setJobUrlError('');
                }}
                onBlur={handleJobUrlBlur}
                placeholder="企业官网岗位地址"
                className={`bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none ${
                  jobUrlError ? 'border-red-bright border' : ''
                }`}
              />
              {jobUrlError && (
                <p className="text-red-bright mt-1 text-sm">{jobUrlError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="salary-min"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                月薪下限（K）
              </label>
              <input
                id="salary-min"
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="例如 20"
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="salary-max"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                月薪上限（K）
              </label>
              <input
                id="salary-max"
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="例如 35"
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="salary-currency"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                币种
              </label>
              <Dropdown
                id="salary-currency"
                options={[
                  { value: 'CNY', label: 'CNY' },
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'CAD', label: 'CAD' },
                  { value: 'AUD', label: 'AUD' },
                ]}
                value={salaryCurrency}
                onChange={(value) => setSalaryCurrency(value)}
                placeholder="币种"
                containerBackground="bg1"
                size="xs"
              />
            </div>

            <div>
              <label
                htmlFor="application-channel"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                投递渠道
              </label>
              <Dropdown
                id="application-channel"
                options={['官网', '内推', '招聘平台', '宣讲会', '其他'].map(
                  (value) => ({ value, label: value })
                )}
                value={applicationChannel}
                onChange={setApplicationChannel}
                containerBackground="bg1"
              />
            </div>

            <div>
              <label
                htmlFor="referral-code"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                内推码或联系人
              </label>
              <input
                id="referral-code"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-tertiary border-t pt-4">
            <h4 className="text-muted mb-3 text-sm font-semibold">
              招聘联系人（选填）
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="recruiter-name"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  联系人姓名
                </label>
                <input
                  id="recruiter-name"
                  type="text"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  placeholder="姓名"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="recruiter-title"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  联系人职位
                </label>
                <input
                  id="recruiter-title"
                  type="text"
                  value={recruiterTitle}
                  onChange={(e) => setRecruiterTitle(e.target.value)}
                  placeholder="招聘经理、内推人等"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="recruiter-linkedin"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  联系链接
                </label>
                <input
                  id="recruiter-linkedin"
                  type="text"
                  value={recruiterLinkedinUrl}
                  onChange={(e) => setRecruiterLinkedinUrl(e.target.value)}
                  placeholder="主页或即时通讯链接"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-tertiary border-t pt-4">
            <h4 className="text-muted mb-3 text-sm font-semibold">
              岗位要求（选填）
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="requirements-must"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  必备要求
                </label>
                <textarea
                  id="requirements-must"
                  value={requirementsMustHave}
                  onChange={(e) => setRequirementsMustHave(e.target.value)}
                  rows={3}
                  placeholder="每行一项，例如 Python、RAG、Agent 框架"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full resize-y rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="requirements-nice"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  加分项
                </label>
                <textarea
                  id="requirements-nice"
                  value={requirementsNiceToHave}
                  onChange={(e) => setRequirementsNiceToHave(e.target.value)}
                  rows={3}
                  placeholder="每行一项，例如开源项目、评测经验"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full resize-y rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="source"
                  className="text-muted mb-1 block text-sm font-semibold"
                >
                  信息来源
                </label>
                <input
                  id="source"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="公司官网、公众号、校招群等"
                  className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="job-description"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                岗位描述
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full resize-y rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="application-notes"
                className="text-muted mb-1 block text-sm font-semibold"
              >
                投递备注
              </label>
              <textarea
                id="application-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="记录岗位判断、准备重点和待确认事项"
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full resize-y rounded px-3 py-2 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-tertiary flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-fg1 hover:bg-bg2 hover:text-fg0 cursor-pointer rounded-md bg-transparent px-4 py-2 transition-all duration-200 ease-in-out disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-bg0 hover:bg-accent-bright cursor-pointer rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out disabled:opacity-50"
            >
              <i
                className={`bi ${loading ? 'bi-hourglass-split' : 'bi-check-lg'} mr-2`}
              />
              {loading ? '保存中' : isEditing ? '保存' : '创建投递'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
