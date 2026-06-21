import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Users,
  ChevronRight,
  Building2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import Card from '@/components/Card';
import AmountDisplay from '@/components/AmountDisplay';
import StatusBadge from '@/components/StatusBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useRechargeStore } from '@/store/useRechargeStore';
import { useRefundStore } from '@/store/useRefundStore';
import { formatDateTime, getAlertTypeText } from '@/utils/format';
import { clsx } from 'clsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getDashboardStats, getStoresByRiskRank, alerts } = useSettingsStore();
  const { getPendingCount: getRechargePendingCount } = useRechargeStore();
  const { getPendingCount: getRefundPendingCount } = useRefundStore();

  const stats = getDashboardStats();
  const storesByRisk = getStoresByRiskRank();
  const pendingRechargeCount = getRechargePendingCount();
  const pendingRefundCount = getRefundPendingCount();
  const pendingAlerts = alerts.filter((a) => a.status === 'pending');

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const statCards = [
    {
      label: '总储值余额',
      value: stats.totalBalance,
      icon: Wallet,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: '本金余额',
      value: stats.totalPrincipal,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: '赠金余额',
      value: stats.totalGift,
      icon: Gift,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: '今日充值',
      value: stats.todayRecharge,
      icon: CreditCard,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: '今日消费',
      value: stats.todayConsume,
      icon: TrendingDown,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: '今日退款',
      value: stats.todayRefund,
      icon: TrendingUp,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  function Gift(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </svg>
    );
  }

  const todoItems = [
    {
      label: '待审批充值',
      count: pendingRechargeCount,
      icon: CreditCard,
      color: 'bg-yellow-500',
      path: '/recharge',
    },
    {
      label: '待审核退款',
      count: pendingRefundCount,
      icon: TrendingDown,
      color: 'bg-orange-500',
      path: '/refund',
    },
    {
      label: '异常预警',
      count: pendingAlerts.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      path: '/members',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">风险看板</h2>
          <p className="text-sm text-slate-500 mt-1">
            实时监控全部门店储值风险状况
          </p>
        </div>
        <div className="text-sm text-slate-500">
          数据更新时间：{formatDateTime(new Date().toISOString())}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <AmountDisplay
                    amount={card.value}
                    size="xl"
                    color="default"
                    className="mt-2 block"
                  />
                </div>
                <div className={clsx('p-2.5 rounded-lg', card.bgColor)}>
                  <Icon className={clsx('w-5 h-5', card.iconColor)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {todoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-center gap-4">
                <div className={clsx('p-3 rounded-xl', item.color + ' bg-opacity-10')}>
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', item.color + ' bg-opacity-20')}>
                    <Icon className={clsx('w-6 h-6', item.color.replace('bg-', 'text-'))} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {item.count}
                    <span className="text-sm font-normal text-slate-400 ml-1">条</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card
          title="门店储值风险排行"
          className="col-span-2"
          extra={
            <button
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate('/settings')}
            >
              查看全部
            </button>
          }
        >
          <div className="space-y-3">
            {storesByRisk.slice(0, 5).map((store, index) => (
              <div
                key={store.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0
                      ? 'bg-red-500 text-white'
                      : index === 1
                      ? 'bg-orange-500 text-white'
                      : index === 2
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800 truncate">
                        {store.name}
                      </span>
                    </div>
                    <span
                      className={clsx(
                        'text-sm font-semibold px-2 py-0.5 rounded',
                        getRiskColor(store.riskScore)
                      )}
                    >
                      {store.riskScore}分
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={clsx('h-2 rounded-full transition-all', getRiskBarColor(store.riskScore))}
                      style={{ width: `${store.riskScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                    <span>储值余额：¥{store.totalBalance.toLocaleString()}</span>
                    <span>今日充值：¥{store.todayRecharge.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="异常预警"
          extra={
            <button
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate('/members')}
            >
              全部预警
            </button>
          }
        >
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {pendingAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无异常预警</p>
              </div>
            ) : (
              pendingAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/members')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg flex-shrink-0',
                        alert.level === 'high'
                          ? 'bg-red-100'
                          : alert.level === 'medium'
                          ? 'bg-orange-100'
                          : 'bg-yellow-100'
                      )}
                    >
                      <AlertCircle
                        className={clsx(
                          'w-4 h-4',
                          alert.level === 'high'
                            ? 'text-red-600'
                            : alert.level === 'medium'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800">
                          {alert.memberName}
                        </span>
                        <StatusBadge status={alert.level} type="risk" />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        {getAlertTypeText(alert.type)}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {alert.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDateTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card title="今日数据概览">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{stats.memberCount}</p>
            <p className="text-sm text-slate-500 mt-1">会员总数</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Building2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{storesByRisk.length}</p>
            <p className="text-sm text-slate-500 mt-1">门店数量</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">
              {((stats.totalGift / stats.totalBalance) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-slate-500 mt-1">赠金占比</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">
              {storesByRisk.filter((s) => s.riskScore >= 60).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">高风险门店</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
