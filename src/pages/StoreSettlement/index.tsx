import { useState, useMemo } from 'react';
import {
  Building2,
  ArrowRightLeft,
  CreditCard,
  Receipt,
  Wallet,
  Download,
  Store,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  X,
} from 'lucide-react';
import Card from '@/components/Card';
import { useRechargeStore } from '@/store/useRechargeStore';
import { useConsumeStore } from '@/store/useConsumeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSettlementStore } from '@/store/useSettlementStore';
import { clsx } from 'clsx';
import { formatDateTime } from '@/utils/format';
import type { SettlementRecord, SettlementItem } from '@/types';

type Role = 'finance' | 'store_manager';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: '待确认', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  confirmed: { label: '已确认', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  disputed: { label: '有异议', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
};

export default function StoreSettlement() {
  const { stores } = useSettingsStore();
  const { records: rechargeRecords } = useRechargeStore();
  const { records: consumeRecords } = useConsumeStore();
  const { records: settlementRecords, addRecord, confirmRecord, disputeRecord } = useSettlementStore();

  const [role, setRole] = useState<Role>('finance');
  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [activeView, setActiveView] = useState<'generate' | 'list'>('list');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeTargetId, setDisputeTargetId] = useState('');

  const visibleStores = useMemo(() => {
    if (role === 'finance') return stores;
    return stores.filter((s) => s.id === currentStoreId);
  }, [role, currentStoreId, stores]);

  const settlementCalc = useMemo(() => {
    const filteredRecharges = rechargeRecords.filter((r) => {
      if (r.status !== 'approved') return false;
      if (dateRange.start && r.createdAt < dateRange.start) return false;
      if (dateRange.end && r.createdAt > dateRange.end + 'T23:59:59') return false;
      return true;
    });

    const filteredConsumes = consumeRecords.filter((c) => {
      if (dateRange.start && c.createdAt < dateRange.start) return false;
      if (dateRange.end && c.createdAt > dateRange.end + 'T23:59:59') return false;
      return true;
    });

    const map = new Map<string, SettlementItem>();

    visibleStores.forEach((s) => {
      map.set(s.id, {
        storeId: s.id, storeName: s.name,
        rechargeTotal: 0, rechargeCount: 0,
        consumeLocalTotal: 0, consumeLocalCount: 0,
        consumeCrossInTotal: 0, consumeCrossInCount: 0,
        consumeCrossOutTotal: 0, consumeCrossOutCount: 0,
        crossInShare: 0, crossOutShare: 0, netSettlement: 0,
      });
    });

    filteredRecharges.forEach((r) => {
      const s = map.get(r.storeId);
      if (s) { s.rechargeTotal += r.amount; s.rechargeCount += 1; }
    });

    filteredConsumes.forEach((c) => {
      const occurred = map.get(c.storeId);
      const original = map.get(c.originalStoreId);
      if (c.isCrossStore) {
        const share = c.amount * c.performanceRatio;
        const originalShare = c.amount - share;
        if (occurred) {
          occurred.consumeCrossInTotal += c.amount; occurred.consumeCrossInCount += 1; occurred.crossInShare += share;
        }
        if (original && original !== occurred) {
          original.consumeCrossOutTotal += c.amount; original.consumeCrossOutCount += 1; original.crossOutShare += originalShare;
        }
      } else {
        if (occurred) { occurred.consumeLocalTotal += c.amount; occurred.consumeLocalCount += 1; }
      }
    });

    const items = Array.from(map.values()).map((s) => ({
      ...s,
      netSettlement: s.rechargeTotal + s.consumeLocalTotal + s.crossInShare - s.crossOutShare,
    }));

    const total = items.reduce((acc, s) => ({
      rechargeTotal: acc.rechargeTotal + s.rechargeTotal, rechargeCount: acc.rechargeCount + s.rechargeCount,
      consumeLocalTotal: acc.consumeLocalTotal + s.consumeLocalTotal, consumeLocalCount: acc.consumeLocalCount + s.consumeLocalCount,
      consumeCrossInTotal: acc.consumeCrossInTotal + s.consumeCrossInTotal, consumeCrossInCount: acc.consumeCrossInCount + s.consumeCrossInCount,
      consumeCrossOutTotal: acc.consumeCrossOutTotal + s.consumeCrossOutTotal, consumeCrossOutCount: acc.consumeCrossOutCount + s.consumeCrossOutCount,
      crossInShare: acc.crossInShare + s.crossInShare, crossOutShare: acc.crossOutShare + s.crossOutShare,
      netSettlement: acc.netSettlement + s.netSettlement,
    }), {
      rechargeTotal: 0, rechargeCount: 0, consumeLocalTotal: 0, consumeLocalCount: 0,
      consumeCrossInTotal: 0, consumeCrossInCount: 0, consumeCrossOutTotal: 0, consumeCrossOutCount: 0,
      crossInShare: 0, crossOutShare: 0, netSettlement: 0,
    });

    return { items, total };
  }, [visibleStores, rechargeRecords, consumeRecords, dateRange]);

  const filteredSettlements = useMemo(() => {
    return settlementRecords.filter((s) => {
      if (role === 'store_manager' && currentStoreId) {
        return s.items.some((item) => item.storeId === currentStoreId);
      }
      return true;
    });
  }, [settlementRecords, role, currentStoreId]);

  const handleGenerate = () => {
    if (!dateRange.start || !dateRange.end) return;
    addRecord({
      periodStart: dateRange.start,
      periodEnd: dateRange.end,
      status: 'pending',
      items: settlementCalc.items,
      totalNetSettlement: settlementCalc.total.netSettlement,
    });
    setActiveView('list');
  };

  const handleConfirm = (id: string) => {
    const confirmer = role === 'store_manager' ? stores.find((s) => s.id === currentStoreId)?.manager || '店长' : '财务管理员';
    confirmRecord(id, confirmer);
  };

  const handleDispute = () => {
    if (!disputeReason.trim()) return;
    disputeRecord(disputeTargetId, disputeReason);
    setShowDisputeModal(false);
    setDisputeReason('');
    setDisputeTargetId('');
  };

  const handleExport = (settlement: SettlementRecord) => {
    const headers = ['门店', '充值入账(元)', '充值笔数', '本店消费(元)', '本店消费笔数', '跨店进店(元)', '进店分成(元)', '跨店外出(元)', '外出分成(元)', '门店应结(元)'];
    const rows = settlement.items.map((s) => [
      s.storeName, s.rechargeTotal.toLocaleString(), s.rechargeCount,
      s.consumeLocalTotal.toLocaleString(), s.consumeLocalCount,
      s.consumeCrossInTotal.toLocaleString(), s.crossInShare.toLocaleString(),
      s.consumeCrossOutTotal.toLocaleString(), s.crossOutShare.toLocaleString(),
      s.netSettlement.toLocaleString(),
    ]);
    rows.push(['合计', settlement.totalNetSettlement.toLocaleString(), '', '', '', '', '', '', '', settlement.totalNetSettlement.toLocaleString()]);

    const csvContent = [`结算期间: ${settlement.periodStart} ~ ${settlement.periodEnd}`, `状态: ${statusConfig[settlement.status]?.label || settlement.status}`, '', headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `结算单_${settlement.periodStart}_${settlement.periodEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSettlementTable = (items: SettlementItem[], total: Omit<SettlementItem, 'storeId' | 'storeName'> & { netSettlement: number }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-2.5 text-left text-slate-600 font-medium">门店</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">充值入账</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">本店消费</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">跨店进店</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">进店分成</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">跨店外出</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium">外出分成</th>
            <th className="px-3 py-2.5 text-right text-slate-600 font-medium font-bold">门店应结</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-3 text-slate-800 font-medium">{s.storeName}</td>
              <td className="px-3 py-3 text-right text-green-600">+¥{s.rechargeTotal.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.rechargeCount})</span></td>
              <td className="px-3 py-3 text-right text-purple-600">¥{s.consumeLocalTotal.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.consumeLocalCount})</span></td>
              <td className="px-3 py-3 text-right text-amber-600">¥{s.consumeCrossInTotal.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.consumeCrossInCount})</span></td>
              <td className="px-3 py-3 text-right text-emerald-600 font-semibold">+¥{s.crossInShare.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-orange-600">¥{s.consumeCrossOutTotal.toLocaleString()}<span className="text-slate-400 text-xs ml-1">({s.consumeCrossOutCount})</span></td>
              <td className="px-3 py-3 text-right text-red-600 font-semibold">-¥{s.crossOutShare.toLocaleString()}</td>
              <td className={clsx('px-3 py-3 text-right font-bold', s.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600')}>
                {s.netSettlement >= 0 ? '+' : ''}¥{s.netSettlement.toLocaleString()}
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td className="px-3 py-3 text-slate-800">合计</td>
            <td className="px-3 py-3 text-right text-green-600">+¥{total.rechargeTotal.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-purple-600">¥{total.consumeLocalTotal.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-amber-600">¥{total.consumeCrossInTotal.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-emerald-600">+¥{total.crossInShare.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-orange-600">¥{total.consumeCrossOutTotal.toLocaleString()}</td>
            <td className="px-3 py-3 text-right text-red-600">-¥{total.crossOutShare.toLocaleString()}</td>
            <td className={clsx('px-3 py-3 text-right', total.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600')}>
              {total.netSettlement >= 0 ? '+' : ''}¥{total.netSettlement.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">门店跨店结算</h2>
          <p className="text-sm text-slate-500 mt-1">结算单生成、确认与异议处理，确认后数据锁定</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setRole('store_manager')} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', role === 'store_manager' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
              <Store className="w-4 h-4" /> 店长视角
            </button>
            <button onClick={() => setRole('finance')} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', role === 'finance' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700')}>
              <Shield className="w-4 h-4" /> 财务视角
            </button>
          </div>
          {role === 'store_manager' && (
            <select value={currentStoreId} onChange={(e) => setCurrentStoreId(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">请选择门店</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {role === 'finance' && (
            <button onClick={() => setActiveView('generate')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <CreditCard className="w-4 h-4" /> 生成结算单
            </button>
          )}
        </div>
      </div>

      {activeView === 'generate' && role === 'finance' && (
        <Card padding="none">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">生成新结算单</h3>
            <p className="text-sm text-slate-500 mt-1">选择时间段后，系统根据已审批的充值和消费数据自动计算各门店结算金额</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 font-medium w-20">统计时段：</span>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-slate-400 text-sm">至</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {dateRange.start && dateRange.end && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-slate-500">充值入账合计</p>
                    <p className="text-lg font-bold text-green-600">+¥{settlementCalc.total.rechargeTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-slate-500">本店消费合计</p>
                    <p className="text-lg font-bold text-purple-600">¥{settlementCalc.total.consumeLocalTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-xs text-slate-500">跨店分成净额</p>
                    <p className="text-lg font-bold text-amber-600">+¥{(settlementCalc.total.crossInShare - settlementCalc.total.crossOutShare).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-slate-500">应结合计</p>
                    <p className={clsx('text-lg font-bold', settlementCalc.total.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600')}>
                      {settlementCalc.total.netSettlement >= 0 ? '+' : ''}¥{settlementCalc.total.netSettlement.toLocaleString()}
                    </p>
                  </div>
                </div>
                {renderSettlementTable(settlementCalc.items, settlementCalc.total)}
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setActiveView('list')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={!dateRange.start || !dateRange.end}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认生成结算单
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">结算单列表</h3>
            <div className="flex items-center gap-2 ml-4">
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-600')}>
                <Clock className="w-3 h-3" /> 待确认 {filteredSettlements.filter((s) => s.status === 'pending').length}
              </span>
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-600')}>
                <CheckCircle className="w-3 h-3" /> 已确认 {filteredSettlements.filter((s) => s.status === 'confirmed').length}
              </span>
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600')}>
                <AlertTriangle className="w-3 h-3" /> 有异议 {filteredSettlements.filter((s) => s.status === 'disputed').length}
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredSettlements.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm">暂无结算单</div>
          )}
          {filteredSettlements.map((settlement) => {
            const cfg = statusConfig[settlement.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={settlement.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.bgColor, cfg.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {settlement.periodStart} ~ {settlement.periodEnd}
                    </span>
                    <span className="text-xs text-slate-400">
                      生成于 {formatDateTime(settlement.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedSettlement(settlement)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="查看详情">
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                    {settlement.status === 'pending' && (
                      <>
                        <button onClick={() => handleConfirm(settlement.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors">
                          确认
                        </button>
                        <button onClick={() => { setDisputeTargetId(settlement.id); setShowDisputeModal(true); }} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                          提出异议
                        </button>
                      </>
                    )}
                    {settlement.status === 'confirmed' && (
                      <span className="text-xs text-green-600">{settlement.confirmedBy} 于 {formatDateTime(settlement.confirmedAt!)} 确认</span>
                    )}
                    {settlement.status === 'disputed' && (
                      <span className="text-xs text-red-600" title={settlement.disputeReason}>
                        异议：{settlement.disputeReason}
                      </span>
                    )}
                    <button onClick={() => handleExport(settlement)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="导出">
                      <Download className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {settlement.items.slice(0, 3).map((item) => (
                    <div key={item.storeId} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">{item.storeName}</p>
                      <p className={clsx('text-sm font-bold', item.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600')}>
                        应结 {item.netSettlement >= 0 ? '+' : ''}¥{item.netSettlement.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {settlement.items.length > 3 && (
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-center">
                      <button onClick={() => setSelectedSettlement(settlement)} className="text-xs text-blue-600 hover:underline">
                        查看全部 {settlement.items.length} 个门店
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedSettlement(null)}></div>
          <div className="relative w-[900px] max-h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">结算单详情</h3>
                <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig[selectedSettlement.status].bgColor, statusConfig[selectedSettlement.status].color)}>
                  {statusConfig[selectedSettlement.status].label}
                </span>
              </div>
              <button onClick={() => setSelectedSettlement(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">结算期间</p>
                  <p className="text-sm font-medium text-slate-800">{selectedSettlement.periodStart} ~ {selectedSettlement.periodEnd}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">生成时间</p>
                  <p className="text-sm font-medium text-slate-800">{formatDateTime(selectedSettlement.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">应结总额</p>
                  <p className={clsx('text-sm font-bold', selectedSettlement.totalNetSettlement >= 0 ? 'text-blue-600' : 'text-red-600')}>
                    {selectedSettlement.totalNetSettlement >= 0 ? '+' : ''}¥{selectedSettlement.totalNetSettlement.toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedSettlement.confirmedAt && (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  已由 {selectedSettlement.confirmedBy} 于 {formatDateTime(selectedSettlement.confirmedAt)} 确认
                </div>
              )}
              {selectedSettlement.disputeReason && (
                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  异议原因：{selectedSettlement.disputeReason}
                </div>
              )}
              <Card padding="none">
                {renderSettlementTable(selectedSettlement.items, { ...selectedSettlement.items.reduce((acc, s) => ({
                  rechargeTotal: acc.rechargeTotal + s.rechargeTotal, rechargeCount: acc.rechargeCount + s.rechargeCount,
                  consumeLocalTotal: acc.consumeLocalTotal + s.consumeLocalTotal, consumeLocalCount: acc.consumeLocalCount + s.consumeLocalCount,
                  consumeCrossInTotal: acc.consumeCrossInTotal + s.consumeCrossInTotal, consumeCrossInCount: acc.consumeCrossInCount + s.consumeCrossInCount,
                  consumeCrossOutTotal: acc.consumeCrossOutTotal + s.consumeCrossOutTotal, consumeCrossOutCount: acc.consumeCrossOutCount + s.consumeCrossOutCount,
                  crossInShare: acc.crossInShare + s.crossInShare, crossOutShare: acc.crossOutShare + s.crossOutShare,
                  netSettlement: acc.netSettlement + s.netSettlement,
                }), {
                  rechargeTotal: 0, rechargeCount: 0, consumeLocalTotal: 0, consumeLocalCount: 0,
                  consumeCrossInTotal: 0, consumeCrossInCount: 0, consumeCrossOutTotal: 0, consumeCrossOutCount: 0,
                  crossInShare: 0, crossOutShare: 0, netSettlement: 0,
                }), netSettlement: selectedSettlement.totalNetSettlement })}
              </Card>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDisputeModal(false)}></div>
          <div className="relative w-[420px] bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">提出异议</h3>
            <div className="mb-5">
              <label className="block text-sm text-slate-600 mb-2">异议原因</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="请说明异议原因..."
                className="w-full h-28 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={handleDispute} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">提交异议</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
