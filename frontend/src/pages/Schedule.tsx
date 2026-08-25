import { useCallback, useEffect, useMemo, useState } from 'react';

import Layout from '../components/Layout';
import Loading from '../components/Loading';
import RecruitmentEventList from '../components/RecruitmentEventList';
import { listRecruitmentEvents } from '../lib/recruitment';
import type {
  RecruitmentEvent,
  RecruitmentEventStatus,
} from '../lib/types';

type Filter = 'all' | RecruitmentEventStatus;

export default function Schedule() {
  const [events, setEvents] = useState<RecruitmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEvents(
        await listRecruitmentEvents(
          filter === 'all' ? undefined : { status: filter }
        )
      );
    } catch {
      setError('无法加载流程日程');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const summary = useMemo(() => {
    const now = Date.now();
    const nextSevenDays = now + 7 * 24 * 60 * 60 * 1000;
    return events.filter((event) => {
      const time = event.scheduled_at || event.deadline_at;
      if (!time || event.status !== 'pending') return false;
      const timestamp = new Date(time).getTime();
      return timestamp >= now && timestamp <= nextSevenDays;
    }).length;
  }, [events]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-accent mb-2 text-sm font-semibold">
              2027 届秋招
            </p>
            <h1 className="text-primary text-2xl font-bold">流程日程</h1>
            <p className="text-secondary mt-2">
              未来 7 天有 {summary} 个待处理节点
            </p>
          </div>
          <div className="bg-bg1 flex rounded-md p-1">
            {[
              ['pending', '待处理'],
              ['completed', '已完成'],
              ['all', '全部'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as Filter)}
                className={`rounded px-3 py-2 text-sm ${
                  filter === value
                    ? 'bg-accent text-bg0'
                    : 'text-muted hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-red text-red-bright mb-6 rounded border px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-secondary rounded-lg px-5">
          {loading ? (
            <Loading message="正在加载日程..." />
          ) : (
            <RecruitmentEventList
              events={events}
              showApplication
              onChange={loadEvents}
            />
          )}
        </section>
      </div>
    </Layout>
  );
}
