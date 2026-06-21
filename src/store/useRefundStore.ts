import { create } from 'zustand';
import type { RefundRecord } from '@/types';
import { mockRefunds } from '@/mock/refunds';
import { generateId } from '@/utils/format';

interface RefundState {
  records: RefundRecord[];
  filterStatus: string;
  filterStore: string;
  searchKeyword: string;
  currentPage: number;
  pageSize: number;
}

interface RefundActions {
  setFilterStatus: (status: string) => void;
  setFilterStore: (store: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setCurrentPage: (page: number) => void;
  getFilteredRecords: () => RefundRecord[];
  getPendingCount: () => number;
  approveRefund: (id: string, approver: string) => void;
  rejectRefund: (id: string, approver: string) => void;
  addRefund: (record: Omit<RefundRecord, 'id' | 'createdAt' | 'status'>) => void;
}

export const useRefundStore = create<RefundState & RefundActions>((set, get) => ({
  records: mockRefunds,
  filterStatus: 'all',
  filterStore: 'all',
  searchKeyword: '',
  currentPage: 1,
  pageSize: 10,

  setFilterStatus: (status) => set({ filterStatus: status, currentPage: 1 }),
  setFilterStore: (store) => set({ filterStore: store, currentPage: 1 }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),

  getFilteredRecords: () => {
    const { records, filterStatus, filterStore, searchKeyword } = get();
    return records.filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchStore = filterStore === 'all' || r.storeId === filterStore;
      const matchKeyword = r.memberName.includes(searchKeyword);
      return matchStatus && matchStore && matchKeyword;
    });
  },

  getPendingCount: () => {
    return get().records.filter((r) => r.status === 'pending').length;
  },

  approveRefund: (id, approver) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approver,
              approvedAt: new Date().toISOString(),
            }
          : r
      ),
    })),

  rejectRefund: (id, approver) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              approver,
              approvedAt: new Date().toISOString(),
            }
          : r
      ),
    })),

  addRefund: (record) =>
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
