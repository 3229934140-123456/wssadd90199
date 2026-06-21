import { create } from 'zustand';
import type { Member } from '@/types';
import { mockMembers } from '@/mock/members';

interface MemberState {
  members: Member[];
  selectedMember: Member | null;
  searchKeyword: string;
  filterStatus: string;
  filterStore: string;
  currentPage: number;
  pageSize: number;
}

interface MemberActions {
  setSearchKeyword: (keyword: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterStore: (store: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedMember: (member: Member | null) => void;
  toggleMemberStatus: (memberId: string) => void;
  getFilteredMembers: () => Member[];
  getMemberById: (id: string) => Member | undefined;
  updateMemberBalance: (memberId: string, principal: number, gift: number) => void;
}

export const useMemberStore = create<MemberState & MemberActions>((set, get) => ({
  members: mockMembers,
  selectedMember: null,
  searchKeyword: '',
  filterStatus: 'all',
  filterStore: 'all',
  currentPage: 1,
  pageSize: 10,

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, currentPage: 1 }),
  setFilterStatus: (status) => set({ filterStatus: status, currentPage: 1 }),
  setFilterStore: (store) => set({ filterStore: store, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedMember: (member) => set({ selectedMember: member }),

  toggleMemberStatus: (memberId) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? { ...m, status: m.status === 'normal' ? 'frozen' : 'normal' }
          : m
      ),
    })),

  getFilteredMembers: () => {
    const { members, searchKeyword, filterStatus, filterStore } = get();
    return members.filter((m) => {
      const matchKeyword =
        m.name.includes(searchKeyword) || m.phone.includes(searchKeyword);
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchStore = filterStore === 'all' || m.storeId === filterStore;
      return matchKeyword && matchStatus && matchStore;
    });
  },

  getMemberById: (id) => {
    return get().members.find((m) => m.id === id);
  },

  updateMemberBalance: (memberId, principal, gift) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              principalBalance: m.principalBalance + principal,
              giftBalance: m.giftBalance + gift,
            }
          : m
      ),
      selectedMember:
        state.selectedMember?.id === memberId
          ? {
              ...state.selectedMember,
              principalBalance: state.selectedMember.principalBalance + principal,
              giftBalance: state.selectedMember.giftBalance + gift,
            }
          : state.selectedMember,
    }));
  },
}));
