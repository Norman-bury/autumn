import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ApplicationModal from '../components/ApplicationModal';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { listCompanyPortals } from '../lib/recruitment';
import type { CompanyPortal } from '../lib/types';

const CITIES = ['全部', '杭州', '北京', '上海', '深圳', '天津', '石家庄', '保定', '廊坊', '唐山', '邯郸', '秦皇岛', '任丘', '邢台', '张家口'];

const RECRUITMENT_STATUS_LABELS: Record<
  CompanyPortal['recruitment_status'],
  string
> = {
  open: '开放中',
  closing_soon: '即将截止',
  rolling: '滚动招聘',
  closed: '已截止',
  not_started: '未开启',
  needs_review: '待复核',
};

const RECRUITMENT_STATUS_STYLES: Record<
  CompanyPortal['recruitment_status'],
  string
> = {
  open: 'bg-green/15 text-green-bright',
  closing_soon: 'bg-yellow/15 text-yellow-bright',
  rolling: 'bg-blue/15 text-blue-bright',
  closed: 'bg-red/15 text-red-bright',
  not_started: 'bg-bg2 text-muted',
  needs_review: 'bg-bg2 text-muted',
};

export default function CompanyPortals() {
  const navigate = useNavigate();
  const [portals, setPortals] = useState<CompanyPortal[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<CompanyPortal | null>(
    null
  );
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('全部');
  const [mediumOnly, setMediumOnly] = useState(false);
  const [recruitmentStatus, setRecruitmentStatus] = useState<
    CompanyPortal['recruitment_status'] | ''
  >('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPortals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPortals(
        await listCompanyPortals({
          search: search || undefined,
          city: city === '全部' ? undefined : city,
          company_scale: mediumOnly ? '中型' : undefined,
          recruitment_status: recruitmentStatus || undefined,
        })
      );
    } catch {
      setError('无法加载企业入口');
    } finally {
      setLoading(false);
    }
  }, [city, mediumOnly, recruitmentStatus, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadPortals, 180);
    return () => window.clearTimeout(timer);
  }, [loadPortals]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-accent mb-2 text-sm font-semibold">
            多城市 · AI 方向
          </p>
          <h1 className="text-primary text-2xl font-bold">企业投递入口</h1>
          <p className="text-secondary mt-2">
            已逐条核对2027届校招岗位和投递入口，覆盖杭州、北京、上海、深圳、天津及河北。共收录
            {portals.length} 家企业。
          </p>
        </div>

        <div className="bg-bg1 mb-6 flex flex-col gap-3 rounded-lg p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <i className="bi bi-search text-muted absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索公司、行业或方向"
              className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded py-2 pr-3 pl-9 focus:ring-1 focus:outline-none"
            />
          </div>
          <select
            aria-label="城市筛选"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="bg-bg2 text-fg1 focus:ring-accent-bright rounded px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c === '全部' ? '全部城市' : c}</option>
            ))}
          </select>
          <label className="text-primary flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mediumOnly}
              onChange={(event) => setMediumOnly(event.target.checked)}
              className="accent-[var(--accent)]"
            />
            只看中型公司
          </label>
          <select
            aria-label="招聘状态"
            value={recruitmentStatus}
            onChange={(event) =>
              setRecruitmentStatus(
                event.target.value as CompanyPortal['recruitment_status'] | ''
              )
            }
            className="bg-bg2 text-fg1 focus:ring-accent-bright rounded px-3 py-2 text-sm focus:ring-1 focus:outline-none"
          >
            <option value="">全部状态</option>
            <option value="open">开放中</option>
            <option value="closing_soon">即将截止</option>
            <option value="rolling">滚动招聘</option>
            <option value="not_started">未开启</option>
          </select>
        </div>

        {error && (
          <div className="border-red text-red-bright mb-6 rounded border px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <Loading message="正在核对企业入口..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {portals.map((portal) => (
              <article
                key={portal.id}
                className="border-tertiary bg-secondary rounded-lg border p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-primary truncate text-lg font-semibold">
                      {portal.company_name}
                    </h2>
                    <p className="text-secondary mt-1 text-sm">
                      {portal.industry} · {portal.company_scale} · {portal.city}
                      {portal.company_type !== '民营' && (
                        <span className="ml-1 text-accent">· {portal.company_type}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`${RECRUITMENT_STATUS_STYLES[portal.recruitment_status]} flex-shrink-0 rounded px-2 py-1 text-xs`}
                  >
                    {RECRUITMENT_STATUS_LABELS[portal.recruitment_status]}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {portal.focus_roles.map((role) => (
                    <span
                      key={role}
                      className="bg-bg2 text-fg1 rounded px-2 py-1 text-xs"
                    >
                      {role}
                    </span>
                  ))}
                </div>

                {portal.notes && (
                  <p className="text-secondary mb-4 text-sm">{portal.notes}</p>
                )}

                <div className="text-muted mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>核验日期：{portal.verified_at || '待核验'}</span>
                  <span>
                    投递截止：{portal.application_deadline || '官网未注明'}
                  </span>
                </div>

                <div className="border-tertiary flex flex-wrap items-center gap-2 border-t pt-4">
                  <a
                    href={portal.campus_url || portal.careers_url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-accent text-bg0 hover:bg-accent-bright inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium"
                  >
                    <i className="bi bi-box-arrow-up-right" />
                    打开投递入口
                  </a>
                  <button
                    onClick={() => setSelectedPortal(portal)}
                    className="text-fg1 hover:bg-bg2 inline-flex items-center gap-2 rounded px-3 py-2 text-sm"
                  >
                    <i className="bi bi-plus-lg" />
                    创建投递
                  </button>
                  {portal.evidence_url && (
                    <a
                      href={portal.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:text-primary ml-auto inline-flex items-center gap-1 px-2 py-2 text-xs"
                    >
                      <i className="bi bi-shield-check" />
                      核验依据
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && portals.length === 0 && (
          <div className="border-tertiary text-muted rounded-lg border border-dashed px-4 py-12 text-center">
            没有符合当前筛选的企业
          </div>
        )}
      </div>

      <ApplicationModal
        isOpen={selectedPortal !== null}
        onClose={() => setSelectedPortal(null)}
        onSuccess={(applicationId) =>
          navigate(`/applications/${applicationId}`)
        }
        prefill={
          selectedPortal
            ? {
                company: selectedPortal.company_name,
                jobUrl: selectedPortal.campus_url || selectedPortal.careers_url,
                location: selectedPortal.city,
                companyType: selectedPortal.company_type,
                companyScale: selectedPortal.company_scale,
                targetTrack: selectedPortal.focus_roles.includes('Agent 开发')
                  ? 'Agent 开发'
                  : selectedPortal.focus_roles[0] || '大模型评测',
                source: '企业官网',
                notes: selectedPortal.notes || '',
              }
            : undefined
        }
      />
    </Layout>
  );
}
