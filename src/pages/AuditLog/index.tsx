import { useState, useMemo } from 'react';
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
  TrendingUp,
  TrendingDown,
  AlertCircle,
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
  refund: { label: '退款(已处理)', icon: Undo2, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  refund_apply: { label: '退款申请', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
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

const extractAmount = (log: OperationLog): number => {
  if (log.amount !== undefined) return log.amount;
  const match = log.detail.match(/¥([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
};

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

  const filteredLogs = useMemo(() => {
    return getFilteredLogs().filter((l) => {
      if (dateRange.start && l.createdAt < dateRange.start) return false;
      if (dateRange.end && l.createdAt > dateRange.end + 'T23:59:59') return false;
      return true;
    });
  }, [getFilteredLogs, dateRange]);

  const summary = useMemo(() => {
    const byStore = new Map<string, {
      storeName: string;
      rechargeAmount: number;
      consumeAmount: number;
      refundAmount: number;
      freezeCount: number;
      rechargeCount: number;
      consumeCount: number;
      refundCount: number;
    }>();

    let totalRecharge = 0;
    let totalConsume = 0;
    let totalRefund = 0;
    let totalFreezeCount = 0;
    let totalUnfreezeCount = 0;
    let rechargeCount = 0;
    let consumeCount = 0;
    let refundCount = 0;

    filteredLogs.forEach((log) => {
      const amount = extractAmount(log);
      const storeName = log.storeName || '未归属';

      if (!byStore.has(storeName)) {
        byStore.set(storeName, {
          storeName,
          rechargeAmount: 0,
          consumeAmount: 0,
          refundAmount: 0,
          freezeCount: 0,
          rechargeCount: 0,
          consumeCount: 0,
          refundCount: 0,
        });
      }
      const storeData = byStore.get(storeName)!;

      if (log.type === 'recharge' || log.type === 'approve') {
        storeData.rechargeAmount += amount;
        storeData.rechargeCount += 1;
        totalRecharge += amount;
        rechargeCount += 1;
      } else if (log.type === 'consume') {
        storeData.consumeAmount += amount;
        storeData.consumeCount += 1;
        totalConsume += amount;
        consumeCount += 1;
      } else if (log.type === 'refund' || log.type === 'refund_apply') {
        storeData.refundAmount += amount;
        storeData.refundCount += 1;
        totalRefund += amount;
        refundCount += 1;
      } else if (log.type === 'freeze') {
        storeData.freezeCount += 1;
        totalFreezeCount += 1;
      } else if (log.type === 'unfreeze') {
        totalUnfreezeCount += 1;
      }
    });

    return {
      byStore: Array.from(byStore.values()),
      totalRecharge,
      totalConsume,
      totalRefund,
      totalFreezeCount,
      totalUnfreezeCount,
      rechargeCount,
      consumeCount,
      refundCount,
      netChange: totalRecharge - totalConsume - totalRefund,
    };
  }, [filteredLogs]);

  const handleExport = () => {
    const headers = ['时间', '类型', '对象', '门店', '金额', '详情', '操作人'];
    const rows = filteredLogs.map((l) => [
      formatDateTime(l.createdAt),
      typeConfig[l.type]?.label || l.type,
      l.targetName,
      l.storeName,
      extractAmount(l).toLocaleString(),
      l.detail,
      l.operator,
    ]);

    const summaryLines: string[] = [];
    summaryLines.push('=== 财务对账汇总 ===');
    summaryLines.push(`统计时段,${dateRange.start || '不限'} 至 ${dateRange.end || '不限'}`);
    summaryLines.push('');
    summaryLines.push('汇总指标,金额(元),笔数');
    summaryLines.push(`充值入账,${summary.totalRecharge.toLocaleString()},${summary.rechargeCount}`);
    summaryLines.push(`消费扣减,${summary.totalConsume.toLocaleString()},${summary.consumeCount}`);
    summaryLines.push(`退款扣减,${summary.totalRefund.toLocaleString()},${summary.refundCount}`);
    summaryLines.push(`冻结次数,,${summary.totalFreezeCount}`);
    summaryLines.push(`解冻次数,,${summary.totalUnfreezeCount}`);
    summaryLines.push(`净变动,${summary.netChange.toLocaleString()},`);
    summaryLines.push('');
    summaryLines.push('=== 按门店汇总 ===');
    summaryLines.push('门店,充值入账,消费扣减,退款扣减,冻结次数,充值笔数,消费笔数,退款笔数');
    summary.byStore.forEach((s) => {
      summaryLines.push([
        s.storeName,
        s.rechargeAmount.toLocaleString(),
        s.consumeAmount.toLocaleString(),
        s.refundAmount.toLocaleString(),
        s.freezeCount,
        s.rechargeCount,
        s.consumeCount,
        s.refundCount,
      ].join(','));
    });
    summaryLines.push('');
    summaryLines.push('=== 明细记录 ===');

    const csvContent = [...summaryLines, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `财务对账_${new Date().toISOString().slice(0, 10)}.csv`;
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
      key: 'amount',
      title: '金额',
      align: 'right' as const,
      width: '120px',
      render: (record: OperationLog) => {
        const amount = extractAmount(record);
        if (amount === 0) return <span className="text-sm text-slate-400">-</span>;
        const isNegative = record.type === 'consume' || record.type === 'refund' || record.type === 'refund_apply' || record.type === 'reject';
        return (
          <span className={clsx(
            'text-sm font-semibold',
            isNegative ? 'text-red-600' : 'text-green-600'
          )}>
            {isNegative ? '-' : '+'}¥{amount.toLocaleString()}
          </span>
        );
      },
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
          <h2 className="text-xl font-bold text-slate-800">财务对账台账</h2>
          <p className="text-sm text-slate-500 mt-1">
            按门店、时间段汇总资金变动，支持导出完整对账报表
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          导出完整对账表
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">充值入账</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                +¥{summary.totalRecharge.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.rechargeCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">消费扣减</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                -¥{summary.totalConsume.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.consumeCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">退款扣减</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                -¥{summary.totalRefund.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.refundCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Undo2 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">净变动</p>
              <p className={clsx(
                'text-2xl font-bold mt-1',
                summary.netChange >= 0 ? 'text-blue-600' : 'text-red-600'
              )}>
                {summary.netChange >= 0 ? '+' : ''}¥{summary.netChange.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                冻结 {summary.totalFreezeCount} 次 / 解冻 {summary.totalUnfreezeCount} 次
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {summary.byStore.length > 0 && (
        <Card padding="none">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">按门店汇总</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-slate-600 font-medium">门店</th>
                  <th className="px-4 py-2.5 text-right text-slate-600 font-medium">充值入账</th>
                  <th className="px-4 py-2.5 text-right text-slate-600 font-medium">消费扣减</th>
                  <th className="px-4 py-2.5 text-right text-slate-600 font-medium">退款扣减</th>
                  <th className="px-4 py-2.5 text-right text-slate-600 font-medium">净变动</th>
                  <th className="px-4 py-2.5 text-center text-slate-600 font-medium">冻结次数</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStore.map((s, idx) => {
                  const net = s.rechargeAmount - s.consumeAmount - s.refundAmount;
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700 font-medium">{s.storeName}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        +¥{s.rechargeAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">
                        -¥{s.consumeAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                        -¥{s.refundAmount.toLocaleString()}
                      </td>
                      <td className={clsx(
                        'px-4 py-3 text-right font-semibold',
                        net >= 0 ? 'text-blue-600' : 'text-red-600'
                      )}>
                        {net >= 0 ? '+' : ''}¥{net.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{s.freezeCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
    </div>
  );
}
