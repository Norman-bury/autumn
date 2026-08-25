import {
  deleteRecruitmentEvent,
  updateRecruitmentEvent,
} from '../lib/recruitment';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '../lib/recruitmentLabels';
import type { RecruitmentEvent } from '../lib/types';

interface RecruitmentEventListProps {
  events: RecruitmentEvent[];
  showApplication?: boolean;
  onChange: () => void;
}

function formatDateTime(value: string | null): string {
  if (!value) return '时间待定';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function RecruitmentEventList({
  events,
  showApplication = false,
  onChange,
}: RecruitmentEventListProps) {
  async function markCompleted(eventId: string) {
    await updateRecruitmentEvent(eventId, { status: 'completed' });
    onChange();
  }

  async function removeEvent(eventId: string) {
    if (!confirm('确认删除该流程事件？')) return;
    await deleteRecruitmentEvent(eventId);
    onChange();
  }

  if (events.length === 0) {
    return (
      <div className="border-tertiary text-muted rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        暂无流程事件
      </div>
    );
  }

  return (
    <div className="divide-tertiary divide-y">
      {events.map((event) => {
        const eventTime = event.scheduled_at || event.deadline_at;
        const isPending = event.status === 'pending';

        return (
          <div
            key={event.id}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-3 py-4"
          >
            <div
              className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded ${
                isPending
                  ? 'bg-accent/15 text-accent-bright'
                  : 'bg-bg2 text-muted'
              }`}
            >
              <i
                className={`bi ${
                  event.event_type === 'assessment' ||
                  event.event_type === 'written_test'
                    ? 'bi-clipboard-check'
                    : event.event_type.includes('interview')
                      ? 'bi-people'
                      : event.event_type === 'offer'
                        ? 'bi-award'
                        : 'bi-calendar-event'
                } icon-md`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-primary font-medium">{event.title}</span>
                <span className="bg-bg2 text-muted rounded px-2 py-0.5 text-xs">
                  {EVENT_TYPE_LABELS[event.event_type]}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    isPending
                      ? 'bg-yellow/15 text-yellow-bright'
                      : 'bg-green/15 text-green-bright'
                  }`}
                >
                  {EVENT_STATUS_LABELS[event.status]}
                </span>
              </div>
              {showApplication && event.company && (
                <p className="text-secondary mt-1 truncate text-sm">
                  {event.company} · {event.job_title}
                </p>
              )}
              <p className="text-muted mt-1 text-sm">
                {formatDateTime(eventTime)}
                {event.location ? ` · ${event.location}` : ''}
                {event.result ? ` · ${event.result}` : ''}
              </p>
              {event.notes && (
                <p className="text-secondary mt-2 line-clamp-2 text-sm">
                  {event.notes}
                </p>
              )}
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-bright mt-2 inline-flex items-center gap-1 text-sm"
                >
                  打开链接
                  <i className="bi bi-box-arrow-up-right icon-xs" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isPending && (
                <button
                  onClick={() => markCompleted(event.id)}
                  title="标记完成"
                  aria-label="标记完成"
                  className="text-green hover:bg-bg2 flex h-9 w-9 items-center justify-center rounded"
                >
                  <i className="bi bi-check-lg icon-md" />
                </button>
              )}
              <button
                onClick={() => removeEvent(event.id)}
                title="删除"
                aria-label="删除"
                className="text-red hover:bg-bg2 flex h-9 w-9 items-center justify-center rounded"
              >
                <i className="bi bi-trash icon-sm" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
