import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getApplicationSources, listApplications } from '../lib/applications';
import type { ListParams } from '../lib/applications';
import { parsePositivePageParam } from '../lib/paginationParams';
import { listStatuses } from '../lib/settings';
import type { Application, Status } from '../lib/types';
import { getStatusColor } from '../lib/statusColors';
import { useThemeColors } from '../hooks/useThemeColors';
import { useToastContext } from '../contexts/ToastContext';
import {
  priorityLabel,
  statusLabel,
} from '../lib/recruitmentLabels';
import Layout from '../components/Layout';
import Dropdown from '../components/Dropdown';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ApplicationModal from '../components/ApplicationModal';
import Pagination from '../components/Pagination';

export default function Applications() {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const toast = useToastContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const page = parsePositivePageParam(searchParams.get('page'));
  const [perPage, setPerPage] = useState(25);
  const statusFilter = searchParams.get('status') || '';
  const sourceFilter = searchParams.get('source') || '';
  const search = searchParams.get('search') || '';
  const isFiltered = search || statusFilter || sourceFilter;

  const loadStatuses = useCallback(async () => {
    try {
      const data = await listStatuses();
      setStatuses(data);
    } catch {
      // statuses are optional for filtering
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: ListParams = { page, per_page: perPage };
      if (statusFilter) params.status_id = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (search) params.search = search;

      const data = await listApplications(params);
      setApplications(data.items);
      setTotal(data.total);
    } catch {
      const errorMsg = '无法加载投递记录';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, sourceFilter, search, toast]);

  const loadSources = useCallback(async () => {
    try {
      setSources(await getApplicationSources());
    } catch {
      setSources([]);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  function updateParams(updates: Record<string, string>) {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    if (
      updates.status !== undefined ||
      updates.search !== undefined ||
      updates.source !== undefined
    ) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  }

  const totalPages = Math.ceil(total / perPage);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-accent mb-2 text-sm font-semibold">
              2027 届秋招
            </p>
            <h1 className="text-primary text-2xl font-bold">投递记录</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent text-bg0 hover:bg-accent-bright cursor-pointer rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out"
          >
            <i className="bi bi-plus-lg mr-2" />
            新增投递
          </button>
        </div>

        <div className="bg-bg1 mb-6 rounded-lg p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1">
              <i className="bi-search icon-sm text-muted absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索公司或岗位"
                value={search}
                onChange={(e) => updateParams({ search: e.target.value })}
                className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded py-2 pr-9 pl-9 transition-all duration-200 ease-in-out focus:ring-1 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => updateParams({ search: '' })}
                  className="text-muted hover:text-fg1 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-in-out"
                  aria-label="Clear search"
                >
                  <i className="bi-x icon-sm" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Dropdown
                options={[
                  { value: '', label: '全部阶段' },
                  ...statuses.map((status) => ({
                    value: status.id,
                    label: statusLabel(status.name),
                  })),
                ]}
                value={statusFilter}
                onChange={(value) => updateParams({ status: value })}
                placeholder="全部阶段"
                size="xs"
                containerBackground="bg1"
              />
              <Dropdown
                options={[
                  { value: '', label: '全部来源' },
                  ...sources.map((source) => ({
                    value: source,
                    label: source,
                  })),
                ]}
                value={sourceFilter}
                onChange={(value) => updateParams({ source: value })}
                placeholder="全部来源"
                size="xs"
                containerBackground="bg1"
                disabled={sources.length === 0}
              />
              <Dropdown
                options={[
                  { value: '10', label: '10 / page' },
                  { value: '25', label: '25 / page' },
                  { value: '50', label: '50 / page' },
                  { value: '100', label: '100 / page' },
                ]}
                value={String(perPage)}
                onChange={(value) => {
                  setPerPage(Number(value));
                  updateParams({ page: '1' });
                }}
                placeholder="25 / page"
                size="xs"
                containerBackground="bg1"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-bright/20 border-red-bright text-red-bright mb-6 rounded border px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <Loading message="正在加载投递记录..." />
        ) : applications.length === 0 ? (
          isFiltered ? (
            <EmptyState
              message="没有符合筛选条件的投递"
              subMessage="调整关键词或清除筛选条件"
              icon="bi-search"
            />
          ) : (
            <EmptyState
              message="还没有投递记录"
              icon="bi-inbox"
              action={{
                label: '新增投递',
                onClick: () => setShowCreateModal(true),
              }}
            />
          )
        ) : (
          <>
            {/* Desktop table */}
            <div className="bg-secondary hidden overflow-hidden rounded-lg md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-tertiary border-b">
                    <th className="text-muted px-4 py-3 text-left text-xs font-bold tracking-wide uppercase">
                      公司
                    </th>
                    <th className="text-muted px-4 py-3 text-left text-xs font-bold tracking-wide uppercase">
                      岗位
                    </th>
                    <th className="text-muted px-4 py-3 text-left text-xs font-bold tracking-wide uppercase">
                      阶段
                    </th>
                    <th className="text-muted px-4 py-3 text-left text-xs font-bold tracking-wide uppercase">
                      方向
                    </th>
                    <th className="text-muted px-4 py-3 text-left text-xs font-bold tracking-wide uppercase">
                      截止日期
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => (
                    <tr
                      key={app.id}
                      className={`transition-colors duration-200 ${index < applications.length - 1 ? 'border-tertiary border-b' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/applications/${app.id}`}
                          className="text-fg1 hover:text-accent-bright font-medium transition-all duration-200 ease-in-out"
                        >
                          {app.company}
                        </Link>
                      </td>
                      <td className="text-primary px-4 py-3 text-sm">
                        {app.job_title}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${getStatusColor(app.status.name, colors, app.status.color)}20`,
                            color: getStatusColor(
                              app.status.name,
                              colors,
                              app.status.color
                            ),
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: getStatusColor(
                                app.status.name,
                                colors,
                                app.status.color
                              ),
                            }}
                          />
                          {statusLabel(app.status.name)}
                        </span>
                      </td>
                      <td className="text-secondary px-4 py-3 text-sm">
                        {app.target_track || '-'}
                      </td>
                      <td className="text-secondary px-4 py-3 text-sm">
                        {app.deadline ? formatDate(app.deadline) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="bg-secondary hover:bg-bg2 block cursor-pointer rounded-lg p-4 transition-all duration-200 ease-in-out"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-fg1 truncate font-medium">
                      {app.company}
                    </span>
                    <span
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: `${getStatusColor(app.status.name, colors, app.status.color)}20`,
                        color: getStatusColor(
                          app.status.name,
                          colors,
                          app.status.color
                        ),
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: getStatusColor(
                            app.status.name,
                            colors,
                            app.status.color
                          ),
                        }}
                      />
                      {statusLabel(app.status.name)}
                    </span>
                  </div>
                  <div className="text-primary mb-2 truncate text-sm">
                    {app.job_title}
                  </div>
                  <div className="text-secondary text-xs">
                    {app.target_track || '方向未标注'} ·{' '}
                    {priorityLabel(app.priority)}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                perPage={perPage}
                totalItems={total}
                onPageChange={(newPage) =>
                  updateParams({ page: String(newPage) })
                }
              />
            </div>
          </>
        )}
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
