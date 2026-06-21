export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  storeId: string;
  storeName: string;
  principalBalance: number;
  giftBalance: number;
  status: 'normal' | 'frozen';
  source: string;
  consultant: string;
  createdAt: string;
  riskTags: string[];
  rechargeCount30d: number;
  phoneChangeCount: number;
  avgGiftRatio: number;
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  storeId: string;
  storeName: string;
  amount: number;
  giftAmount: number;
  giftRatio: number;
  activity: string;
  paymentProof: string;
  paymentProofType: 'file' | 'text';
  paymentProofName: string;
  source: string;
  consultant: string;
  status: 'pending' | 'pending_store' | 'pending_finance' | 'approved' | 'rejected';
  approvalLevel: 'auto' | 'store' | 'finance';
  approver?: string;
  approveOpinion?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface ConsumeRecord {
  id: string;
  memberId: string;
  memberName: string;
  storeId: string;
  storeName: string;
  originalStoreId: string;
  originalStoreName: string;
  projectName: string;
  amount: number;
  principalDeduction: number;
  giftDeduction: number;
  performanceRatio: number;
  isCrossStore: boolean;
  createdAt: string;
  operator: string;
}

export interface RefundRecord {
  id: string;
  memberId: string;
  memberName: string;
  storeId: string;
  storeName: string;
  requestAmount: number;
  refundableAmount: number;
  consumedGift: number;
  fee: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Store {
  id: string;
  name: string;
  manager: string;
  phone: string;
  singleLimit: number;
  dailyLimit: number;
  riskScore: number;
  totalBalance: number;
  todayRecharge: number;
  todayConsume: number;
  todayRefund: number;
}

export interface RiskAlert {
  id: string;
  memberId: string;
  memberName: string;
  type: 'frequent_recharge' | 'phone_change' | 'high_gift_ratio' | 'large_refund';
  description: string;
  level: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'handled';
}

export interface GiftRule {
  id: string;
  minAmount: number;
  maxAmount: number;
  giftRatio: number;
  maxGift: number;
}

export interface RiskThresholds {
  frequentRechargeDays: number;
  frequentRechargeCount: number;
  phoneChangeCount: number;
  highGiftRatio: number;
}

export interface ApprovalFlow {
  storeLimit: number;
  financeLimit: number;
  refundFeeRate: number;
}

export interface Project {
  id: string;
  name: string;
  price: number;
  category: string;
  canUseGift: boolean;
}

export interface DashboardStats {
  totalBalance: number;
  totalPrincipal: number;
  totalGift: number;
  todayRecharge: number;
  todayConsume: number;
  todayRefund: number;
  pendingRechargeCount: number;
  pendingRefundCount: number;
  alertCount: number;
  memberCount: number;
}

export interface OperationLog {
  id: string;
  type: 'recharge' | 'consume' | 'refund' | 'freeze' | 'unfreeze' | 'approve' | 'reject';
  targetId: string;
  targetName: string;
  detail: string;
  operator: string;
  storeName: string;
  createdAt: string;
}
