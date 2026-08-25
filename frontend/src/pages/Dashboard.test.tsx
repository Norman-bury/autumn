import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listApplications, listRecruitmentEvents } = vi.hoisted(() => ({
  listApplications: vi.fn(),
  listRecruitmentEvents: vi.fn(),
}));

vi.mock('../lib/applications', () => ({ listApplications }));
vi.mock('../lib/recruitment', () => ({ listRecruitmentEvents }));
vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('../components/ApplicationModal', () => ({ default: () => null }));
vi.mock('../components/RecruitmentEventList', () => ({
  default: ({ events }: { events: unknown[] }) => (
    <div>流程数量：{events.length}</div>
  ),
}));

describe('秋招总览', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listApplications.mockResolvedValue({
      total: 2,
      page: 1,
      per_page: 100,
      items: [
        {
          id: 'app-1',
          company: '重点公司',
          job_title: 'Agent 开发工程师',
          status: { id: 's1', name: 'Interviewing', color: '#000' },
          priority: 'high',
        },
        {
          id: 'app-2',
          company: '普通公司',
          job_title: '大模型评测',
          status: { id: 's2', name: 'Applied', color: '#000' },
          priority: 'medium',
        },
      ],
    });
    listRecruitmentEvents.mockResolvedValue([
      {
        id: 'event-1',
        event_type: 'assessment',
        status: 'pending',
        scheduled_at: new Date(Date.now() + 60_000).toISOString(),
      },
      {
        id: 'event-2',
        event_type: 'interview',
        status: 'pending',
        scheduled_at: new Date(Date.now() + 120_000).toISOString(),
      },
    ]);
  });

  it('展示目标画像、关键指标和重点投递', async () => {
    const { default: Dashboard } = await import('./Dashboard');

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(listApplications).toHaveBeenCalled());
    expect(screen.getByText('秋招总览')).toBeInTheDocument();
    expect(
      screen.getByText('目标方向：大模型评测、Agent 开发 · 中型公司优先')
    ).toBeInTheDocument();
    expect(screen.getByText('重点公司')).toBeInTheDocument();
    expect(screen.getByText('流程数量：2')).toBeInTheDocument();
  });
});
