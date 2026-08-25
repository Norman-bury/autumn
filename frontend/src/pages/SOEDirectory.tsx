import { useCallback, useEffect, useMemo, useState } from 'react';

import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { listCompanyPortals } from '../lib/recruitment';
import type { CompanyPortal } from '../lib/types';

const HEBEI_CITIES = ['石家庄', '保定', '廊坊', '唐山', '邯郸', '秦皇岛', '任丘', '邢台', '张家口'];
const TARGET_CITIES = ['天津', ...HEBEI_CITIES];

const STATUS_LABELS: Record<CompanyPortal['recruitment_status'], string> = {
  open: '开放中',
  closing_soon: '即将截止',
  rolling: '滚动招聘',
  closed: '已截止',
  not_started: '未开启',
  needs_review: '待复核',
};

const STATUS_STYLES: Record<CompanyPortal['recruitment_status'], string> = {
  open: 'bg-green/15 text-green-bright',
  closing_soon: 'bg-yellow/15 text-yellow-bright',
  rolling: 'bg-blue/15 text-blue-bright',
  closed: 'bg-red/15 text-red-bright',
  not_started: 'bg-bg2 text-muted',
  needs_review: 'bg-bg2 text-muted',
};

const TYPE_STYLES: Record<string, string> = {
  央企: 'bg-red/10 text-red-bright',
  国企: 'bg-yellow/10 text-yellow-bright',
};

export default function SOEDirectory() {
  const [portals, setPortals] = useState<CompanyPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'tianjin' | 'hebei'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | '央企' | '国企'>('all');
  const [search, setSearch] = useState('');

  const loadPortals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await listCompanyPortals({ active_only: true });
      setPortals(all);
    } catch {
      setError('无法加载央企国企数据');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortals();
  }, [loadPortals]);

  const filtered = useMemo(() => {
    return portals.filter((p) => {
      if (p.company_type !== '央企' && p.company_type !== '国企') return false;
      if (!TARGET_CITIES.includes(p.city)) return false;
      if (regionFilter === 'tianjin' && p.city !== '天津') return false;
      if (regionFilter === 'hebei' && p.city === '天津') return false;
      if (typeFilter !== 'all' && p.company_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.company_name.toLowerCase().includes(q) &&
          !p.industry.toLowerCase().includes(q) &&
          !p.notes?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [portals, regionFilter, typeFilter, search]);

  const openPortals = filtered.filter((p) =>
    ['open', 'closing_soon', 'rolling'].includes(p.recruitment_status)
  );
  const notStartedPortals = filtered.filter(
    (p) => p.recruitment_status === 'not_started'
  );

  const stats = useMemo(() => {
    const total = filtered.length;
    const open = openPortals.length;
    const notStarted = notStartedPortals.length;
    const central = filtered.filter((p) => p.company_type === '央企').length;
    return { total, open, notStarted, central };
  }, [filtered, openPortals.length, notStartedPortals.length]);

  function PortalCard({ portal }: { portal: CompanyPortal }) {
    return (
      <article className="border-tertiary bg-secondary rounded-lg border p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-primary truncate font-semibold">
                {portal.company_name}
              </h3>
              <span
                className={`${TYPE_STYLES[portal.company_type] || 'bg-bg2 text-muted'} flex-shrink-0 rounded px-1.5 py-0.5 text-xs`}
              >
                {portal.company_type}
              </span>
            </div>
            <p className="text-secondary mt-1 text-sm">
              {portal.industry} · {portal.city} · {portal.company_scale}
            </p>
          </div>
          <span
            className={`${STATUS_STYLES[portal.recruitment_status]} flex-shrink-0 rounded px-2 py-1 text-xs`}
          >
            {STATUS_LABELS[portal.recruitment_status]}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {portal.focus_roles.map((role) => (
            <span key={role} className="bg-bg2 text-fg1 rounded px-2 py-0.5 text-xs">
              {role}
            </span>
          ))}
        </div>

        {portal.notes && (
          <p className="text-secondary mb-3 text-sm">{portal.notes}</p>
        )}

        <div className="flex items-center gap-2">
          <a
            href={portal.campus_url || portal.careers_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-bright inline-flex items-center gap-1 text-sm"
          >
            <i className="bi bi-box-arrow-up-right" />
            招聘官网
          </a>
          {portal.application_deadline && (
            <span className="text-muted ml-auto text-xs">
              截止：{portal.application_deadline}
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-accent mb-2 text-sm font-semibold">
            河北 · 天津
          </p>
          <h1 className="text-primary text-2xl font-bold">央企国企目录</h1>
          <p className="text-secondary mt-2">
            收录河北、天津地区央企和国企校招信息，包含尚未开启2027届秋招的单位，方便提前关注和准备。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-bg1 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-fg1">{stats.total}</p>
            <p className="text-muted mt-1 text-xs">收录总数</p>
          </div>
          <div className="bg-bg1 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-bright">{stats.open}</p>
            <p className="text-muted mt-1 text-xs">已开启</p>
          </div>
          <div className="bg-bg1 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-muted">{stats.notStarted}</p>
            <p className="text-muted mt-1 text-xs">未开启</p>
          </div>
          <div className="bg-bg1 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-bright">{stats.central}</p>
            <p className="text-muted mt-1 text-xs">央企</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-bg1 mb-6 flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <i className="bi bi-search text-muted absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司、行业或备注"
              className="bg-bg2 text-fg1 placeholder-muted focus:ring-accent-bright w-full rounded py-2 pr-3 pl-9 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as typeof regionFilter)}
              className="bg-bg2 text-fg1 focus:ring-accent-bright rounded px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            >
              <option value="all">全部地区</option>
              <option value="tianjin">天津</option>
              <option value="hebei">河北</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="bg-bg2 text-fg1 focus:ring-accent-bright rounded px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            >
              <option value="all">全部类型</option>
              <option value="央企">央企</option>
              <option value="国企">国企</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="border-red text-red-bright mb-6 rounded border px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <Loading message="正在加载央企国企目录..." />
        ) : (
          <>
            {/* 已开启 */}
            {openPortals.length > 0 && (
              <section className="mb-8">
                <h2 className="text-primary mb-4 flex items-center gap-2 text-lg font-bold">
                  <i className="bi bi-broadcast text-green-bright" />
                  已开启秋招
                  <span className="text-muted text-sm font-normal">
                    ({openPortals.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {openPortals.map((p) => (
                    <PortalCard key={p.id} portal={p} />
                  ))}
                </div>
              </section>
            )}

            {/* 未开启 */}
            {notStartedPortals.length > 0 && (
              <section className="mb-8">
                <h2 className="text-primary mb-4 flex items-center gap-2 text-lg font-bold">
                  <i className="bi bi-clock-history text-muted" />
                  尚未开启（提前关注）
                  <span className="text-muted text-sm font-normal">
                    ({notStartedPortals.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {notStartedPortals.map((p) => (
                    <PortalCard key={p.id} portal={p} />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="border-tertiary text-muted rounded-lg border border-dashed px-4 py-12 text-center">
                没有符合筛选条件的企业
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
