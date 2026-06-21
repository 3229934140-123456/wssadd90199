import { useState } from 'react';
import {
  Search,
  Filter,
  Undo2,
  Calculator,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  X,
  Check,
  XCircle,
  Eye,
  CreditCard,
  FileText,
  DollarSign,
  Percent,
} from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import AmountDisplay from '@/components/AmountDisplay';
import { useRefundStore } from '@/store/useRefundStore';
import { useMemberStore } from '@/store/useMemberStore';
import { useConsumeStore } from '@/store/useConsumeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { calculateRefund } from '@/utils/calculator';
import { formatDateTime, formatPhone } from '@/utils/format';
import { clsx } from 'clsx';
import type { RefundRecord, Member } from '@/types';

export default function Refund() {
  const {
    records,
    filterStatus,
    filterStore,
    searchKeyword,
    currentPage,
    pageSize,
    setFilterStatus,
    setFilterStore,
    setSearchKeyword,
    setCurrentPage,
    getFilteredRecords,
    approveRefund,
    rejectRefund,
    addRefund,
  } = useRefundStore();

  const { members, updateMemberBalance } = useMemberStore();
  const { getMemberConsumes } = useConsumeStore();
  const { stores, approvalFlow } = useSettingsStore();
  const { addLog } = useOperationLogStore();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RefundRecord | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState<'approve' | 'reject'>('approve');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredRecords = getFilteredRecords();

  const memberConsumes = selectedMember ? getMemberConsumes(selectedMember.id) : [];

  const refundCalc = selectedMember && refundAmount > 0
    ? calculateRefund(refundAmount, selectedMember, memberConsumes, approvalFlow.refundFeeRate)
    : {
        refundableAmount: 0,
        consumedGift: 0,
        fee: 0,
        principalDeduction: 0,
        giftDeduction: 0,
      };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberSelect(false);
    setMemberSearch('');
    setRefundAmount(0);
  };

  const handleSubmitRefund = () => {
    if (!selectedMember || refundAmount <= 0 || !refundReason) return;

    addRefund({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      storeId: selectedMember.storeId,
      storeName: selectedMember.storeName,
      requestAmount: refundAmount,
      refundableAmount: refundCalc.refundableAmount,
      consumedGift: refundCalc.consumedGift,
      fee: refundCalc.fee,
      reason: refundReason,
    });

    addLog({
      type: 'refund_apply',
      targetId: selectedMember.id,
      targetName: selectedMember.name,
      detail: `退款申请：申请金额 ¥${refundAmount.toLocaleString()}，预计可退 ¥${refundCalc.refundableAmount.toLocaleString()}，原因：${refundReason}`,
      operator: '前台操作员',
      storeName: selectedMember.storeName,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setActiveTab('history');
      setSelectedMember(null);
      setRefundAmount(0);
      setRefundReason('');
    }, 1500);
  };

  const handleApprove = (record: RefundRecord, type: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setApproveType(type);
    setShowApproveModal(true);
  };

  const confirmApprove = () => {
    if (!selectedRecord) return;
    if (approveType === 'approve') {
      approveRefund(selectedRecord.id, '财务管理员');
      const member = members.find((m) => m.id === selectedRecord.memberId);
      if (member) {
        const calc = calculateRefund(
          selectedRecord.requestAmount,
          member,
          getMemberConsumes(member.id),
          approvalFlow.refundFeeRate
        );
        updateMemberBalance(member.id, -calc.principalDeduction, -calc.giftDeduction);
        addLog({
          type: 'refund',
          targetId: member.id,
          targetName: member.name,
          detail: `退款审批通过，退本金 ¥${calc.principalDeduction.toLocaleString()}，扣赠金 ¥${calc.giftDeduction.toLocaleString()}`,
          operator: '财务管理员',
          storeName: member.storeName,
        });
      }
    } else {
      rejectRefund(selectedRecord.id, '财务管理员');
      addLog({
        type: 'reject',
        targetId: selectedRecord.id,
        targetName: selectedRecord.memberName,
        detail: '退款审批驳回',
        operator: '财务管理员',
        storeName: selectedRecord.storeName,
      });
    }
    setShowApproveModal(false);
    setSelectedRecord(null);
  };

  const handleViewDetail = (record: RefundRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const filteredMembers = members.filter(
    (m) => m.name.includes(memberSearch) || m.phone.includes(memberSearch)
  );

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const historyColumns = [
    {
      key: 'member',
      title: '会员',
      width: '150px',
      render: (record: RefundRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-800">{record.memberName}</span>
        </div>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      render: (record: RefundRecord) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-sm">{record.storeName}</span>
        </div>
      ),
    },
    {
      key: 'requestAmount',
      title: '申请金额',
      align: 'right' as const,
      render: (record: RefundRecord) => (
        <AmountDisplay amount={record.requestAmount} size="sm" className="font-medium" />
      ),
    },
    {
      key: 'refundableAmount',
      title: '可退金额',
      align: 'right' as const,
      render: (record: RefundRecord) => (
        <AmountDisplay amount={record.refundableAmount} color="green" size="sm" />
      ),
    },
    {
      key: 'fee',
      title: '手续费',
      align: 'right' as const,
      render: (record: RefundRecord) => (
        <span className="text-sm text-orange-500">
          ¥{record.fee.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record: RefundRecord) => <StatusBadge status={record.status} type="approval" />,
    },
    {
      key: 'createdAt',
      title: '申请时间',
      render: (record: RefundRecord) => (
        <span className="text-sm text-slate-500">{formatDateTime(record.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'center' as const,
      width: '140px',
      render: (record: RefundRecord) => (
        <div className="flex items-center gap-1 justify-center">
          <button
            className="text-slate-500 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
            title="查看详情"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(record);
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          {record.status === 'pending' && (
            <>
              <button
                className="text-green-600 hover:text-green-700 p-1.5 rounded hover:bg-green-50 transition-colors"
                title="通过"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(record, 'approve');
                }}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                title="驳回"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(record, 'reject');
                }}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const maxRefund = selectedMember ? selectedMember.principalBalance + selectedMember.giftBalance : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">退款退卡</h2>
          <p className="text-sm text-slate-500 mt-1">
            退款模拟计算、退款申请与审批管理
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('apply')}
          className={clsx(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'apply'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <Calculator className="w-4 h-4 inline mr-2" />
          退款申请
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
          <Undo2 className="w-4 h-4 inline mr-2" />
          退款记录
        </button>
      </div>

      {activeTab === 'apply' ? (
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
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatPhone(selectedMember.phone)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedMember.storeName}
                      </p>
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
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 mb-1">本金余额</p>
                    <AmountDisplay
                      amount={selectedMember.principalBalance}
                      color="green"
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 mb-1">赠金余额</p>
                    <AmountDisplay
                      amount={selectedMember.giftBalance}
                      color="orange"
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card title="退款信息">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">
                    申请退款金额
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={refundAmount || ''}
                      onChange={(e) =>
                        setRefundAmount(
                          Math.min(Number(e.target.value) || 0, maxRefund)
                        )
                      }
                      placeholder="请输入退款金额"
                      disabled={!selectedMember}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-200 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  {selectedMember && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      最多可退：¥{maxRefund.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">
                    退款原因
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="请输入退款原因..."
                    disabled={!selectedMember}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">
                    退款凭证
                  </label>
                  <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs">点击上传退款凭证</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="退款计算预览" className="sticky top-6">
              {!selectedMember || refundAmount <= 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">选择会员并输入金额<br />后自动计算</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">申请退款金额</p>
                    <AmountDisplay amount={refundAmount} size="xl" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        扣回赠金
                      </span>
                      <span className="text-sm text-orange-600 font-medium">
                        - ¥{refundCalc.consumedGift.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        手续费 ({(approvalFlow.refundFeeRate * 100).toFixed(0)}%)
                      </span>
                      <span className="text-sm text-red-600 font-medium">
                        - ¥{refundCalc.fee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-sm text-emerald-600 mb-1">实际可退金额</p>
                    <AmountDisplay
                      amount={refundCalc.refundableAmount}
                      color="green"
                      size="xl"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">扣款明细</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">扣本金 ¥{refundCalc.principalDeduction.toLocaleString()}</span>
                      <span className="text-orange-500">扣赠金 ¥{refundCalc.giftDeduction.toLocaleString()}</span>
                    </div>
                  </div>

                  {refundAmount > 50000 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-700">
                        该笔退款金额较大，需财务审核后才能到账
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitRefund}
                    disabled={!selectedMember || refundAmount <= 0 || !refundReason}
                    className="w-full py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Undo2 className="w-4 h-4" />
                    提交退款申请
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <Card padding="none">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      filterStatus === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索会员姓名..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-48 h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            onRowClick={handleViewDetail}
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
                filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 truncate">
                          {member.name}
                        </span>
                        <StatusBadge status={member.status} type="member" />
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatPhone(member.phone)} · {member.storeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <AmountDisplay
                        amount={member.principalBalance + member.giftBalance}
                        size="sm"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDetail(false)}
          ></div>
          <div className="relative w-[480px] bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl z-10">
              <div className="flex items-center justify-between p-5">
                <h3 className="text-lg font-semibold text-slate-800">退款详情</h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500 mb-1">申请退款金额</p>
                  <AmountDisplay amount={selectedRecord.requestAmount} size="xl" />
                </div>
                <StatusBadge status={selectedRecord.status} type="approval" />
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-600 mb-1">实际可退金额</p>
                <AmountDisplay amount={selectedRecord.refundableAmount} color="green" size="lg" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">会员姓名</span>
                  <span className="text-sm text-slate-800 font-medium">
                    {selectedRecord.memberName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">所属门店</span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.storeName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">已消耗赠金扣回</span>
                  <span className="text-sm text-orange-600">
                    ¥{selectedRecord.consumedGift.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">手续费</span>
                  <span className="text-sm text-red-600">
                    ¥{selectedRecord.fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">申请时间</span>
                  <span className="text-sm text-slate-800">
                    {formatDateTime(selectedRecord.createdAt)}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-sm text-slate-500 block mb-2">退款原因</span>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedRecord.reason}
                  </p>
                </div>
              </div>

              {selectedRecord.approver && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">审批人</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {selectedRecord.approver}
                  </p>
                </div>
              )}

              {selectedRecord.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleApprove(selectedRecord, 'approve');
                      setShowDetail(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    通过退款
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedRecord, 'reject');
                      setShowDetail(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    驳回申请
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowApproveModal(false)}
          ></div>
          <div className="relative w-[420px] bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {approveType === 'approve' ? '确认退款' : '驳回申请'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {approveType === 'approve'
                ? '确认通过该笔退款申请？退款将在审核通过后到账。'
                : '确认驳回该笔退款申请？'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmApprove}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  approveType === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                )}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">提交成功</h3>
            <p className="text-sm text-slate-500">退款申请已提交，等待审核</p>
          </div>
        </div>
      )}
    </div>
  );
}
