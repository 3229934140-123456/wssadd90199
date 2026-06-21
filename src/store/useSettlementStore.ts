import { create } from 'zustand';
import type { SettlementRecord, SettlementItem } from '@/types';
import { generateId } from '@/utils/format';

interface SettlementState {
  records: SettlementRecord[];
}

interface SettlementActions {
  addRecord: (record: Omit<SettlementRecord, 'id' | 'createdAt'>) => void;
  confirmRecord: (id: string, confirmedBy: string) => void;
  disputeRecord: (id: string, reason: string) => void;
}

export const useSettlementStore = create<SettlementState & SettlementActions>((set) => ({
  records: [
    {
      id: 'set1',
      periodStart: '2025-06-01',
      periodEnd: '2025-06-15',
      status: 'pending',
      items: [
        { storeId: 's1', storeName: '北京朝阳旗舰店', rechargeTotal: 120000, rechargeCount: 3, consumeLocalTotal: 31800, consumeLocalCount: 2, consumeCrossInTotal: 2500, consumeCrossInCount: 1, consumeCrossOutTotal: 28000, consumeCrossOutCount: 1, crossInShare: 1750, crossOutShare: 8400, netSettlement: 85550 },
        { storeId: 's2', storeName: '上海浦东分店', rechargeTotal: 10000, rechargeCount: 1, consumeLocalTotal: 0, consumeLocalCount: 0, consumeCrossInTotal: 28000, consumeCrossInCount: 1, consumeCrossOutTotal: 2500, consumeCrossOutCount: 1, crossInShare: 19600, crossOutShare: 750, netSettlement: 28850 },
      ],
      totalNetSettlement: 114400,
      createdAt: '2025-06-16T10:00:00',
    },
    {
      id: 'set2',
      periodStart: '2025-06-16',
      periodEnd: '2025-06-22',
      status: 'confirmed',
      items: [
        { storeId: 's3', storeName: '深圳南山分店', rechargeTotal: 0, rechargeCount: 0, consumeLocalTotal: 15000, consumeLocalCount: 1, consumeCrossInTotal: 12000, consumeCrossInCount: 1, consumeCrossOutTotal: 0, consumeCrossOutCount: 0, crossInShare: 7200, crossOutShare: 0, netSettlement: 22200 },
        { storeId: 's4', storeName: '广州天河分店', rechargeTotal: 5000, rechargeCount: 1, consumeLocalTotal: 0, consumeLocalCount: 0, consumeCrossInTotal: 0, consumeCrossInCount: 0, consumeCrossOutTotal: 0, consumeCrossOutCount: 0, crossInShare: 0, crossOutShare: 0, netSettlement: 5000 },
      ],
      totalNetSettlement: 27200,
      createdAt: '2025-06-22T09:00:00',
      confirmedAt: '2025-06-22T14:30:00',
      confirmedBy: '张店长',
    },
    {
      id: 'set3',
      periodStart: '2025-05-16',
      periodEnd: '2025-05-31',
      status: 'disputed',
      items: [
        { storeId: 's5', storeName: '成都锦江分店', rechargeTotal: 45000, rechargeCount: 1, consumeLocalTotal: 0, consumeLocalCount: 0, consumeCrossInTotal: 0, consumeCrossInCount: 0, consumeCrossOutTotal: 0, consumeCrossOutCount: 0, crossInShare: 0, crossOutShare: 0, netSettlement: 45000 },
      ],
      totalNetSettlement: 45000,
      createdAt: '2025-06-01T10:00:00',
      confirmedAt: '2025-06-02T11:00:00',
      confirmedBy: '李店长',
      disputeReason: '跨店分成比例与实际不符，请重新核算',
    },
  ],

  addRecord: (record) =>
    set((state) => ({
      records: [
        { ...record, id: generateId(), createdAt: new Date().toISOString() },
        ...state.records,
      ],
    })),

  confirmRecord: (id, confirmedBy) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? { ...r, status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy }
          : r
      ),
    })),

  disputeRecord: (id, reason) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? { ...r, status: 'disputed', disputeReason: reason }
          : r
      ),
    })),
}));
