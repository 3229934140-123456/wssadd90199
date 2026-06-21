import { create } from 'zustand';
import type { RechargeRecord } from '@/types';
import { mockRecharges } from '@/mock/recharges';
import { generateId } from '@/utils/format';

interface RechargeState {
  records: RechargeRecord[];
  filterStatus: string;
  filterStore: string;
  searchKeyword: string;
  currentPage: number;
  pageSize: number;
  selectedRecord: RechargeRecord | null;
}

interface RechargeActions {
  setFilterStatus: (status: string) => void;
  setFilterStore: (store: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedRecord: (record: RechargeRecord | null) => void;
  getFilteredRecords: () => RechargeRecord[];
  getPendingCount: () => number;
  approveRecord: (id: string, approver: string, opinion: string) => void;
  rejectRecord: (id: string, approver: string, opinion: string) => void;
  addRecord: (record: Omit<RechargeRecord, 'id' | 'createdAt' | 'status'>) => void;
}

export const useRechargeStore = create<RechargeState & RechargeActions>((set, get) => ({
  records: mockRecharges,
  filterStatus: 'all',
  filterStore: 'all',
  searchKeyword: '',
  currentPage: 1,
  pageSize: 10,
  selectedRecord: null,

  setFilterStatus: (status) => set({ filterStatus: status, currentPage: 1 }),
  setFilterStore: (store) => set({ filterStore: store, currentPage: 1 }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),

  getFilteredRecords: () => {
    const { records, filterStatus, filterStore, searchKeyword } = get();
    return records.filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchStore = filterStore === 'all' || r.storeId === filterStore;
      const matchKeyword =
        r.memberName.includes(searchKeyword) ||
        r.memberPhone.includes(searchKeyword);
      return matchStatus && matchStore && matchKeyword;
    });
  },

  getPendingCount: () => {
    return get().records.filter((r) => r.status === 'pending' || r.status === 'pending_finance').length;
  },

  approveRecord: (id, approver, opinion) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approver,
              approveOpinion: opinion,
              approvedAt: new Date().toISOString(),
            }
          : r
      ),
    })),

  rejectRecord: (id, approver, opinion) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              approver,
              approveOpinion: opinion,
              approvedAt: new Date().toISOString(),
            }
          : r
      ),
    })),

  addRecord: (record) =>
    set((state) => ({
      records: [
        {
          ...record,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        ...state.records,
      ],
    })),
}));
