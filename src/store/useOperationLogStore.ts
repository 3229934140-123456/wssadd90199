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
    { id: 'ol1', type: 'recharge_apply', targetId: 'r1', targetName: '王女士', detail: '充值申请 ¥150,000，赠送 ¥30,000，待财务终审', operator: '前台操作员', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T09:30:00', amount: 150000 },
    { id: 'ol2', type: 'recharge_apply', targetId: 'r2', targetName: '李女士', detail: '充值申请 ¥80,000，赠送 ¥12,000，待店长审批', operator: '前台操作员', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T10:15:00', amount: 80000 },
    { id: 'ol3', type: 'recharge', targetId: 'r3', targetName: '王女士', detail: '充值入账 ¥20,000，赠送 ¥3,000', operator: '系统自动', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T08:45:00', amount: 20000 },
    { id: 'ol4', type: 'consume', targetId: 'c1', targetName: '王女士', detail: '消费项目：光子嫩肤，金额 ¥3,800', operator: '前台小李', storeName: '北京朝阳旗舰店', createdAt: '2025-06-22T14:30:00', amount: 3800 },
    { id: 'ol5', type: 'recharge', targetId: 'r4', targetName: '张女士', detail: '充值入账 ¥10,000，赠送 ¥1,000', operator: '系统自动', storeName: '上海浦东分店', createdAt: '2025-06-21T16:30:00', amount: 10000 },
    { id: 'ol6', type: 'reject', targetId: 'r5', targetName: '刘女士', detail: '充值审批驳回：付款凭证不清晰', operator: '王财务', storeName: '深圳南山分店', createdAt: '2025-06-21T15:00:00', amount: 0 },
    { id: 'ol7', type: 'freeze', targetId: 'm4', targetName: '陈女士', detail: '账户冻结，原因：高风险账户', operator: '财务管理员', storeName: '成都锦江分店', createdAt: '2025-06-20T10:00:00' },
    { id: 'ol8', type: 'unfreeze', targetId: 'm9', targetName: '吴女士', detail: '账户解冻，争议已解决', operator: '财务管理员', storeName: '杭州西湖分店', createdAt: '2025-06-20T18:00:00' },
    { id: 'ol9', type: 'refund_apply', targetId: 'ref1', targetName: '周女士', detail: '退款申请：申请金额 ¥5,000，预计可退 ¥4,275，原因：个人原因', operator: '前台操作员', storeName: '深圳南山分店', createdAt: '2025-06-20T11:20:00', amount: 4275 },
    { id: 'ol10', type: 'refund_apply', targetId: 'ref2', targetName: '李女士', detail: '退款申请：申请金额 ¥10,000，预计可退 ¥8,550，原因：服务未消费', operator: '前台小张', storeName: '北京朝阳旗舰店', createdAt: '2025-06-20T14:30:00', amount: 8550 },
    { id: 'ol11', type: 'refund', targetId: 'ref2', targetName: '李女士', detail: '退款已通过，退本金 ¥8,550，扣赠金 ¥1,000', operator: '张店长', storeName: '北京朝阳旗舰店', createdAt: '2025-06-21T09:00:00', amount: 8550 },
    { id: 'ol12', type: 'approve', targetId: 'ref2', targetName: '李女士', detail: '退款审批通过', operator: '张店长', storeName: '北京朝阳旗舰店', createdAt: '2025-06-21T09:00:00' },
    { id: 'ol13', type: 'reject', targetId: 'ref3', targetName: '郑女士', detail: '退款审批驳回：已消费项目不支持无理由退款', operator: '李财务', storeName: '广州天河分店', createdAt: '2025-06-21T16:00:00' },
    { id: 'ol14', type: 'consume', targetId: 'c2', targetName: '李女士', detail: '消费项目：热玛吉全脸，金额 ¥28,000', operator: '前台小张', storeName: '北京朝阳旗舰店', createdAt: '2025-06-21T10:00:00', amount: 28000 },
    { id: 'ol15', type: 'recharge', targetId: 'r7', targetName: '赵女士', detail: '充值入账 ¥5,000，赠送 ¥500', operator: '系统自动', storeName: '广州天河分店', createdAt: '2025-06-20T10:15:00', amount: 5000 },
    { id: 'ol16', type: 'consume', targetId: 'c3', targetName: '张女士', detail: '跨店消费：水光针，金额 ¥2,500（原充值门店：上海浦东分店）', operator: '前台小王', storeName: '北京朝阳旗舰店', createdAt: '2025-06-20T15:45:00', amount: 2500 },
    { id: 'ol17', type: 'freeze', targetId: 'm10', targetName: '孙女士', detail: '账户冻结，原因：疑似套现', operator: '财务管理员', storeName: '上海浦东分店', createdAt: '2025-06-19T09:00:00' },
    { id: 'ol18', type: 'recharge', targetId: 'r8', targetName: '钱女士', detail: '充值入账 ¥50,000，赠送 ¥8,000', operator: '王财务', storeName: '杭州西湖分店', createdAt: '2025-06-19T14:00:00', amount: 50000 },
    { id: 'ol19', type: 'approve', targetId: 'r8', targetName: '钱女士', detail: '充值审批通过，金额 ¥50,000，赠送 ¥8,000', operator: '王财务', storeName: '杭州西湖分店', createdAt: '2025-06-19T14:00:00' },
    { id: 'ol20', type: 'consume', targetId: 'c4', targetName: '刘女士', detail: '消费项目：超声炮，金额 ¥15,000', operator: '前台小陈', storeName: '深圳南山分店', createdAt: '2025-06-19T11:20:00', amount: 15000 },
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
      let matchType = true;
      if (filterType !== 'all') {
        if (filterType === 'freeze') {
          matchType = l.type === 'freeze' || l.type === 'unfreeze';
        } else if (filterType === 'refund') {
          matchType = l.type === 'refund' || l.type === 'refund_apply';
        } else if (filterType === 'recharge') {
          matchType = l.type === 'recharge';
        } else {
          matchType = l.type === filterType;
        }
      }
      const matchKeyword =
        l.targetName.includes(searchKeyword) ||
        l.detail.includes(searchKeyword) ||
        l.storeName.includes(searchKeyword);
      return matchType && matchKeyword;
    });
  },
}));
