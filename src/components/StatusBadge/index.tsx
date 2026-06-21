import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  type?: 'approval' | 'member' | 'risk' | 'alert';
}

const statusStyles: Record<string, Record<string, string>> = {
  approval: {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pending_store: 'bg-blue-100 text-blue-700 border-blue-200',
    pending_finance: 'bg-orange-100 text-orange-700 border-orange-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  },
  member: {
    normal: 'bg-green-100 text-green-700 border-green-200',
    frozen: 'bg-red-100 text-red-700 border-red-200',
  },
  risk: {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  alert: {
    pending: 'bg-red-100 text-red-700 border-red-200',
    handled: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const statusTextMap: Record<string, Record<string, string>> = {
  approval: {
    pending: '待审批',
    pending_store: '待店长审批',
    pending_finance: '待财务终审',
    approved: '已通过',
    rejected: '已驳回',
  },
  member: {
    normal: '正常',
    frozen: '已冻结',
  },
  risk: {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  },
  alert: {
    pending: '待处理',
    handled: '已处理',
  },
};

export default function StatusBadge({ status, type = 'approval' }: StatusBadgeProps) {
  const style = statusStyles[type]?.[status] || 'bg-slate-100 text-slate-600';
  const text = statusTextMap[type]?.[status] || status;

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      style
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        status === 'approved' || status === 'normal' || status === 'handled'
          ? 'bg-current opacity-60'
          : status === 'rejected'
          ? 'bg-red-500'
          : 'bg-yellow-500'
      )}></span>
      {text}
    </span>
  );
}
