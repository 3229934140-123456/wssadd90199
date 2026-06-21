import { useState } from 'react';
import {
  Search,
  Filter,
  ShoppingCart,
  Plus,
  User,
  Building2,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRightLeft,
  CreditCard,
} from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import AmountDisplay from '@/components/AmountDisplay';
import StatusBadge from '@/components/StatusBadge';
import { useConsumeStore } from '@/store/useConsumeStore';
import { useMemberStore } from '@/store/useMemberStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { calculateMixedDeduction } from '@/utils/calculator';
import { formatDateTime, formatPhone } from '@/utils/format';
import { clsx } from 'clsx';
import type { ConsumeRecord, Member, Project } from '@/types';

export default function Consume() {
  const { records, projects, searchKeyword, filterStore, currentPage, pageSize, setSearchKeyword, setFilterStore, setCurrentPage, addRecord, getFilteredRecords } = useConsumeStore();
  const { members, updateMemberBalance } = useMemberStore();
  const { stores } = useSettingsStore();
  const { addLog } = useOperationLogStore();

  const [activeTab, setActiveTab] = useState<'consume' | 'history'>('consume');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredRecords = getFilteredRecords();

  const totalAmount = selectedProjects.reduce((sum, p) => sum + p.price, 0);

  const deduction = selectedMember
    ? calculateMixedDeduction(
        selectedProjects.map((p) => ({ name: p.name, price: p.price, canUseGift: p.canUseGift })),
        selectedMember
      )
    : { principal: 0, gift: 0, items: [] as { name: string; price: number; principal: number; gift: number; canUseGift: boolean }[] };

  const isCrossStore = selectedMember && selectedStore && selectedMember.storeId !== selectedStore;

  const handleSelectMember = (member: Member) => {
    if (member.status === 'frozen') return;
    setSelectedMember(member);
    setShowMemberSelect(false);
    setMemberSearch('');
  };

  const handleAddProject = (project: Project) => {
    if (selectedProjects.find((p) => p.id === project.id)) return;
    setSelectedProjects([...selectedProjects, project]);
  };

  const handleRemoveProject = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter((p) => p.id !== projectId));
  };

  const handleConsume = () => {
    if (!selectedMember || selectedProjects.length === 0) return;

    if (selectedMember.status === 'frozen') {
      alert('该会员已冻结，无法进行核销');
      return;
    }

    const store = stores.find((s) => s.id === (selectedStore || selectedMember.storeId));
    const originalStore = stores.find((s) => s.id === selectedMember.storeId);

    addRecord({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      storeId: selectedStore || selectedMember.storeId,
      storeName: store?.name || selectedMember.storeName,
      originalStoreId: selectedMember.storeId,
      originalStoreName: originalStore?.name || selectedMember.storeName,
      projectName: selectedProjects.map((p) => p.name).join('、'),
      amount: totalAmount,
      principalDeduction: deduction.principal,
      giftDeduction: deduction.gift,
      performanceRatio: isCrossStore ? 0.7 : 1,
      isCrossStore: !!isCrossStore,
      operator: '前台操作员',
    });

    updateMemberBalance(selectedMember.id, -deduction.principal, -deduction.gift);

    addLog({
      type: 'consume',
      targetId: selectedMember.id,
      targetName: selectedMember.name,
      detail: `消费项目：${selectedProjects.map((p) => p.name).join('、')}，金额 ¥${totalAmount.toLocaleString()}`,
      operator: '前台操作员',
      storeName: store?.name || selectedMember.storeName,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedProjects([]);
      setActiveTab('history');
    }, 1500);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.includes(memberSearch) || m.phone.includes(memberSearch)
  );

  const projectCategories = [...new Set(projects.map((p) => p.category))];

  const historyColumns = [
    {
      key: 'member',
      title: '会员',
      width: '150px',
      render: (record: ConsumeRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-800">{record.memberName}</span>
        </div>
      ),
    },
    {
      key: 'projectName',
      title: '消费项目',
      render: (record: ConsumeRecord) => (
        <span className="text-sm text-slate-700">{record.projectName}</span>
      ),
    },
    {
      key: 'storeName',
      title: '消费门店',
      render: (record: ConsumeRecord) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-sm">{record.storeName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '消费金额',
      align: 'right' as const,
      render: (record: ConsumeRecord) => (
        <AmountDisplay amount={record.amount} size="sm" className="font-medium" />
      ),
    },
    {
      key: 'deduction',
      title: '抵扣明细',
      render: (record: ConsumeRecord) => (
        <div className="text-xs">
          <span className="text-emerald-600">本金 ¥{record.principalDeduction.toLocaleString()}</span>
          {' / '}
          <span className="text-orange-500">赠金 ¥{record.giftDeduction.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'crossStore',
      title: '跨店标识',
      render: (record: ConsumeRecord) =>
        record.isCrossStore ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
            <ArrowRightLeft className="w-3 h-3" />
            跨店
          </span>
        ) : (
          <span className="text-xs text-slate-400">本店</span>
        ),
    },
    {
      key: 'createdAt',
      title: '消费时间',
      render: (record: ConsumeRecord) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">消费核销</h2>
          <p className="text-sm text-slate-500 mt-1">
            项目消费核销，自动计算本金/赠金抵扣，支持跨店消费
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('consume')}
          className={clsx(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'consume'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          消费录入
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={clsx(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          核销记录
        </button>
      </div>

      {activeTab === 'consume' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card title="选择会员">
              {selectedMember ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl">
                      {selectedMember.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-800">
                          {selectedMember.name}
                        </h4>
                        <StatusBadge status={selectedMember.status} type="member" />
                        {selectedMember.status === 'frozen' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                            已冻结
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatPhone(selectedMember.phone)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedMember.storeName}
                      </p>
                      {selectedMember.status === 'frozen' && (
                        <p className="text-xs text-red-500 mt-1">
                          该会员已冻结，无法进行核销
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMemberSelect(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    更换会员
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowMemberSelect(true)}
                  className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <User className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">点击选择会员</p>
                </button>
              )}

              {selectedMember && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600 mb-1">本金余额</p>
                    <AmountDisplay
                      amount={selectedMember.principalBalance}
                      color="green"
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-xs text-orange-600 mb-1">赠金余额</p>
                    <AmountDisplay
                      amount={selectedMember.giftBalance}
                      color="orange"
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500 mb-1">总余额</p>
                    <AmountDisplay
                      amount={selectedMember.principalBalance + selectedMember.giftBalance}
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card title="消费门店">
              <div className="flex items-center gap-3">
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">默认原门店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              {isCrossStore && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">跨店消费</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      原充值门店：{selectedMember?.storeName}，业绩按 70% 归属消费门店
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card title="选择项目">
              {projectCategories.map((category) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {category}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {projects
                      .filter((p) => p.category === category)
                      .map((project) => {
                        const isSelected = selectedProjects.find(
                          (p) => p.id === project.id
                        );
                        return (
                          <button
                            key={project.id}
                            onClick={() => handleAddProject(project)}
                            disabled={!selectedMember}
                            className={clsx(
                              'p-3 rounded-lg border text-left transition-all',
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300',
                              !selectedMember && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <p className="text-sm font-medium text-slate-800">
                              {project.name}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-sm text-orange-500 font-semibold">
                                ¥{project.price.toLocaleString()}
                              </span>
                              {!project.canUseGift && (
                                <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                  仅本金
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="消费明细" className="sticky top-6">
              {selectedProjects.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请先选择消费项目</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                    {selectedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {project.name}
                          </p>
                          {!project.canUseGift && (
                            <span className="text-xs text-red-500">仅本金可用</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <AmountDisplay amount={project.price} size="sm" />
                          <button
                            onClick={() => handleRemoveProject(project.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">项目数量</span>
                      <span className="text-slate-800">{selectedProjects.length} 项</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">消费总额</span>
                      <AmountDisplay amount={totalAmount} size="sm" className="font-semibold" />
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600">扣本金</span>
                        <AmountDisplay amount={deduction.principal} color="green" size="sm" />
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-orange-600">扣赠金</span>
                        <AmountDisplay amount={deduction.gift} color="orange" size="sm" />
                      </div>
                    </div>

                    {deduction.items.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">项目抵扣明细</p>
                        <div className="space-y-1.5">
                          {deduction.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-700 font-medium">{item.name}</span>
                                <span className="text-slate-400 ml-1">¥{item.price.toLocaleString()}</span>
                              </div>
                              {item.canUseGift ? (
                                <span className="text-slate-600 shrink-0">
                                  本金 ¥{item.principal.toLocaleString()} / 赠金 ¥{item.gift.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-600 shrink-0">
                                  仅本金 ¥{item.principal.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isCrossStore && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-600 flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            业绩归属
                          </span>
                          <span className="text-blue-700">70%</span>
                        </div>
                      </div>
                    )}

                    {selectedMember &&
                      deduction.principal > selectedMember.principalBalance && (
                        <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-red-600">
                            余额不足，请先充值
                          </span>
                        </div>
                      )}

                    {selectedMember && selectedMember.status === 'frozen' && (
                      <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-600">
                          该会员已冻结，无法核销
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConsume}
                    disabled={
                      !selectedMember ||
                      selectedProjects.length === 0 ||
                      (selectedMember && deduction.principal > selectedMember.principalBalance) ||
                      (selectedMember && selectedMember.status === 'frozen')
                    }
                    className="w-full mt-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    确认核销
                  </button>
                </>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card padding="none">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索会员、项目..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-56 h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
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
              </div>
            </div>
          </div>

          <DataTable
            columns={historyColumns}
            data={filteredRecords}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredRecords.length,
              onChange: setCurrentPage,
            }}
          />
        </Card>
      )}

      {showMemberSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMemberSelect(false)}
          ></div>
          <div className="relative w-[520px] bg-white rounded-2xl shadow-xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800">选择会员</h3>
                <button
                  onClick={() => setShowMemberSelect(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索会员姓名、手机号..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">未找到相关会员</p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const isFrozen = member.status === 'frozen';
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      disabled={isFrozen}
                      title={isFrozen ? '已冻结，不可核销' : undefined}
                      className={clsx(
                        'w-full p-3 flex items-center gap-3 rounded-lg transition-colors text-left',
                        isFrozen
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-lg',
                        isFrozen
                          ? 'bg-slate-400'
                          : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      )}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'font-medium truncate',
                            isFrozen ? 'text-slate-400' : 'text-slate-800'
                          )}>
                            {member.name}
                          </span>
                          {isFrozen ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                              已冻结
                            </span>
                          ) : (
                            <StatusBadge status={member.status} type="member" />
                          )}
                        </div>
                        <p className={clsx(
                          'text-xs',
                          isFrozen ? 'text-slate-400' : 'text-slate-500'
                        )}>
                          {formatPhone(member.phone)} · {member.storeName}
                        </p>
                      </div>
                      {!isFrozen && (
                        <div className="text-right">
                          <AmountDisplay
                            amount={member.principalBalance + member.giftBalance}
                            size="sm"
                          />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">核销成功</h3>
            <p className="text-sm text-slate-500">消费已成功记录</p>
          </div>
        </div>
      )}
    </div>
  );
}
