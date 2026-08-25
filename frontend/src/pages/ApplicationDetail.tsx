import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApplication, deleteApplication } from '../lib/applications';
import { deleteRound } from '../lib/rounds';
import {
  mergeApplicationRoundMedia,
  preserveApplicationRounds,
  removeApplicationRound,
  upsertApplicationRound,
} from '../lib/applicationDetailState';
import type { Application, Round } from '../lib/types';
import { getStatusColor } from '../lib/statusColors';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToastContext } from '../contexts/ToastContext';
import RoundForm from '../components/RoundForm';
import RoundCard from '../components/RoundCard';
import DocumentSection from '../components/DocumentSection';
import HistoryViewer from '../components/application/HistoryViewer';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import ApplicationModal from '../components/ApplicationModal';
import RecruitmentEventForm from '../components/RecruitmentEventForm';
import RecruitmentEventList from '../components/RecruitmentEventList';
import {
  priorityLabel,
  statusLabel,
} from '../lib/recruitmentLabels';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const colors = useThemeColors();
  const toast = useToastContext();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  const loadApplication = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');
    try {
      const data = await getApplication(id!);
      setApplication(data);
    } catch {
      const errorMsg = '无法加载投递详情';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  async function handleDelete() {
    if (!confirm('确认删除这条投递记录？')) return;
    try {
      await deleteApplication(id!);
      toast.success('投递记录已删除');
      navigate('/applications');
    } catch {
      const errorMsg = '删除投递记录失败';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function handleDocumentUpdate(updated: Application) {
    setApplication((prev) => preserveApplicationRounds(prev, updated));
  }

  async function handleDeleteRound(roundId: string) {
    if (!confirm('确认删除本轮面试？')) return;
    try {
      await deleteRound(roundId);

      setApplication((prev) => removeApplicationRound(prev, roundId));
      toast.success('面试记录已删除');
    } catch {
      const errorMsg = '删除面试记录失败';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function handleRoundSaved(savedRound: Round) {
    setShowRoundForm(false);
    setEditingId(null);

    setApplication((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        rounds: upsertApplicationRound(prev.rounds, savedRound),
      };
    });
  }

  async function handleMediaChange(roundId: string) {
    try {
      const updatedApplication = await getApplication(id!);

      setApplication((prev) =>
        mergeApplicationRoundMedia(prev, updatedApplication, roundId)
      );
    } catch {
      const errorMsg = '刷新附件失败';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted">正在加载...</div>
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-red-bright">未找到投递记录</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            to="/applications"
            className="text-accent hover:text-accent-bright cursor-pointer transition-all duration-200 ease-in-out"
          >
            &larr; 返回投递记录
          </Link>
        </div>

        {error && (
          <div className="bg-red-bright/20 border-red-bright text-red-bright mb-6 rounded border px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-secondary mb-6 rounded-lg p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-primary text-2xl font-bold">
                  {application.company}
                </h1>
                {application.source && (
                  <span className="bg-bg2 text-fg1 inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium">
                    <i className="bi-link-45deg icon-xs"></i>
                    {application.source}
                  </span>
                )}
              </div>
              <p className="text-secondary text-xl">{application.job_title}</p>
              {application.location && (
                <p className="text-muted mt-1 flex items-center gap-1 text-sm">
                  <i className="bi-geo-alt icon-sm"></i>
                  {application.location}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${getStatusColor(application.status.name, colors, application.status.color)}20`,
                  color: getStatusColor(
                    application.status.name,
                    colors,
                    application.status.color
                  ),
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: getStatusColor(
                      application.status.name,
                      colors,
                      application.status.color
                    ),
                  }}
                />
                {statusLabel(application.status.name)}
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted">投递日期：</span>
              <span className="text-primary ml-2">
                {formatDate(application.applied_at)}
              </span>
            </div>
            <div>
              <span className="text-muted">最近更新：</span>
              <span className="text-primary ml-2">
                {formatDateTime(application.updated_at)}
              </span>
            </div>
          </div>

          <div className="border-tertiary mb-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted text-xs">招聘批次</p>
              <p className="text-primary mt-1">
                {application.recruitment_batch}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">目标方向</p>
              <p className="text-primary mt-1">
                {application.target_track || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">公司规模</p>
              <p className="text-primary mt-1">
                {application.company_scale || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">优先级</p>
              <p className="text-primary mt-1">
                {priorityLabel(application.priority)}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">投递截止</p>
              <p className="text-primary mt-1">
                {formatDate(application.deadline)}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">投递渠道</p>
              <p className="text-primary mt-1">
                {application.application_channel || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">企业类型</p>
              <p className="text-primary mt-1">
                {application.company_type || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">内推信息</p>
              <p className="text-primary mt-1">
                {application.referral_code || '-'}
              </p>
            </div>
          </div>

          {application.notes && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 text-sm">投递备注</h3>
              <p className="text-primary whitespace-pre-wrap">
                {application.notes}
              </p>
            </div>
          )}

          {application.job_url && (
            <div className="mb-4">
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-bright cursor-pointer text-sm transition-all duration-200 ease-in-out"
              >
                打开岗位页面 &rarr;
              </a>
            </div>
          )}

          {/* Job Description - styled like job leads */}
          {application.job_description && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                <i className="bi-file-text icon-sm"></i>
                岗位描述
              </h3>
              <div className="text-primary text-sm break-words whitespace-pre-wrap">
                {application.job_description}
              </div>
            </div>
          )}

          {/* Salary Information */}
          {(application.salary_min || application.salary_max) && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                <i className="bi-currency-dollar icon-sm"></i>
                薪资范围
              </h3>
              <p className="text-primary font-medium">
                {application.salary_currency || 'USD'}{' '}
                {application.salary_min?.toLocaleString() || '???'}
                {' - '}
                {application.salary_max?.toLocaleString() || '???'}
              </p>
            </div>
          )}

          {/* Recruiter Information */}
          {(application.recruiter_name ||
            application.recruiter_title ||
            application.recruiter_linkedin_url) && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                <i className="bi-person icon-sm"></i>
                招聘联系人
              </h3>
              <div className="space-y-1">
                {application.recruiter_name && (
                  <p className="text-primary font-medium">
                    {application.recruiter_name}
                  </p>
                )}
                {application.recruiter_title && (
                  <p className="text-secondary text-sm">
                    {application.recruiter_title}
                  </p>
                )}
                {application.recruiter_linkedin_url && (
                  <a
                    href={application.recruiter_linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-bright flex cursor-pointer items-center gap-1 text-sm transition-all duration-200 ease-in-out"
                  >
                    <i className="bi-linkedin icon-sm"></i>
                    打开联系页面
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Requirements - Must Have */}
          {application.requirements_must_have &&
            application.requirements_must_have.length > 0 && (
              <div className="bg-bg2 mb-4 rounded-lg p-4">
                <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                  <i className="bi-check-circle icon-sm"></i>
                  必备要求
                </h3>
                <ul className="text-primary list-inside list-disc space-y-1">
                  {application.requirements_must_have.map((req) => (
                    <li key={req} className="text-sm">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Requirements - Nice to Have */}
          {application.requirements_nice_to_have &&
            application.requirements_nice_to_have.length > 0 && (
              <div className="bg-bg2 mb-4 rounded-lg p-4">
                <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                  <i className="bi-star icon-sm"></i>
                  加分项
                </h3>
                <ul className="text-primary list-inside list-disc space-y-1">
                  {application.requirements_nice_to_have.map((req) => (
                    <li key={req} className="text-sm">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Skills */}
          {application.skills && application.skills.length > 0 && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                <i className="bi-lightning icon-sm"></i>
                技能关键词
              </h3>
              <div className="flex flex-wrap gap-2">
                {application.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-bg3 text-fg1 inline-flex items-center rounded px-2 py-1 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Range */}
          {(application.years_experience_min !== null ||
            application.years_experience_max !== null) && (
            <div className="bg-bg2 mb-4 rounded-lg p-4">
              <h3 className="text-muted mb-2 flex items-center gap-1.5 text-sm">
                <i className="bi-clock-history icon-sm"></i>
                经验要求
              </h3>
              <p className="text-primary font-medium">
                {application.years_experience_min ?? '?'}-
                {application.years_experience_max ?? '?'} years
              </p>
            </div>
          )}

          <div className="border-tertiary flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-fg1 hover:bg-bg2 hover:text-fg0 flex cursor-pointer items-center gap-1.5 rounded bg-transparent px-3 py-1.5 text-sm transition-all duration-200 ease-in-out"
            >
              <i className="bi-pencil icon-sm"></i>
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="text-red hover:bg-bg2 hover:text-red-bright flex cursor-pointer items-center gap-1.5 rounded bg-transparent px-3 py-1.5 text-sm transition-all duration-200 ease-in-out"
            >
              <i className="bi-trash icon-sm"></i>
              删除
            </button>
          </div>
        </div>

        <div className="bg-secondary mb-6 rounded-lg p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-primary text-lg font-semibold">招聘流程</h2>
              <p className="text-muted mt-1 text-xs">
                笔试、测评、面试、体检、背调和签约统一记录
              </p>
            </div>
            <button
              onClick={() => setShowEventForm((visible) => !visible)}
              className="bg-accent text-bg0 hover:bg-accent-bright inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
            >
              <i
                className={`bi ${showEventForm ? 'bi-x-lg' : 'bi-plus-lg'}`}
              />
              {showEventForm ? '取消' : '新增节点'}
            </button>
          </div>

          {showEventForm && (
            <div className="mb-4">
              <RecruitmentEventForm
                applicationId={id!}
                onSaved={() => {
                  setShowEventForm(false);
                  loadApplication();
                }}
                onCancel={() => setShowEventForm(false)}
              />
            </div>
          )}

          <RecruitmentEventList
            events={application.recruitment_events || []}
            onChange={loadApplication}
          />
        </div>

        <div className="mb-6">
          <DocumentSection
            application={application}
            onUpdate={handleDocumentUpdate}
          />
        </div>

        <div className="mb-6">
          <HistoryViewer applicationId={id!} />
        </div>

        <div className="bg-secondary rounded-lg p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-primary text-lg font-semibold">
              面试深度复盘
            </h2>
            {application.rounds && application.rounds.length > 0 && (
              <button
                onClick={() => setShowRoundForm(true)}
                className="bg-accent text-bg0 hover:bg-accent-bright cursor-pointer rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out"
              >
                <i className="bi bi-plus-lg mr-2" />
                新增面试
              </button>
            )}
          </div>

          {showRoundForm && (
            <div className="mb-4">
              <RoundForm
                applicationId={id!}
                onSave={handleRoundSaved}
                onCancel={() => setShowRoundForm(false)}
              />
            </div>
          )}

          {application.rounds && application.rounds.length > 0 ? (
            <div className="space-y-4">
              {application.rounds.map((round) =>
                round.id === editingId ? (
                  <RoundForm
                    key={round.id}
                    round={round}
                    applicationId={id!}
                    onSave={handleRoundSaved}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <RoundCard
                    key={round.id}
                    round={round}
                    onEdit={() => setEditingId(round.id)}
                    onDelete={() => handleDeleteRound(round.id)}
                    onMediaChange={() => handleMediaChange(round.id)}
                  />
                )
              )}
            </div>
          ) : !showRoundForm ? (
            <EmptyState
              message="暂无面试复盘"
              icon="bi-calendar-x"
              action={{
                label: '新增面试',
                onClick: () => setShowRoundForm(true),
              }}
            />
          ) : null}
        </div>
      </div>
      {application && (
        <ApplicationModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadApplication();
          }}
          application={application}
        />
      )}
    </Layout>
  );
}
