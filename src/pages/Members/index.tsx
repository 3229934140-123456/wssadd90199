import { useState } from 'react';
import { Search, Filter, Plus, X, User, Building2, Calendar, Phone, UserCheck, Ban } from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import AmountDisplay from '@/components/AmountDisplay';
import { useMemberStore } from '@/store/useMemberStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useConsumeStore } from '@/store/useConsumeStore';
import { useRechargeStore } from '@/store/useRechargeStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDate, formatPhone, formatDateTime } from '@/utils/format';
import { clsx } from 'clsx';
import type { Member } from '@/types';

export default function Members() {
  const {
    members,
    searchKeyword,
    filterStatus,
    filterStore,
    currentPage,
    pageSize,
    selectedMember,
    setSearchKeyword,
    setFilterStatus,
    setFilterStore,
    setCurrentPage,
    setSelectedMember,
    toggleMemberStatus,
    getFilteredMembers,
  } = useMemberStore();

  const { stores } = useSettingsStore();
  const { records: rechargeRecords } = useRechargeStore();
  const { records: consumeRecords, getMemberConsumes } = useConsumeStore();
  const { addLog } = useOperationLogStore();

  const [activeTab, setActiveTab] = useState<'recharge' | 'consume' | 'refund'>('recharge');
  const [showDetail, setShowDetail] = useState(false);

  const filteredMembers = getFilteredMembers();

  const handleToggleStatus = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const wasFrozen = member.status === 'frozen';
    toggleMemberStatus(memberId);
    addLog({
      type: wasFrozen ? 'unfreeze' : 'freeze',
      targetId: memberId,
      targetName: member.name,
      detail: wasFrozen ? '账户解冻' : '账户冻结',
      operator: '财务管理员',
      storeName: member.storeName,
    });
  };

  const handleViewDetail = (member: Member) => {
    setSelectedMember(member);
    setShowDetail(true);
    setActiveTab('recharge');
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedMember(null);
  };

  const memberRecharges = selectedMember
    ? rechargeRecords.filter((r) => r.memberId === selectedMember.id)
    : [];

  const memberConsumes = selectedMember ? getMemberConsumes(selectedMember.id) : [];

  const columns = [
    {
      key: 'member',
      title: '会员信息',
      width: '180px',
      render: (record: Member) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg">
            {record.avatar}
          </div>
          <div>
            <p className="font-medium text-slate-800">{record.name}</p>
            <p className="text-xs text-slate-500">{formatPhone(record.phone)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'storeName',
      title: '所属门店',
      render: (record: Member) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-sm">{record.storeName}</span>
        </div>
      ),
    },
    {
      key: 'balance',
      title: '本金余额',
      align: 'right' as const,
      render: (record: Member) => (
        <AmountDisplay amount={record.principalBalance} color="green" size="sm" />
      ),
    },
    {
      key: 'giftBalance',
      title: '赠金余额',
      align: 'right' as const,
      render: (record: Member) => (
        <AmountDisplay amount={record.giftBalance} color="orange" size="sm" />
      ),
    },
    {
      key: 'totalBalance',
      title: '总余额',
      align: 'right' as const,
      render: (record: Member) => (
        <AmountDisplay
          amount={record.principalBalance + record.giftBalance}
          size="sm"
          className="font-semibold"
        />
      ),
    },
    {
      key: 'riskTags',
      title: '风险标签',
      render: (record: Member) => (
        <div className="flex flex-wrap gap-1">
          {record.riskTags.length === 0 ? (
            <span className="text-xs text-slate-400">无</span>
          ) : (
            record.riskTags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600"
              >
                {tag}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record: Member) => <StatusBadge status={record.status} type="member" />,
    },
    {
      key: 'createdAt',
      title: '注册时间',
      render: (record: Member) => (
        <span className="text-sm text-slate-500">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'center' as const,
      render: (record: Member) => (
        <div className="flex items-center gap-2 justify-center">
          <button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(record);
            }}
          >
            详情
          </button>
          <button
            className={clsx(
              'text-sm font-medium',
              record.status === 'normal'
                ? 'text-orange-600 hover:text-orange-700'
                : 'text-green-600 hover:text-green-700'
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(record.id);
            }}
          >
            {record.status === 'normal' ? '冻结' : '解冻'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">会员储值档案</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理全部门店会员储值账户，查看余额明细与消费记录
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          新增会员
        </button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索会员姓名、手机号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-64 h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="normal">正常</option>
                  <option value="frozen">已冻结</option>
                </select>
              </div>

              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部门店</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                共 {filteredMembers.length} 位会员
              </span>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMembers}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredMembers.length,
            onChange: setCurrentPage,
          }}
          onRowClick={handleViewDetail}
        />
      </Card>

      {showDetail && selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetail}
          ></div>
          <div className="relative w-[560px] h-full bg-white shadow-xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white border-b border-slate-200 z-10">
              <div className="flex items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-slate-800">会员详情</h3>
                <button
                  onClick={closeDetail}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-3xl">
                  {selectedMember.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-bold text-slate-800">
                      {selectedMember.name}
                    </h4>
                    <StatusBadge status={selectedMember.status} type="member" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedMember.phone}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedMember.storeName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600 mb-1">本金余额</p>
                  <AmountDisplay
                    amount={selectedMember.principalBalance}
                    color="green"
                    size="xl"
                  />
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-600 mb-1">赠金余额</p>
                  <AmountDisplay
                    amount={selectedMember.giftBalance}
                    color="orange"
                    size="xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">顾客来源：</span>
                  <span className="text-slate-700">{selectedMember.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">咨询师：</span>
                  <span className="text-slate-700">{selectedMember.consultant}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">注册时间：</span>
                  <span className="text-slate-700">
                    {formatDate(selectedMember.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">换号次数：</span>
                  <span
                    className={clsx(
                      selectedMember.phoneChangeCount >= 2
                        ? 'text-red-600 font-medium'
                        : 'text-slate-700'
                    )}
                  >
                    {selectedMember.phoneChangeCount}次
                  </span>
                </div>
              </div>

              {selectedMember.riskTags.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">风险标签</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.riskTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-b border-slate-200">
                <div className="flex gap-6">
                  {[
                    { key: 'recharge', label: '储值记录', count: memberRecharges.length },
                    { key: 'consume', label: '消费记录', count: memberConsumes.length },
                    { key: 'refund', label: '退款记录', count: 0 },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={clsx(
                        'pb-3 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {tab.label}
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {activeTab === 'recharge' &&
                  memberRecharges.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      暂无储值记录
                    </div>
                  )}
                {activeTab === 'recharge' &&
                  memberRecharges.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={record.status} type="approval" />
                        <span className="text-xs text-slate-400">
                          {formatDateTime(record.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">充值金额</p>
                          <AmountDisplay amount={record.amount} size="sm" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-orange-500">赠送金额</p>
                          <AmountDisplay
                            amount={record.giftAmount}
                            color="orange"
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        活动：{record.activity}
                      </div>
                    </div>
                  ))}

                {activeTab === 'consume' &&
                  memberConsumes.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      暂无消费记录
                    </div>
                  )}
                {activeTab === 'consume' &&
                  memberConsumes.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800">
                          {record.projectName}
                        </span>
                        <AmountDisplay amount={record.amount} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          扣本金 <span className="text-emerald-600">¥{record.principalDeduction.toLocaleString()}</span>
                          {' / '}
                          扣赠金 <span className="text-orange-500">¥{record.giftDeduction.toLocaleString()}</span>
                        </span>
                        <span>{formatDateTime(record.createdAt)}</span>
                      </div>
                      {record.isCrossStore && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-blue-600">
                          跨店消费 · 原门店：{record.originalStoreName}
                        </div>
                      )}
                    </div>
                  ))}

                {activeTab === 'refund' && (
                  <div className="text-center py-8 text-slate-400">
                    暂无退款记录
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleToggleStatus(selectedMember.id)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    selectedMember.status === 'normal'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  )}
                >
                  {selectedMember.status === 'normal' ? '冻结账户' : '解冻账户'}
                </button>
                <button className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  调整余额
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
