import { create } from 'zustand';
import type { OperationLog } from '@/types';
import { generateId } from '@/utils/format';

interface OperationLogState {
  logs: OperationLog[];
  filterType: string;
  searchKeyword: string;
  currentPage: number;
  pageSize: number;
}

interface OperationLogActions {
  setFilterType: (type: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setCurrentPage: (page: number) => void;
  addLog: (log: Omit<OperationLog, 'id' | 'createdAt'>) => void;
  getFilteredLogs: () => OperationLog[];
}

export const useOperationLogStore = create<OperationLogState & OperationLogActions>((set, get) => ({
  logs: [
    { id: 'ol1', type: 'recharge', targetId: 'r3', targetName: '王女士', detail: '充值 ¥20,000，赠送 ¥3,000', operator: '系统自动', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T08:45:00' },
    { id: 'ol2', type: 'approve', targetId: 'r3', targetName: '王女士', detail: '充值审批通过，未超额自动通过', operator: '系统自动', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T08:45:00' },
    { id: 'ol3', type: 'consume', targetId: 'c1', targetName: '王女士', detail: '消费项目：光子嫩肤 ¥3,800', operator: '前台小李', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T14:30:00' },
    { id: 'ol4', type: 'recharge', targetId: 'r4', targetName: '张女士', detail: '充值 ¥10,000，赠送 ¥1,000', operator: '系统自动', storeName: '上海浦东分店', createdAt: '2025-06-21T16:30:00' },
    { id: 'ol5', type: 'reject', targetId: 'r5', targetName: '刘女士', detail: '充值审批驳回：付款凭证不清晰', operator: '王财务', storeName: '深圳南山分店', createdAt: '2025-06-21T15:00:00' },
    { id: 'ol6', type: 'freeze', targetId: 'm4', targetName: '陈女士', detail: '账户冻结，原因：高风险账户', operator: '财务管理员', storeName: '成都锦江分店', createdAt: '2025-06-20T10:00:00' },
    { id: 'ol7', type: 'refund', targetId: 'ref2', targetName: '李女士', detail: '退款申请 ¥10,000，可退 ¥8,550', operator: '前台小张', storeName: '北京朝阳旗舰店', createdAt: '2025-06-20T14:30:00' },
    { id: 'ol8', type: 'approve', targetId: 'ref2', targetName: '李女士', detail: '退款审批通过', operator: '张店长', storeName: '北京朝阳旗舰店', createdAt: '2025-06-21T09:00:00' },
    { id: 'ol9', type: 'consume', targetId: 'c2', targetName: '李女士', detail: '消费项目：热玛吉全脸 ¥28,000', operator: '前台小张', storeName: '北京朝阳旗舰店', createdAt: '2025-06-21T10:00:00' },
    { id: 'ol10', type: 'recharge', targetId: 'r7', targetName: '赵女士', detail: '充值 ¥5,000，赠送 ¥500', operator: '系统自动', storeName: '广州天河分店', createdAt: '2025-06-20T10:15:00' },
  ],
  filterType: 'all',
  searchKeyword: '',
  currentPage: 1,
  pageSize: 20,

  setFilterType: (type) => set({ filterType: type, currentPage: 1 }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        { ...log, id: generateId(), createdAt: new Date().toISOString() },
        ...state.logs,
      ],
    })),

  getFilteredLogs: () => {
    const { logs, filterType, searchKeyword } = get();
    return logs.filter((l) => {
      const matchType = filterType === 'all' || l.type === filterType;
      const matchKeyword =
        l.targetName.includes(searchKeyword) ||
        l.detail.includes(searchKeyword) ||
        l.storeName.includes(searchKeyword);
      return matchType && matchKeyword;
    });
  },
}));
