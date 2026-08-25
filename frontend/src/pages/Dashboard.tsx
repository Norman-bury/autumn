import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ApplicationModal from '../components/ApplicationModal';
import Layout from '../components/Layout';
import RecruitmentEventList from '../components/RecruitmentEventList';
import { listApplications } from '../lib/applications';
import { listRecruitmentEvents } from '../lib/recruitment';
import { priorityLabel, statusLabel } from '../lib/recruitmentLabels';
import type { Application, RecruitmentEvent } from '../lib/types';

const TERMINAL_STATUSES = new Set([
  'Accepted',
  'Rejected',
  'Withdrawn',
  'No Reply',
]);

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<RecruitmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [applicationData, eventData] = await Promise.all([
        listApplications({ page: 1, per_page: 100 }),
        listRecruitmentEvents({ status: 'pending' }),
      ]);
      setApplications(applicationData.items);
      setEvents(eventData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const active = applications.filter(
      (application) => !TERMINAL_STATUSES.has(application.status.name)
    ).length;
    const assessments = events.filter((event) =>
      ['assessment', 'written_test'].includes(event.event_type)
    ).length;
    const interviews = events.filter((event) =>
      ['interview', 'hr_interview'].includes(event.event_type)
    ).length;
    const offers = applications.filter((application) =>
      ['Offer', 'Accepted'].includes(application.status.name)
    ).length;

    return { active, assessments, interviews, offers };
  }, [applications, events]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => {
        const time = event.scheduled_at || event.deadline_at;
        return time && new Date(time).getTime() >= now;
      })
      .sort((a, b) => {
        const aTime = new Date(a.scheduled_at || a.deadline_at || 0).getTime();
        const bTime = new Date(b.scheduled_at || b.deadline_at || 0).getTime();
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [events]);

  const priorityApplications = applications
    .filter(
      (application) =>
        application.priority === 'high' &&
        !TERMINAL_STATUSES.has(application.status.name)
    )
    .slice(0, 5);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-accent mb-2 text-sm font-semibold">
              2027 届秋招 · 杭州
            </p>
            <h1 className="text-primary text-2xl font-bold">秋招总览</h1>
            <p className="text-secondary mt-2">
              目标方向：大模型评测、Agent 开发 · 中型公司优先
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent text-bg0 hover:bg-accent-bright inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-medium"
          >
            <i className="bi bi-plus-lg" />
            新增投递
          </button>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['进行中', metrics.active, 'bi-briefcase', 'text-blue-bright'],
            ['待测评', metrics.assessments, 'bi-clipboard-check', 'text-yellow-bright'],
            ['待面试', metrics.interviews, 'bi-people', 'text-orange-bright'],
            ['Offer', metrics.offers, 'bi-award', 'text-green-bright'],
          ].map(([label, value, icon, color]) => (
            <div
              key={String(label)}
              className="border-tertiary bg-secondary rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted text-sm">{label}</span>
                <i className={`bi ${icon} ${color} icon-md`} />
              </div>
              <div className="text-primary text-2xl font-bold">
                {loading ? '-' : value}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="bg-secondary rounded-lg px-5">
            <div className="border-tertiary flex items-center justify-between border-b py-4">
              <div>
                <h2 className="text-primary text-base font-semibold">
                  最近节点
                </h2>
                <p className="text-muted mt-1 text-xs">按计划时间升序</p>
              </div>
              <Link
                to="/schedule"
                className="text-accent hover:text-accent-bright text-sm"
              >
                全部日程
              </Link>
            </div>
            <RecruitmentEventList
              events={upcomingEvents}
              showApplication
              onChange={loadDashboard}
            />
          </section>

          <section className="bg-secondary rounded-lg px-5">
            <div className="border-tertiary flex items-center justify-between border-b py-4">
              <div>
                <h2 className="text-primary text-base font-semibold">
                  重点投递
                </h2>
                <p className="text-muted mt-1 text-xs">优先级为重点且未结束</p>
              </div>
              <Link
                to="/applications"
                className="text-accent hover:text-accent-bright text-sm"
              >
                全部记录
              </Link>
            </div>
            {priorityApplications.length > 0 ? (
              <div className="divide-tertiary divide-y">
                {priorityApplications.map((application) => (
                  <Link
                    key={application.id}
                    to={`/applications/${application.id}`}
                    className="hover:bg-bg2 -mx-2 flex items-center justify-between gap-3 px-2 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-primary truncate font-medium">
                        {application.company}
                      </p>
                      <p className="text-secondary mt-1 truncate text-sm">
                        {application.job_title}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-accent text-sm">
                        {statusLabel(application.status.name)}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        {priorityLabel(application.priority)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted py-10 text-center text-sm">
                暂无重点投递
              </div>
            )}
          </section>
        </div>

        <section className="border-tertiary mt-6 grid grid-cols-1 gap-0 overflow-hidden rounded-lg border md:grid-cols-3">
          <Link
            to="/company-portals"
            className="bg-bg1 hover:bg-bg2 border-tertiary flex items-center gap-3 border-b p-5 md:border-r md:border-b-0"
          >
            <i className="bi bi-building text-blue-bright icon-lg" />
            <div>
              <p className="text-primary font-medium">杭州企业入口</p>
              <p className="text-muted mt-1 text-xs">已核验的中型 AI 公司</p>
            </div>
          </Link>
          <Link
            to="/applications"
            className="bg-bg1 hover:bg-bg2 border-tertiary flex items-center gap-3 border-b p-5 md:border-r md:border-b-0"
          >
            <i className="bi bi-table text-yellow-bright icon-lg" />
            <div>
              <p className="text-primary font-medium">投递记录</p>
              <p className="text-muted mt-1 text-xs">筛选、排序与状态维护</p>
            </div>
          </Link>
          <Link
            to="/schedule"
            className="bg-bg1 hover:bg-bg2 flex items-center gap-3 p-5"
          >
            <i className="bi bi-calendar3 text-green-bright icon-lg" />
            <div>
              <p className="text-primary font-medium">流程日程</p>
              <p className="text-muted mt-1 text-xs">测评、面试和截止提醒</p>
            </div>
          </Link>
        </section>
      </div>

      <ApplicationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(applicationId) =>
          navigate(`/applications/${applicationId}`)
        }
      />
    </Layout>
  );
}
