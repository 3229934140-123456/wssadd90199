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
} from 'lucide-react';
import Card from '@/components/Card';
import { useRechargeStore } from '@/store/useRechargeStore';
import { useConsumeStore } from '@/store/useConsumeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { clsx } from 'clsx';

type Role = 'finance' | 'store_manager';

export default function StoreSettlement() {
  const { stores } = useSettingsStore();
  const { records: rechargeRecords } = useRechargeStore();
  const { records: consumeRecords } = useConsumeStore();

  const [role, setRole] = useState<Role>('finance');
  const [currentStoreId, setCurrentStoreId] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const visibleStores = useMemo(() => {
    if (role === 'finance') return stores;
    return stores.filter((s) => s.id === currentStoreId);
  }, [role, currentStoreId, stores]);

  const filteredRecharges = useMemo(() => {
    return rechargeRecords.filter((r) => {
      if (r.status !== 'approved') return false;
      if (role === 'store_manager' && currentStoreId && r.storeId !== currentStoreId) return false;
      if (dateRange.start && r.createdAt < dateRange.start) return false;
      if (dateRange.end && r.createdAt > dateRange.end + 'T23:59:59') return false;
      return true;
    });
  }, [rechargeRecords, dateRange, role, currentStoreId]);

  const filteredConsumes = useMemo(() => {
    return consumeRecords.filter((c) => {
      if (role === 'store_manager' && currentStoreId && c.storeId !== currentStoreId && c.originalStoreId !== currentStoreId) return false;
      if (dateRange.start && c.createdAt < dateRange.start) return false;
      if (dateRange.end && c.createdAt > dateRange.end + 'T23:59:59') return false;
      return true;
    });
  }, [consumeRecords, dateRange, role, currentStoreId]);

  const settlement = useMemo(() => {
    type StoreStat = {
      storeId: string;
      storeName: string;
      rechargeTotal: number;
      rechargeCount: number;
      consumeLocalTotal: number;
      consumeLocalCount: number;
      consumeCrossInTotal: number;
      consumeCrossInCount: number;
      consumeCrossOutTotal: number;
      consumeCrossOutCount: number;
      crossInShare: number;
      crossOutShare: number;
      netSettlement: number;
    };
    const map = new Map<string, StoreStat>();

    visibleStores.forEach((s) => {
      map.set(s.id, {
        storeId: s.id,
        storeName: s.name,
        rechargeTotal: 0, rechargeCount: 0,
        consumeLocalTotal: 0, consumeLocalCount: 0,
        consumeCrossInTotal: 0, consumeCrossInCount: 0,
        consumeCrossOutTotal: 0, consumeCrossOutCount: 0,
        crossInShare: 0, crossOutShare: 0,
        netSettlement: 0,
      });
    });

    filteredRecharges.forEach((r) => {
      const s = map.get(r.storeId);
      if (s) {
        s.rechargeTotal += r.amount;
        s.rechargeCount += 1;
      }
    });

    filteredConsumes.forEach((c) => {
      const occurred = map.get(c.storeId);
      const original = map.get(c.originalStoreId);
      if (c.isCrossStore) {
        const share = c.amount * c.performanceRatio;
        const originalShare = c.amount - share;
        if (occurred) {
          occurred.consumeCrossInTotal += c.amount;
          occurred.consumeCrossInCount += 1;
          occurred.crossInShare += share;
        }
        if (original && original !== occurred) {
          original.consumeCrossOutTotal += c.amount;
          original.consumeCrossOutCount += 1;
          original.crossOutShare += originalShare;
        }
      } else {
        if (occurred) {
          occurred.consumeLocalTotal += c.amount;
          occurred.consumeLocalCount += 1;
        }
      }
    });

    const list = Array.from(map.values()).map((s) => ({
      ...s,
      netSettlement: s.rechargeTotal + s.consumeLocalTotal + s.crossInShare - s.crossOutShare,
    }));

    const total = list.reduce(
      (acc, s) => ({
        rechargeTotal: acc.rechargeTotal + s.rechargeTotal,
        rechargeCount: acc.rechargeCount + s.rechargeCount,
        consumeLocalTotal: acc.consumeLocalTotal + s.consumeLocalTotal,
        consumeLocalCount: acc.consumeLocalCount + s.consumeLocalCount,
        consumeCrossInTotal: acc.consumeCrossInTotal + s.consumeCrossInTotal,
        consumeCrossInCount: acc.consumeCrossInCount + s.consumeCrossInCount,
        consumeCrossOutTotal: acc.consumeCrossOutTotal + s.consumeCrossOutTotal,
        consumeCrossOutCount: acc.consumeCrossOutCount + s.consumeCrossOutCount,
        crossInShare: acc.crossInShare + s.crossInShare,
        crossOutShare: acc.crossOutShare + s.crossOutShare,
        netSettlement: acc.netSettlement + s.netSettlement,
      }),
      {
        rechargeTotal: 0, rechargeCount: 0,
        consumeLocalTotal: 0, consumeLocalCount: 0,
        consumeCrossInTotal: 0, consumeCrossInCount: 0,
        consumeCrossOutTotal: 0, consumeCrossOutCount: 0,
        crossInShare: 0, crossOutShare: 0, netSettlement: 0,
      }
    );

    return { list, total };
  }, [visibleStores, filteredRecharges, filteredConsumes]);

  const handleExport = () => {
    const headers = [
      '门店',
      '充值入账(元)', '充值笔数',
      '本店消费(元)', '本店消费笔数',
      '跨店进店消费(元)', '跨店进店笔数', '进店分成(元)',
      '跨店外出消费(元)', '跨店外出笔数', '外出分成(元)',
      '门店应结(元)',
    ];
    const rows = settlement.list.map((s) => [
      s.storeName,
      s.rechargeTotal.toLocaleString(), s.rechargeCount,
      s.consumeLocalTotal.toLocaleString(), s.consumeLocalCount,
      s.consumeCrossInTotal.toLocaleString(), s.consumeCrossInCount, s.crossInShare.toLocaleString(),
      s.consumeCrossOutTotal.toLocaleString(), s.consumeCrossOutCount, s.crossOutShare.toLocaleString(),
      s.netSettlement.toLocaleString(),
    ]);
    rows.push([
      '合计',
      settlement.total.rechargeTotal.toLocaleString(), settlement.total.rechargeCount,
      settlement.total.consumeLocalTotal.toLocaleString(), settlement.total.consumeLocalCount,
      settlement.total.consumeCrossInTotal.toLocaleString(), settlement.total.consumeCrossInCount, settlement.total.crossInShare.toLocaleString(),
      settlement.total.consumeCrossOutTotal.toLocaleString(), settlement.total.consumeCrossOutCount, settlement.total.crossOutShare.toLocaleString(),
      settlement.total.netSettlement.toLocaleString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `门店结算_${dateRange.start || 'all'}_${dateRange.end || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">门店跨店结算</h2>
          <p className="text-sm text-slate-500 mt-1">
            按时间段统计各门店充值归属、消费发生、跨店业绩分成和应结金额
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setRole('store_manager')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                role === 'store_manager' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Store className="w-4 h-4" />
              店长视角
            </button>
            <button
              onClick={() => setRole('finance')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                role === 'finance' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Shield className="w-4 h-4" />
              财务视角
            </button>
          </div>
          {role === 'store_manager' && (
            <select
              value={currentStoreId}
              onChange={(e) => setCurrentStoreId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择门店</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            导出结算表
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
        <span className="text-sm text-slate-600 font-medium">统计时段：</span>
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
        <span className="text-xs text-slate-400 ml-2">（留空则查全部）</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">充值入账合计</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ¥{settlement.total.rechargeTotal.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{settlement.total.rechargeCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">本店消费合计</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                ¥{settlement.total.consumeLocalTotal.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">{settlement.total.consumeLocalCount} 笔</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">跨店消费合计</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                ¥{settlement.total.consumeCrossInTotal.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                进店 {settlement.total.consumeCrossInCount} 笔 / 外出 {settlement.total.consumeCrossOutCount} 笔
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">门店应结合计</p>
              <p className={clsx(
                'text-2xl font-bold mt-1',
                settlement.total.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600'
              )}>
                {settlement.total.netSettlement >= 0 ? '+' : ''}¥{settlement.total.netSettlement.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                分成：进店 +¥{settlement.total.crossInShare.toLocaleString()} / 外出 -¥{settlement.total.crossOutShare.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">
              门店结算明细
              {role === 'store_manager' && currentStoreId && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  （店长仅可见本门店数据）
                </span>
              )}
            </h3>
          </div>
        </div>
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
              {settlement.list.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-800 font-medium">{s.storeName}</td>
                  <td className="px-3 py-3 text-right text-green-600">
                    +¥{s.rechargeTotal.toLocaleString()}
                    <span className="text-slate-400 text-xs ml-1">({s.rechargeCount})</span>
                  </td>
                  <td className="px-3 py-3 text-right text-purple-600">
                    ¥{s.consumeLocalTotal.toLocaleString()}
                    <span className="text-slate-400 text-xs ml-1">({s.consumeLocalCount})</span>
                  </td>
                  <td className="px-3 py-3 text-right text-amber-600">
                    ¥{s.consumeCrossInTotal.toLocaleString()}
                    <span className="text-slate-400 text-xs ml-1">({s.consumeCrossInCount})</span>
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-600 font-semibold">
                    +¥{s.crossInShare.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right text-orange-600">
                    ¥{s.consumeCrossOutTotal.toLocaleString()}
                    <span className="text-slate-400 text-xs ml-1">({s.consumeCrossOutCount})</span>
                  </td>
                  <td className="px-3 py-3 text-right text-red-600 font-semibold">
                    -¥{s.crossOutShare.toLocaleString()}
                  </td>
                  <td className={clsx(
                    'px-3 py-3 text-right font-bold',
                    s.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600'
                  )}>
                    {s.netSettlement >= 0 ? '+' : ''}¥{s.netSettlement.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-3 text-slate-800">合计</td>
                <td className="px-3 py-3 text-right text-green-600">
                  +¥{settlement.total.rechargeTotal.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-purple-600">
                  ¥{settlement.total.consumeLocalTotal.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-amber-600">
                  ¥{settlement.total.consumeCrossInTotal.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-emerald-600">
                  +¥{settlement.total.crossInShare.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-orange-600">
                  ¥{settlement.total.consumeCrossOutTotal.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-red-600">
                  -¥{settlement.total.crossOutShare.toLocaleString()}
                </td>
                <td className={clsx(
                  'px-3 py-3 text-right',
                  settlement.total.netSettlement >= 0 ? 'text-blue-600' : 'text-red-600'
                )}>
                  {settlement.total.netSettlement >= 0 ? '+' : ''}¥{settlement.total.netSettlement.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="none">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">跨店消费明细</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left text-slate-600 font-medium">时间</th>
                <th className="px-3 py-2.5 text-left text-slate-600 font-medium">会员</th>
                <th className="px-3 py-2.5 text-left text-slate-600 font-medium">核销门店</th>
                <th className="px-3 py-2.5 text-left text-slate-600 font-medium">原充值门店</th>
                <th className="px-3 py-2.5 text-left text-slate-600 font-medium">项目</th>
                <th className="px-3 py-2.5 text-right text-slate-600 font-medium">金额</th>
                <th className="px-3 py-2.5 text-right text-slate-600 font-medium">业绩分成</th>
                <th className="px-3 py-2.5 text-right text-slate-600 font-medium">核销门店得</th>
                <th className="px-3 py-2.5 text-right text-slate-600 font-medium">原门店得</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsumes.filter((c) => c.isCrossStore).map((c, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-slate-500">{new Date(c.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-3 py-2.5 text-slate-700 font-medium">{c.memberName}</td>
                  <td className="px-3 py-2.5 text-amber-600">{c.storeName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{c.originalStoreName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{c.projectName}</td>
                  <td className="px-3 py-2.5 text-right text-slate-800">¥{c.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{(c.performanceRatio * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">
                    ¥{Math.round(c.amount * c.performanceRatio).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">
                    ¥{Math.round(c.amount * (1 - c.performanceRatio)).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredConsumes.filter((c) => c.isCrossStore).length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                    暂无跨店消费记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
