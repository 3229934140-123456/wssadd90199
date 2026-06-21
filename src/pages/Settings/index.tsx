import { useState } from 'react';
import {
  Building2,
  Gift,
  ShieldAlert,
  Layers,
  Save,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import Card from '@/components/Card';
import { useSettingsStore } from '@/store/useSettingsStore';
import { clsx } from 'clsx';
import type { GiftRule } from '@/types';

export default function SettingsPage() {
  const {
    stores,
    giftRules,
    riskThresholds,
    approvalFlow,
    updateStoreLimit,
    updateGiftRules,
    updateRiskThresholds,
    updateApprovalFlow,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'store' | 'gift' | 'risk' | 'approval'>('store');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [localGiftRules, setLocalGiftRules] = useState<GiftRule[]>(giftRules);
  const [localRiskThresholds, setLocalRiskThresholds] = useState(riskThresholds);
  const [localApprovalFlow, setLocalApprovalFlow] = useState(approvalFlow);

  const [storeLimits, setStoreLimits] = useState(
    stores.map((s) => ({
      id: s.id,
      name: s.name,
      singleLimit: s.singleLimit,
      dailyLimit: s.dailyLimit,
    }))
  );

  const handleStoreLimitChange = (storeId: string, field: string, value: number) => {
    setStoreLimits(
      storeLimits.map((s) =>
        s.id === storeId ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSaveStoreLimits = () => {
    storeLimits.forEach((s) => {
      updateStoreLimit(s.id, s.singleLimit, s.dailyLimit);
    });
    showSaveToast();
  };

  const handleGiftRuleChange = (index: number, field: string, value: number) => {
    const newRules = [...localGiftRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setLocalGiftRules(newRules);
  };

  const handleAddGiftRule = () => {
    const newRule: GiftRule = {
      id: `gr${Date.now()}`,
      minAmount: 0,
      maxAmount: 0,
      giftRatio: 0.1,
      maxGift: 0,
    };
    setLocalGiftRules([...localGiftRules, newRule]);
  };

  const handleRemoveGiftRule = (index: number) => {
    setLocalGiftRules(localGiftRules.filter((_, i) => i !== index));
  };

  const handleSaveGiftRules = () => {
    updateGiftRules(localGiftRules);
    showSaveToast();
  };

  const handleSaveRiskThresholds = () => {
    updateRiskThresholds(localRiskThresholds);
    showSaveToast();
  };

  const handleSaveApprovalFlow = () => {
    updateApprovalFlow(localApprovalFlow);
    showSaveToast();
  };

  const showSaveToast = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const tabs = [
    { key: 'store', label: '门店额度', icon: Building2 },
    { key: 'gift', label: '赠送规则', icon: Gift },
    { key: 'risk', label: '风险阈值', icon: ShieldAlert },
    { key: 'approval', label: '审批流程', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">规则配置</h2>
          <p className="text-sm text-slate-500 mt-1">
            配置门店额度、赠送规则、风险阈值等系统参数
          </p>
        </div>
      </div>

      <Card padding="none">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">门店充值额度配置</h3>
                <button
                  onClick={handleSaveStoreLimits}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  保存配置
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        门店名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        店长
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        单笔额度（元）
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        单日额度（元）
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        风险等级
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storeLimits.map((store, index) => (
                      <tr key={store.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-800">
                              {store.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {stores[index].manager}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <input
                              type="number"
                              value={store.singleLimit}
                              onChange={(e) =>
                                handleStoreLimitChange(
                                  store.id,
                                  'singleLimit',
                                  Number(e.target.value)
                                )
                              }
                              className="w-32 h-8 px-2 text-right rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <input
                              type="number"
                              value={store.dailyLimit}
                              onChange={(e) =>
                                handleStoreLimitChange(
                                  store.id,
                                  'dailyLimit',
                                  Number(e.target.value)
                                )
                              }
                              className="w-32 h-8 px-2 text-right rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              stores[index].riskScore >= 80
                                ? 'bg-red-100 text-red-700'
                                : stores[index].riskScore >= 60
                                ? 'bg-orange-100 text-orange-700'
                                : stores[index].riskScore >= 40
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            )}
                          >
                            {stores[index].riskScore >= 80
                              ? '高风险'
                              : stores[index].riskScore >= 60
                              ? '中高风险'
                              : stores[index].riskScore >= 40
                              ? '中风险'
                              : '低风险'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'gift' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">充值赠送规则配置</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddGiftRule}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    添加档位
                  </button>
                  <button
                    onClick={handleSaveGiftRules}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    保存配置
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {localGiftRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium text-slate-800">档位 {index + 1}</span>
                      </div>
                      {localGiftRules.length > 1 && (
                        <button
                          onClick={() => handleRemoveGiftRule(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">充值金额下限（元）</label>
                        <input
                          type="number"
                          value={rule.minAmount}
                          onChange={(e) =>
                            handleGiftRuleChange(index, 'minAmount', Number(e.target.value))
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">充值金额上限（元）</label>
                        <input
                          type="number"
                          value={rule.maxAmount}
                          onChange={(e) =>
                            handleGiftRuleChange(index, 'maxAmount', Number(e.target.value))
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">赠送比例</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={rule.giftRatio * 100}
                            onChange={(e) =>
                              handleGiftRuleChange(
                                index,
                                'giftRatio',
                                Number(e.target.value) / 100
                              )
                            }
                            className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">赠送上限（元）</label>
                        <input
                          type="number"
                          value={rule.maxGift}
                          onChange={(e) =>
                            handleGiftRuleChange(index, 'maxGift', Number(e.target.value))
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">风险预警阈值配置</h3>
                <button
                  onClick={handleSaveRiskThresholds}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  保存配置
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">短期多次充值</h4>
                      <p className="text-xs text-slate-500">设置充值频次预警阈值</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">时间窗口（天）</label>
                      <input
                        type="number"
                        value={localRiskThresholds.frequentRechargeDays}
                        onChange={(e) =>
                          setLocalRiskThresholds({
                            ...localRiskThresholds,
                            frequentRechargeDays: Number(e.target.value),
                          })
                        }
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">充值次数阈值</label>
                      <input
                        type="number"
                        value={localRiskThresholds.frequentRechargeCount}
                        onChange={(e) =>
                          setLocalRiskThresholds({
                            ...localRiskThresholds,
                            frequentRechargeCount: Number(e.target.value),
                          })
                        }
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-orange-100 rounded-lg">
                      <Settings className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">手机号更换</h4>
                      <p className="text-xs text-slate-500">设置换号次数预警阈值</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">换号次数阈值</label>
                    <input
                      type="number"
                      value={localRiskThresholds.phoneChangeCount}
                      onChange={(e) =>
                        setLocalRiskThresholds({
                          ...localRiskThresholds,
                          phoneChangeCount: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </Card>

                <Card className="p-5 col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-yellow-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">高赠送比例预警</h4>
                      <p className="text-xs text-slate-500">设置赠送比例预警线</p>
                    </div>
                  </div>
                  <div className="w-64">
                    <label className="block text-xs text-slate-500 mb-1">高赠送比例阈值（%）</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={localRiskThresholds.highGiftRatio * 100}
                        onChange={(e) =>
                          setLocalRiskThresholds({
                            ...localRiskThresholds,
                            highGiftRatio: Number(e.target.value) / 100,
                          })
                        }
                        className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">审批流程配置</h3>
                <button
                  onClick={handleSaveApprovalFlow}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  保存配置
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">门店审批额度</h4>
                      <p className="text-xs text-slate-500">超过此额度需店长审批</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">门店审批额度（元）</label>
                    <input
                      type="number"
                      value={localApprovalFlow.storeLimit}
                      onChange={(e) =>
                        setLocalApprovalFlow({
                          ...localApprovalFlow,
                          storeLimit: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">财务审批额度</h4>
                      <p className="text-xs text-slate-500">超过此额度需财务终审</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">财务审批额度（元）</label>
                    <input
                      type="number"
                      value={localApprovalFlow.financeLimit}
                      onChange={(e) =>
                        setLocalApprovalFlow({
                          ...localApprovalFlow,
                          financeLimit: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-purple-100 rounded-lg">
                      <Percent className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">退款手续费</h4>
                      <p className="text-xs text-slate-500">退款时收取的手续费比例</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">手续费率（%）</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={localApprovalFlow.refundFeeRate * 100}
                        onChange={(e) =>
                          setLocalApprovalFlow({
                            ...localApprovalFlow,
                            refundFeeRate: Number(e.target.value) / 100,
                          })
                        }
                        className="w-full h-9 px-3 pr-8 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <h4 className="font-medium text-slate-800 mb-4">审批流程示意</h4>
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="px-6 py-3 bg-slate-100 rounded-lg text-center">
                    <p className="text-sm font-medium text-slate-700">前台发起</p>
                    <p className="text-xs text-slate-500">填写申请信息</p>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="px-6 py-3 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-700">门店店长审批</p>
                    <p className="text-xs text-emerald-600">
                      ¥{localApprovalFlow.storeLimit.toLocaleString()} 以上
                    </p>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="px-6 py-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">总部财务终审</p>
                    <p className="text-xs text-blue-600">
                      ¥{localApprovalFlow.financeLimit.toLocaleString()} 以上
                    </p>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="px-6 py-3 bg-green-50 rounded-lg text-center border border-green-200">
                    <p className="text-sm font-medium text-green-700">充值到账</p>
                    <p className="text-xs text-green-600">本金+赠金分账</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {showSaveSuccess && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">保存成功</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
