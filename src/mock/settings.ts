import type { Project, GiftRule, RiskThresholds, ApprovalFlow } from '@/types';

export const mockProjects: Project[] = [
  { id: 'p1', name: '光子嫩肤', price: 3800, category: '皮肤管理', canUseGift: true },
  { id: 'p2', name: '热玛吉全脸', price: 28000, category: '抗衰紧致', canUseGift: true },
  { id: 'p3', name: '水光针', price: 2500, category: '补水保湿', canUseGift: true },
  { id: 'p4', name: '超声炮', price: 15000, category: '抗衰紧致', canUseGift: true },
  { id: 'p5', name: '线雕提升', price: 45000, category: '抗衰紧致', canUseGift: false },
  { id: 'p6', name: '果酸换肤', price: 1200, category: '皮肤管理', canUseGift: true },
  { id: 'p7', name: '玻尿酸填充', price: 6800, category: '注射美容', canUseGift: true },
  { id: 'p8', name: '热拉提', price: 12000, category: '抗衰紧致', canUseGift: true },
  { id: 'p9', name: '瘦脸针', price: 3500, category: '注射美容', canUseGift: false },
  { id: 'p10', name: '双眼皮手术', price: 12800, category: '整形手术', canUseGift: false },
];

export const mockGiftRules: GiftRule[] = [
  { id: 'gr1', minAmount: 0, maxAmount: 9999, giftRatio: 0.1, maxGift: 1000 },
  { id: 'gr2', minAmount: 10000, maxAmount: 29999, giftRatio: 0.15, maxGift: 4500 },
  { id: 'gr3', minAmount: 30000, maxAmount: 49999, giftRatio: 0.2, maxGift: 10000 },
  { id: 'gr4', minAmount: 50000, maxAmount: 99999, giftRatio: 0.3, maxGift: 30000 },
  { id: 'gr5', minAmount: 100000, maxAmount: 999999, giftRatio: 0.5, maxGift: 100000 },
];

export const mockRiskThresholds: RiskThresholds = {
  frequentRechargeDays: 30,
  frequentRechargeCount: 3,
  phoneChangeCount: 2,
  highGiftRatio: 0.3,
};

export const mockApprovalFlow: ApprovalFlow = {
  storeLimit: 50000,
  financeLimit: 100000,
  refundFeeRate: 0.05,
};
