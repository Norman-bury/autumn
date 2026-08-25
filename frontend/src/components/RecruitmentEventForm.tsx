import { useState } from 'react';

import { createRecruitmentEvent } from '../lib/recruitment';
import type { RecruitmentEvent, RecruitmentEventType } from '../lib/types';
import Dropdown from './Dropdown';

const EVENT_OPTIONS: Array<{
  value: RecruitmentEventType;
  label: string;
}> = [
  { value: 'written_test', label: '笔试' },
  { value: 'assessment', label: '在线测评' },
  { value: 'interview', label: '专业面试' },
  { value: 'hr_interview', label: 'HR 面试' },
  { value: 'medical', label: '体检' },
  { value: 'background_check', label: '政审或背调' },
  { value: 'offer', label: 'Offer 沟通' },
  { value: 'signing', label: '签约' },
  { value: 'follow_up', label: '主动跟进' },
  { value: 'other', label: '其他' },
];

interface RecruitmentEventFormProps {
  applicationId: string;
  onSaved: (event: RecruitmentEvent) => void;
  onCancel: () => void;
}

function toIsoOrNull(value: string): string | null {
  return value ? `${value}:00+08:00` : null;
}

export default function RecruitmentEventForm({
  applicationId,
  onSaved,
  onCancel,
}: RecruitmentEventFormProps) {
  const [eventType, setEventType] =
    useState<RecruitmentEventType>('assessment');
  const [title, setTitle] = useState('在线测评');
  const [scheduledAt, setScheduledAt] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [link, setLink] = useState('');
  const [location, setLocation] = useState('线上');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTypeChange(value: string) {
    const nextType = value as RecruitmentEventType;
    setEventType(nextType);
    const option = EVENT_OPTIONS.find((item) => item.value === nextType);
    if (option) setTitle(option.label);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError('请填写流程名称');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await createRecruitmentEvent({
        application_id: applicationId,
        event_type: eventType,
        title: title.trim(),
        scheduled_at: toIsoOrNull(scheduledAt),
        deadline_at: toIsoOrNull(deadlineAt),
        link: link.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
      onSaved(created);
    } catch {
      setError('保存流程事件失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-tertiary bg-bg2 space-y-4 rounded-lg border p-4"
    >
      {error && <p className="text-red-bright text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-muted mb-1 block text-sm" htmlFor="event-type">
            流程类型
          </label>
          <Dropdown
            id="event-type"
            options={EVENT_OPTIONS}
            value={eventType}
            onChange={handleTypeChange}
            containerBackground="bg2"
          />
        </div>
        <div>
          <label
            className="text-muted mb-1 block text-sm"
            htmlFor="event-title"
          >
            名称
          </label>
          <input
            id="event-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="bg-bg3 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <label
            className="text-muted mb-1 block text-sm"
            htmlFor="scheduled-at"
          >
            开始时间
          </label>
          <input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="bg-bg3 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <label
            className="text-muted mb-1 block text-sm"
            htmlFor="deadline-at"
          >
            截止时间
          </label>
          <input
            id="deadline-at"
            type="datetime-local"
            value={deadlineAt}
            onChange={(event) => setDeadlineAt(event.target.value)}
            className="bg-bg3 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <label
            className="text-muted mb-1 block text-sm"
            htmlFor="event-location"
          >
            地点
          </label>
          <input
            id="event-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="bg-bg3 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-muted mb-1 block text-sm" htmlFor="event-link">
            会议或测评链接
          </label>
          <input
            id="event-link"
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            className="bg-bg3 text-fg1 focus:ring-accent-bright w-full rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            className="text-muted mb-1 block text-sm"
            htmlFor="event-notes"
          >
            准备与复盘
          </label>
          <textarea
            id="event-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="记录题型、面试官问题、回答情况和下一步改进"
            className="bg-bg3 text-fg1 placeholder-muted focus:ring-accent-bright w-full resize-y rounded px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-fg1 hover:bg-bg3 rounded px-3 py-2"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-bg0 hover:bg-accent-bright rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          <i className="bi bi-check-lg mr-2" />
          {saving ? '保存中' : '保存事件'}
        </button>
      </div>
    </form>
  );
}
