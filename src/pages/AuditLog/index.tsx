import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  FileText,
  CreditCard,
  Receipt,
  Undo2,
  Ban,
  CheckCircle,
  XCircle,
  User,
  Building2,
  Clock,
} from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDateTime } from '@/utils/format';
import { clsx } from 'clsx';
import type { OperationLog } from '@/types';

const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  recharge: { label: '充值', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  consume: { label: '消费', icon: Receipt, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  refund: { label: '退款', icon: Undo2, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  freeze: { label: '冻结', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100' },
  unfreeze: { label: '解冻', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  approve: { label: '审批通过', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  reject: { label: '审批驳回', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'recharge', label: '充值' },
  { key: 'consume', label: '消费' },
  { key: 'refund', label: '退款' },
  { key: 'freeze', label: '冻结/解冻' },
  { key: 'approve', label: '审批通过' },
  { key: 'reject', label: '审批驳回' },
];

export default function AuditLog() {
  const {
    filterType,
    searchKeyword,
    currentPage,
    pageSize,
    setFilterType,
    setSearchKeyword,
    setCurrentPage,
    getFilteredLogs,
  } = useOperationLogStore();

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredLogs = getFilteredLogs().filter((l) => {
    if (dateRange.start && l.createdAt < dateRange.start) return false;
    if (dateRange.end && l.createdAt > dateRange.end + 'T23:59:59') return false;
    return true;
  });

  const handleExport = () => {
    const headers = ['时间', '类型', '对象', '门店', '详情', '操作人'];
    const rows = filteredLogs.map((l) => [
      formatDateTime(l.createdAt),
      typeConfig[l.type]?.label || l.type,
      l.targetName,
      l.storeName,
      l.detail,
      l.operator,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对账明细_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'createdAt',
      title: '时间',
      width: '160px',
      render: (record: OperationLog) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm">{formatDateTime(record.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '120px',
      render: (record: OperationLog) => {
        const config = typeConfig[record.type];
        if (!config) return <span className="text-sm">{record.type}</span>;
        const Icon = config.icon;
        return (
          <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bgColor, config.color)}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'targetName',
      title: '对象',
      width: '120px',
      render: (record: OperationLog) => (
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-800">{record.targetName}</span>
        </div>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      render: (record: OperationLog) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-sm">{record.storeName}</span>
        </div>
      ),
    },
    {
      key: 'detail',
      title: '详情',
      render: (record: OperationLog) => (
        <span className="text-sm text-slate-700 line-clamp-2">{record.detail}</span>
      ),
    },
    {
      key: 'operator',
      title: '操作人',
      width: '100px',
      render: (record: OperationLog) => (
        <span className="text-sm text-slate-600">{record.operator}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">对账与操作记录</h2>
          <p className="text-sm text-slate-500 mt-1">
            查看充值、消费、退款、冻结等操作记录，支持导出对账明细
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          导出对账明细
        </button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-1">
              {typeFilters.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterType === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索对象、详情、门店..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-56 h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-sm">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLogs}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredLogs.length,
            onChange: setCurrentPage,
          }}
        />
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {filteredLogs.filter((l) => l.type === 'recharge').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">充值记录</p>
        </Card>
        <Card className="p-4 text-center">
          <Receipt className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {filteredLogs.filter((l) => l.type === 'consume').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">消费记录</p>
        </Card>
        <Card className="p-4 text-center">
          <Undo2 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {filteredLogs.filter((l) => l.type === 'refund').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">退款记录</p>
        </Card>
        <Card className="p-4 text-center">
          <Ban className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {filteredLogs.filter((l) => l.type === 'freeze' || l.type === 'unfreeze').length}
          </p>
          <p className="text-sm text-slate-500 mt-1">冻结/解冻</p>
        </Card>
      </div>
    </div>
  );
}
