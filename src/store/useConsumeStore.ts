import { create } from 'zustand';
import type { ConsumeRecord, Project } from '@/types';
import { mockConsumes } from '@/mock/consumes';
import { mockProjects } from '@/mock/settings';
import { generateId } from '@/utils/format';

interface ConsumeState {
  records: ConsumeRecord[];
  projects: Project[];
  searchKeyword: string;
  filterStore: string;
  currentPage: number;
  pageSize: number;
}

interface ConsumeActions {
  setSearchKeyword: (keyword: string) => void;
  setFilterStore: (store: string) => void;
  setCurrentPage: (page: number) => void;
  getFilteredRecords: () => ConsumeRecord[];
  addRecord: (record: Omit<ConsumeRecord, 'id' | 'createdAt'>) => void;
  getMemberConsumes: (memberId: string) => ConsumeRecord[];
}

export const useConsumeStore = create<ConsumeState & ConsumeActions>((set, get) => ({
  records: mockConsumes,
  projects: mockProjects,
  searchKeyword: '',
  filterStore: 'all',
  currentPage: 1,
  pageSize: 10,

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, currentPage: 1 }),
  setFilterStore: (store) => set({ filterStore: store, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),

  getFilteredRecords: () => {
    const { records, searchKeyword, filterStore } = get();
    return records.filter((r) => {
      const matchKeyword =
        r.memberName.includes(searchKeyword) ||
        r.projectName.includes(searchKeyword);
      const matchStore = filterStore === 'all' || r.storeId === filterStore;
      return matchKeyword && matchStore;
    });
  },

  addRecord: (record) =>
    set((state) => ({
      records: [
        {
          ...record,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
        ...state.records,
      ],
    })),

  getMemberConsumes: (memberId) => {
    return get().records.filter((r) => r.memberId === memberId);
  },
}));
