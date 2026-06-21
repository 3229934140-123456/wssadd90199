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
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDateTime } from '@/utils/format';
import { clsx } from 'clsx';
import type { OperationLog } from '@/types';

const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  recharge: { label: '充值入账', icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-100' },
  recharge_apply: { label: '充值申请', icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  consume: { label: '消费核销', icon: Receipt, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  refund: { label: '退款通过', icon: Undo2, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  refund_apply: { label: '退款申请', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  freeze: { label: '账户冻结', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100' },
  unfreeze: { label: '账户解冻', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  approve: { label: '审批通过', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  reject: { label: '审批驳回', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'recharge_apply', label: '充值申请' },
  { key: 'recharge', label: '充值入账' },
  { key: 'consume', label: '消费核销' },
  { key: 'refund_apply', label: '退款申请' },
  { key: 'refund', label: '退款通过' },
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
    type StoreStats = {
      storeName: string;
      rechargeApplyAmount: number;
      rechargeApplyCount: number;
      rechargeAmount: number;
      rechargeCount: number;
      consumeAmount: number;
      consumeCount: number;
      refundApplyAmount: number;
      refundApplyCount: number;
      refundAmount: number;
      refundCount: number;
      refundRejectCount: number;
      freezeCount: number;
      unfreezeCount: number;
    };
    const byStore = new Map<string, StoreStats>();

    let totalRechargeApply = 0;
    let totalRechargeApplyCount = 0;
    let totalRecharge = 0;
    let totalRechargeCount = 0;
    let totalConsume = 0;
    let totalConsumeCount = 0;
    let totalRefundApply = 0;
    let totalRefundApplyCount = 0;
    let totalRefund = 0;
    let totalRefundCount = 0;
    let totalRefundRejectCount = 0;
    let totalFreezeCount = 0;
    let totalUnfreezeCount = 0;

    filteredLogs.forEach((log) => {
      const amount = extractAmount(log);
      const storeName = log.storeName || '未归属';

      if (!byStore.has(storeName)) {
        byStore.set(storeName, {
          storeName,
          rechargeApplyAmount: 0, rechargeApplyCount: 0,
          rechargeAmount: 0, rechargeCount: 0,
          consumeAmount: 0, consumeCount: 0,
          refundApplyAmount: 0, refundApplyCount: 0,
          refundAmount: 0, refundCount: 0,
          refundRejectCount: 0,
          freezeCount: 0, unfreezeCount: 0,
        });
      }
      const s = byStore.get(storeName)!;

      switch (log.type) {
        case 'recharge_apply':
          s.rechargeApplyAmount += amount; s.rechargeApplyCount += 1;
          totalRechargeApply += amount; totalRechargeApplyCount += 1;
          break;
        case 'recharge':
          s.rechargeAmount += amount; s.rechargeCount += 1;
          totalRecharge += amount; totalRechargeCount += 1;
          break;
        case 'consume':
          s.consumeAmount += amount; s.consumeCount += 1;
          totalConsume += amount; totalConsumeCount += 1;
          break;
        case 'refund_apply':
          s.refundApplyAmount += amount; s.refundApplyCount += 1;
          totalRefundApply += amount; totalRefundApplyCount += 1;
          break;
        case 'refund':
          s.refundAmount += amount; s.refundCount += 1;
          totalRefund += amount; totalRefundCount += 1;
          break;
        case 'reject':
          if (log.detail.includes('退款')) {
            s.refundRejectCount += 1;
            totalRefundRejectCount += 1;
          }
          break;
        case 'freeze':
          s.freezeCount += 1;
          totalFreezeCount += 1;
          break;
        case 'unfreeze':
          s.unfreezeCount += 1;
          totalUnfreezeCount += 1;
          break;
      }
    });

    return {
      byStore: Array.from(byStore.values()),
      totalRechargeApply, totalRechargeApplyCount,
      totalRecharge, totalRechargeCount,
      totalConsume, totalConsumeCount,
      totalRefundApply, totalRefundApplyCount,
      totalRefund, totalRefundCount,
      totalRefundRejectCount,
      totalFreezeCount,
      totalUnfreezeCount,
      netChange: totalRecharge - totalConsume - totalRefund,
    };
  }, [filteredLogs]);

  const handleExport = () => {
    const headers = ['时间', '动作类型', '阶段', '对象', '门店', '金额(元)', '详情', '操作人'];
    const getStage = (t: string): string => {
      if (t === 'recharge_apply') return '申请';
      if (t === 'recharge') return '入账';
      if (t === 'refund_apply') return '申请';
      if (t === 'refund') return '通过';
      if (t === 'approve') return '审批通过';
      if (t === 'reject') return '审批驳回';
      if (t === 'freeze') return '冻结';
      if (t === 'unfreeze') return '解冻';
      return '消费';
    };
    const rows = filteredLogs.map((l) => [
      formatDateTime(l.createdAt),
      typeConfig[l.type]?.label || l.type,
      getStage(l.type),
      l.targetName,
      l.storeName,
      extractAmount(l).toLocaleString(),
      l.detail,
      l.operator,
    ]);

    const s: string[] = [];
    s.push('===== 财务对账汇总 =====');
    s.push(`统计时段,${dateRange.start || '不限'} 至 ${dateRange.end || '不限'}`);
    s.push('');
    s.push('分类,金额(元),笔数');
    s.push(`充值申请,${summary.totalRechargeApply.toLocaleString()},${summary.totalRechargeApplyCount}`);
    s.push(`充值入账,${summary.totalRecharge.toLocaleString()},${summary.totalRechargeCount}`);
    s.push(`消费扣减,${summary.totalConsume.toLocaleString()},${summary.totalConsumeCount}`);
    s.push(`退款申请,${summary.totalRefundApply.toLocaleString()},${summary.totalRefundApplyCount}`);
    s.push(`退款通过,${summary.totalRefund.toLocaleString()},${summary.totalRefundCount}`);
    s.push(`退款驳回,,${summary.totalRefundRejectCount}`);
    s.push(`账户冻结,,${summary.totalFreezeCount}`);
    s.push(`账户解冻,,${summary.totalUnfreezeCount}`);
    s.push(`净变动（充值入账-消费-退款通过）,${summary.netChange.toLocaleString()},`);
    s.push('');
    s.push('===== 按门店汇总 =====');
    s.push('门店,充值申请金额,充值申请笔数,充值入账金额,充值入账笔数,消费扣减金额,消费笔数,退款申请金额,退款申请笔数,退款通过金额,退款通过笔数,退款驳回笔数,冻结次数,解冻次数');
    summary.byStore.forEach((x) => {
      s.push([
        x.storeName,
        x.rechargeApplyAmount.toLocaleString(), x.rechargeApplyCount,
        x.rechargeAmount.toLocaleString(), x.rechargeCount,
        x.consumeAmount.toLocaleString(), x.consumeCount,
        x.refundApplyAmount.toLocaleString(), x.refundApplyCount,
        x.refundAmount.toLocaleString(), x.refundCount,
        x.refundRejectCount,
        x.freezeCount, x.unfreezeCount,
      ].join(','));
    });
    s.push('');
    s.push('===== 明细记录 =====');

    const csvContent = [...s, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `财务对账台账_${new Date().toISOString().slice(0, 10)}.csv`;
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
      title: '动作类型',
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
        const isNegative = record.type === 'consume' || record.type === 'refund' || record.type === 'reject';
        const isApply = record.type === 'recharge_apply' || record.type === 'refund_apply';
        return (
          <span className={clsx(
            'text-sm font-semibold',
            isApply ? 'text-slate-500' : isNegative ? 'text-red-600' : 'text-green-600'
          )}>
            {isApply ? '' : isNegative ? '-' : '+'}¥{amount.toLocaleString()}
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
            申请、入账、扣减、审批全程追溯，支持按门店导出完整报表
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

      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">充值申请</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                ¥{summary.totalRechargeApply.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.totalRechargeApplyCount} 笔待审</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">充值入账</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                +¥{summary.totalRecharge.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.totalRechargeCount} 笔</p>
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
              <p className="text-xl font-bold text-purple-600 mt-1">
                -¥{summary.totalConsume.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{summary.totalConsumeCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">退款申请 / 通过</p>
              <p className="text-xl font-bold text-orange-600 mt-1">
                -¥{summary.totalRefund.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                申请 {summary.totalRefundApplyCount} 笔 / 通过 {summary.totalRefundCount} 笔 / 驳回 {summary.totalRefundRejectCount} 笔
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Undo2 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">净变动 / 风控</p>
              <p className={clsx(
                'text-xl font-bold mt-1',
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
                  <th className="px-3 py-2.5 text-left text-slate-600 font-medium">门店</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">充值申请</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">充值入账</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">消费扣减</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">退款申请</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">退款通过</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">退款驳回</th>
                  <th className="px-3 py-2.5 text-center text-slate-600 font-medium">冻结</th>
                  <th className="px-3 py-2.5 text-center text-slate-600 font-medium">解冻</th>
                  <th className="px-3 py-2.5 text-right text-slate-600 font-medium">净变动</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStore.map((s, idx) => {
                  const net = s.rechargeAmount - s.consumeAmount - s.refundAmount;
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 text-slate-700 font-medium">{s.storeName}</td>
                      <td className="px-3 py-3 text-right text-blue-600">
                        ¥{s.rechargeApplyAmount.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.rechargeApplyCount})</span>
                      </td>
                      <td className="px-3 py-3 text-right text-green-600 font-semibold">
                        +¥{s.rechargeAmount.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.rechargeCount})</span>
                      </td>
                      <td className="px-3 py-3 text-right text-purple-600 font-semibold">
                        -¥{s.consumeAmount.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.consumeCount})</span>
                      </td>
                      <td className="px-3 py-3 text-right text-amber-600">
                        ¥{s.refundApplyAmount.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.refundApplyCount})</span>
                      </td>
                      <td className="px-3 py-3 text-right text-orange-600 font-semibold">
                        -¥{s.refundAmount.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.refundCount})</span>
                      </td>
                      <td className="px-3 py-3 text-right text-red-500">{s.refundRejectCount}</td>
                      <td className="px-3 py-3 text-center text-red-600">{s.freezeCount}</td>
                      <td className="px-3 py-3 text-center text-green-600">{s.unfreezeCount}</td>
                      <td className={clsx(
                        'px-3 py-3 text-right font-bold',
                        net >= 0 ? 'text-blue-600' : 'text-red-600'
                      )}>
                        {net >= 0 ? '+' : ''}¥{net.toLocaleString()}
                      </td>
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
            <div className="flex items-center gap-1 flex-wrap">
              {typeFilters.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
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
