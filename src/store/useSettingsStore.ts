import { create } from 'zustand';
import type { Store, RiskAlert, GiftRule, RiskThresholds, ApprovalFlow, DashboardStats } from '@/types';
import { mockStores } from '@/mock/stores';
import { mockAlerts } from '@/mock/alerts';
import { mockGiftRules, mockRiskThresholds, mockApprovalFlow } from '@/mock/settings';

interface SettingsState {
  stores: Store[];
  alerts: RiskAlert[];
  giftRules: GiftRule[];
  riskThresholds: RiskThresholds;
  approvalFlow: ApprovalFlow;
  selectedStoreId: string;
}

interface SettingsActions {
  setSelectedStoreId: (id: string) => void;
  updateStoreLimit: (storeId: string, singleLimit: number, dailyLimit: number) => void;
  updateGiftRules: (rules: GiftRule[]) => void;
  updateRiskThresholds: (thresholds: RiskThresholds) => void;
  updateApprovalFlow: (flow: ApprovalFlow) => void;
  handleAlert: (alertId: string) => void;
  getPendingAlertCount: () => number;
  getDashboardStats: () => DashboardStats;
  getStoresByRiskRank: () => Store[];
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  stores: mockStores,
  alerts: mockAlerts,
  giftRules: mockGiftRules,
  riskThresholds: mockRiskThresholds,
  approvalFlow: mockApprovalFlow,
  selectedStoreId: 'all',

  setSelectedStoreId: (id) => set({ selectedStoreId: id }),

  updateStoreLimit: (storeId, singleLimit, dailyLimit) =>
    set((state) => ({
      stores: state.stores.map((s) =>
        s.id === storeId ? { ...s, singleLimit, dailyLimit } : s
      ),
    })),

  updateGiftRules: (rules) => set({ giftRules: rules }),

  updateRiskThresholds: (thresholds) => set({ riskThresholds: thresholds }),

  updateApprovalFlow: (flow) => set({ approvalFlow: flow }),

  handleAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'handled' } : a
      ),
    })),

  getPendingAlertCount: () => {
    return get().alerts.filter((a) => a.status === 'pending').length;
  },

  getDashboardStats: () => {
    const { stores } = get();
    const totalBalance = stores.reduce((sum, s) => sum + s.totalBalance, 0);
    const todayRecharge = stores.reduce((sum, s) => sum + s.todayRecharge, 0);
    const todayConsume = stores.reduce((sum, s) => sum + s.todayConsume, 0);
    const todayRefund = stores.reduce((sum, s) => sum + s.todayRefund, 0);
    
    const totalPrincipal = totalBalance * 0.78;
    const totalGift = totalBalance * 0.22;

    return {
      totalBalance,
      totalPrincipal,
      totalGift,
      todayRecharge,
      todayConsume,
      todayRefund,
      pendingRechargeCount: 0,
      pendingRefundCount: 0,
      alertCount: get().alerts.filter((a) => a.status === 'pending').length,
      memberCount: 368,
    };
  },

  getStoresByRiskRank: () => {
    return [...get().stores].sort((a, b) => b.riskScore - a.riskScore);
  },
}));
