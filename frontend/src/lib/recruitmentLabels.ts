import type {
  RecruitmentEventStatus,
  RecruitmentEventType,
} from './types';

export const STATUS_LABELS: Record<string, string> = {
  Saved: '待投递',
  Applied: '已投递',
  Screening: '筛选中',
  Assessment: '测评中',
  Interviewing: '面试中',
  Offer: 'Offer',
  Accepted: '已接受',
  Rejected: '未通过',
  Withdrawn: '已放弃',
  'No Reply': '无回复',
};

export const EVENT_TYPE_LABELS: Record<RecruitmentEventType, string> = {
  application: '投递',
  written_test: '笔试',
  assessment: '在线测评',
  interview: '专业面试',
  hr_interview: 'HR 面试',
  medical: '体检',
  background_check: '政审或背调',
  offer: 'Offer 沟通',
  signing: '签约',
  follow_up: '主动跟进',
  other: '其他',
};

export const EVENT_STATUS_LABELS: Record<RecruitmentEventStatus, string> = {
  pending: '待处理',
  completed: '已完成',
  cancelled: '已取消',
  missed: '已错过',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function priorityLabel(priority: string): string {
  return (
    {
      high: '重点',
      medium: '正常',
      low: '备选',
    }[priority] || priority
  );
}
