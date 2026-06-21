import { useState, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  X,
  Check,
  XCircle,
  Eye,
  FileText,
  User,
  Building2,
  Calendar,
  CreditCard,
  UserCheck,
  Tag,
  AlertTriangle,
  Upload,
  Type,
} from 'lucide-react';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import AmountDisplay from '@/components/AmountDisplay';
import { useRechargeStore, resolveRechargeStatus } from '@/store/useRechargeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useMemberStore } from '@/store/useMemberStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDateTime, formatPhone } from '@/utils/format';
import { calculateGiftAmount } from '@/utils/calculator';
import { clsx } from 'clsx';
import type { RechargeRecord } from '@/types';

export default function Recharge() {
  const {
    filterStatus,
    filterStore,
    searchKeyword,
    currentPage,
    pageSize,
    selectedRecord,
    setFilterStatus,
    setFilterStore,
    setSearchKeyword,
    setCurrentPage,
    setSelectedRecord,
    getFilteredRecords,
    approveRecord,
    rejectRecord,
    approveRecords,
    rejectRecords,
    addRecord,
  } = useRechargeStore();

  const { stores, giftRules, approvalFlow } = useSettingsStore();
  const { members, updateMemberBalance } = useMemberStore();
  const { addLog } = useOperationLogStore();

  const [showDetail, setShowDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [approveOpinion, setApproveOpinion] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState<'approve' | 'reject'>('approve');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchType, setBatchType] = useState<'approve' | 'reject'>('approve');
  const [batchOpinion, setBatchOpinion] = useState('');

  const [proofTab, setProofTab] = useState<'file' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newRecharge, setNewRecharge] = useState({
    memberId: '',
    amount: 0,
    activity: '',
    paymentProof: '',
    paymentProofName: '',
    paymentProofType: 'file' as 'file' | 'text',
    source: '',
    consultant: '',
    storeId: '',
  });

  const filteredRecords = getFilteredRecords();

  const handleViewDetail = (record: RechargeRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const handleApprove = (record: RechargeRecord, type: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setApproveType(type);
    setApproveOpinion('');
    setShowApproveModal(true);
  };

  const confirmApprove = () => {
    if (!selectedRecord) return;
    if (approveType === 'approve') {
      const approvedRecord = approveRecord(selectedRecord.id, '财务管理员', approveOpinion);
      if (approvedRecord) {
        updateMemberBalance(
          approvedRecord.memberId,
          approvedRecord.amount,
          approvedRecord.giftAmount
        );
        addLog({
          type: 'approve',
          targetId: approvedRecord.id,
          targetName: approvedRecord.memberName,
          detail: `充值审批通过，金额 ¥${approvedRecord.amount.toLocaleString()}，赠送 ¥${approvedRecord.giftAmount.toLocaleString()}`,
          operator: '财务管理员',
          storeName: approvedRecord.storeName,
        });
        addLog({
          type: 'recharge',
          targetId: approvedRecord.id,
          targetName: approvedRecord.memberName,
          detail: `充值入账 ¥${approvedRecord.amount.toLocaleString()}，赠送 ¥${approvedRecord.giftAmount.toLocaleString()}`,
          operator: '财务管理员',
          storeName: approvedRecord.storeName,
          amount: approvedRecord.amount,
        });
      }
    } else {
      rejectRecord(selectedRecord.id, '财务管理员', approveOpinion);
      addLog({
        type: 'reject',
        targetId: selectedRecord.id,
        targetName: selectedRecord.memberName,
        detail: `充值审批驳回：${approveOpinion || '无'}`,
        operator: '财务管理员',
        storeName: selectedRecord.storeName,
      });
    }
    setShowApproveModal(false);
    setSelectedRecord(null);
  };

  const handleBatchApprove = (type: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return;
    setBatchType(type);
    setBatchOpinion('');
    setShowBatchModal(true);
  };

  const confirmBatchApprove = () => {
    if (selectedIds.length === 0) return;
    if (batchType === 'approve') {
      const approvedRecords = approveRecords(selectedIds, '财务管理员', batchOpinion);
      approvedRecords.forEach((r) => {
        updateMemberBalance(r.memberId, r.amount, r.giftAmount);
        addLog({
          type: 'approve',
          targetId: r.id,
          targetName: r.memberName,
          detail: `充值批量审批通过，金额 ¥${r.amount.toLocaleString()}，赠送 ¥${r.giftAmount.toLocaleString()}`,
          operator: '财务管理员',
          storeName: r.storeName,
        });
        addLog({
          type: 'recharge',
          targetId: r.id,
          targetName: r.memberName,
          detail: `充值入账 ¥${r.amount.toLocaleString()}，赠送 ¥${r.giftAmount.toLocaleString()}`,
          operator: '财务管理员',
          storeName: r.storeName,
          amount: r.amount,
        });
      });
    } else {
      rejectRecords(selectedIds, '财务管理员', batchOpinion);
      filteredRecords
        .filter((r) => selectedIds.includes(r.id))
        .forEach((r) => {
          if (r.status === 'pending' || r.status === 'pending_store' || r.status === 'pending_finance') {
            addLog({
              type: 'reject',
              targetId: r.id,
              targetName: r.memberName,
              detail: `充值批量审批驳回：${batchOpinion || '无'}`,
              operator: '财务管理员',
              storeName: r.storeName,
            });
          }
        });
    }
    setSelectedIds([]);
    setShowBatchModal(false);
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pendingRecords = filteredRecords.filter(
      (r) => r.status === 'pending' || r.status === 'pending_store' || r.status === 'pending_finance'
    );
    const pendingIds = pendingRecords.map((r) => r.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewRecharge((prev) => ({
        ...prev,
        paymentProof: reader.result as string,
        paymentProofName: file.name,
        paymentProofType: 'file',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddRecharge = () => {
    if (!newRecharge.memberId || !newRecharge.amount || !newRecharge.storeId) return;

    const member = members.find((m) => m.id === newRecharge.memberId);
    const store = stores.find((s) => s.id === newRecharge.storeId);
    const giftAmount = calculateGiftAmount(newRecharge.amount, giftRules);
    const giftRatio = newRecharge.amount > 0 ? giftAmount / newRecharge.amount : 0;

    const storeSingleLimit = store?.singleLimit ?? approvalFlow.storeLimit;
    const { status, approvalLevel } = resolveRechargeStatus(
      newRecharge.amount,
      storeSingleLimit,
      approvalFlow.financeLimit
    );

    const newRecord = addRecord({
      memberId: newRecharge.memberId,
      memberName: member?.name || '',
      memberPhone: member?.phone || '',
      storeId: newRecharge.storeId,
      storeName: store?.name || '',
      amount: newRecharge.amount,
      giftAmount,
      giftRatio,
      activity: newRecharge.activity || '常规充值',
      paymentProof: newRecharge.paymentProof || '',
      paymentProofType: newRecharge.paymentProofType,
      paymentProofName: newRecharge.paymentProofName || '',
      source: newRecharge.source || '到店咨询',
      consultant: newRecharge.consultant || '',
      status,
      approvalLevel,
    });

    if (status === 'approved') {
      updateMemberBalance(newRecharge.memberId, newRecharge.amount, giftAmount);
      addLog({
        type: 'recharge',
        targetId: newRecord.id,
        targetName: member?.name || '',
        detail: `充值入账 ¥${newRecharge.amount.toLocaleString()}，赠送 ¥${giftAmount.toLocaleString()}，自动审批通过`,
        operator: '系统自动',
        storeName: store?.name || '',
        amount: newRecharge.amount,
      });
    } else {
      addLog({
        type: 'recharge_apply',
        targetId: newRecord.id,
        targetName: member?.name || '',
        detail: status === 'pending_store'
          ? `充值申请 ¥${newRecharge.amount.toLocaleString()}，赠送 ¥${giftAmount.toLocaleString()}，待店长审批`
          : `充值申请 ¥${newRecharge.amount.toLocaleString()}，赠送 ¥${giftAmount.toLocaleString()}，待财务终审`,
        operator: '前台操作员',
        storeName: store?.name || '',
        amount: newRecharge.amount,
      });
    }

    setShowAddModal(false);
    setNewRecharge({
      memberId: '',
      amount: 0,
      activity: '',
      paymentProof: '',
      paymentProofName: '',
      paymentProofType: 'file',
      source: '',
      consultant: '',
      storeId: '',
    });
    setProofTab('file');
  };

  const approvalLevelLabels: Record<string, string> = {
    auto: '自动审批',
    store: '店长审批中',
    finance: '财务终审中',
  };

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedIds.length > 0 && filteredRecords.filter(r => 
            r.status === 'pending' || r.status === 'pending_store' || r.status === 'pending_finance'
          ).every(r => selectedIds.includes(r.id))}
          onChange={toggleSelectAll}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
        />
      ),
      width: '50px',
      align: 'center' as const,
      render: (record: RechargeRecord) => {
        const isPending = record.status === 'pending' || record.status === 'pending_store' || record.status === 'pending_finance';
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(record.id)}
            onChange={() => toggleSelectId(record.id)}
            disabled={!isPending}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
        );
      },
    },
    {
      key: 'member',
      title: '会员信息',
      width: '180px',
      render: (record: RechargeRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{record.memberName}</p>
            <p className="text-xs text-slate-500">{formatPhone(record.memberPhone)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'storeName',
      title: '门店',
      render: (record: RechargeRecord) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Building2 className="w-3.5 h-3.5" />
          <span className="text-sm">{record.storeName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '充值金额',
      align: 'right' as const,
      render: (record: RechargeRecord) => (
        <AmountDisplay amount={record.amount} size="sm" className="font-semibold" />
      ),
    },
    {
      key: 'giftAmount',
      title: '赠送金额',
      align: 'right' as const,
      render: (record: RechargeRecord) => (
        <div>
          <AmountDisplay amount={record.giftAmount} color="orange" size="sm" />
          <span className="text-xs text-slate-400 ml-1">
            ({(record.giftRatio * 100).toFixed(0)}%)
          </span>
        </div>
      ),
    },
    {
      key: 'activity',
      title: '活动方案',
      render: (record: RechargeRecord) => (
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">{record.activity}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '审批状态',
      render: (record: RechargeRecord) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={record.status} type="approval" />
          {record.approvalLevel && record.approvalLevel !== 'auto' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
              {approvalLevelLabels[record.approvalLevel] || record.approvalLevel}
            </span>
          )}
          {record.approvalLevel === 'auto' && record.status === 'approved' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-100">
              自动审批
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '申请时间',
      render: (record: RechargeRecord) => (
        <span className="text-sm text-slate-500">
          {formatDateTime(record.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'center' as const,
      width: '180px',
      render: (record: RechargeRecord) => (
        <div className="flex items-center gap-2 justify-center">
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
          {(record.status === 'pending' || record.status === 'pending_store' || record.status === 'pending_finance') && (
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

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审批' },
    { key: 'pending_store', label: '待店长审批' },
    { key: 'pending_finance', label: '待财务终审' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const selectedMember = members.find((m) => m.id === newRecharge.memberId);
  const previewGiftAmount = calculateGiftAmount(newRecharge.amount, giftRules);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">充值审批</h2>
          <p className="text-sm text-slate-500 mt-1">
            管理门店充值申请，审核大额储值，确保资金安全
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          发起充值
        </button>
      </div>

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

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-sm text-blue-700 font-medium">
                  已选 {selectedIds.length} 笔
                </span>
                <button
                  onClick={() => handleBatchApprove('approve')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  批量通过
                </button>
                <button
                  onClick={() => handleBatchApprove('reject')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  批量驳回
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索会员姓名、手机号..."
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
          columns={columns}
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

      {showDetail && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDetail(false)}
          ></div>
          <div className="relative w-[520px] bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl z-10">
              <div className="flex items-center justify-between p-5">
                <h3 className="text-lg font-semibold text-slate-800">充值详情</h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500 mb-1">充值金额</p>
                  <AmountDisplay amount={selectedRecord.amount} size="xl" />
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={selectedRecord.status} type="approval" />
                  {selectedRecord.approvalLevel && selectedRecord.approvalLevel !== 'auto' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      {approvalLevelLabels[selectedRecord.approvalLevel]}
                    </span>
                  )}
                  {selectedRecord.approvalLevel === 'auto' && selectedRecord.status === 'approved' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-100">
                      自动审批
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600 mb-1">赠送金额</p>
                  <AmountDisplay amount={selectedRecord.giftAmount} color="green" size="lg" />
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-600 mb-1">赠送比例</p>
                  <p className="text-xl font-bold text-orange-600">
                    {(selectedRecord.giftRatio * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {selectedRecord.giftRatio > 0.3 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">高赠送比例预警</p>
                    <p className="text-xs text-red-600 mt-1">
                      该笔订单赠送比例超过30%，请注意核实活动方案的真实性
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    会员姓名
                  </span>
                  <span className="text-sm text-slate-800 font-medium">
                    {selectedRecord.memberName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    联系电话
                  </span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.memberPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    所属门店
                  </span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.storeName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    活动方案
                  </span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.activity}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    顾客来源
                  </span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.source}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    咨询师
                  </span>
                  <span className="text-sm text-slate-800">
                    {selectedRecord.consultant}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    申请时间
                  </span>
                  <span className="text-sm text-slate-800">
                    {formatDateTime(selectedRecord.createdAt)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">付款凭证</p>
                {selectedRecord.paymentProofType === 'file' ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {selectedRecord.paymentProofName || '附件文件'}
                      </p>
                      <p className="text-xs text-slate-400">文件凭证</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedRecord.paymentProof || '无凭证内容'}
                    </p>
                  </div>
                )}
              </div>

              {selectedRecord.approver && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">审批人</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {selectedRecord.approver}
                  </p>
                  {selectedRecord.approveOpinion && (
                    <>
                      <p className="text-sm text-slate-500 mt-3 mb-1">审批意见</p>
                      <p className="text-sm text-slate-700">
                        {selectedRecord.approveOpinion}
                      </p>
                    </>
                  )}
                </div>
              )}

              {(selectedRecord.status === 'pending' || selectedRecord.status === 'pending_store' || selectedRecord.status === 'pending_finance') && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleApprove(selectedRecord, 'approve');
                      setShowDetail(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    通过审批
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
              {approveType === 'approve' ? '通过审批' : '驳回申请'}
            </h3>
            <div className="mb-5">
              <label className="block text-sm text-slate-600 mb-2">审批意见</label>
              <textarea
                value={approveOpinion}
                onChange={(e) => setApproveOpinion(e.target.value)}
                placeholder="请输入审批意见..."
                className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
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

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowBatchModal(false)}
          ></div>
          <div className="relative w-[460px] bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {batchType === 'approve' ? '批量通过' : '批量驳回'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              共 {selectedIds.length} 笔充值申请，{batchType === 'approve' ? '通过后将自动更新会员余额' : '驳回后将无法恢复'}
            </p>
            <div className="mb-5">
              <label className="block text-sm text-slate-600 mb-2">审批意见</label>
              <textarea
                value={batchOpinion}
                onChange={(e) => setBatchOpinion(e.target.value)}
                placeholder="请输入审批意见..."
                className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmBatchApprove}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  batchType === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                )}
              >
                确认{batchType === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="relative w-[480px] bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl z-10">
              <div className="flex items-center justify-between p-5">
                <h3 className="text-lg font-semibold text-slate-800">发起充值</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">选择门店</label>
                <select
                  value={newRecharge.storeId}
                  onChange={(e) => setNewRecharge({ ...newRecharge, storeId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择门店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1.5">选择会员</label>
                <select
                  value={newRecharge.memberId}
                  onChange={(e) => setNewRecharge({ ...newRecharge, memberId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择会员</option>
                  {members
                    .filter((m) => !newRecharge.storeId || m.storeId === newRecharge.storeId)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {formatPhone(member.phone)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1.5">充值金额</label>
                <input
                  type="number"
                  value={newRecharge.amount || ''}
                  onChange={(e) =>
                    setNewRecharge({ ...newRecharge, amount: Number(e.target.value) })
                  }
                  placeholder="请输入充值金额"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {newRecharge.amount > 0 && (
                  <p className="text-xs text-orange-500 mt-1.5">
                    预计赠送金额：¥{previewGiftAmount.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1.5">活动方案</label>
                <input
                  type="text"
                  value={newRecharge.activity}
                  onChange={(e) => setNewRecharge({ ...newRecharge, activity: e.target.value })}
                  placeholder="如：常规充值、五一特惠等"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">顾客来源</label>
                  <input
                    type="text"
                    value={newRecharge.source}
                    onChange={(e) => setNewRecharge({ ...newRecharge, source: e.target.value })}
                    placeholder="如：朋友介绍、抖音等"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">咨询师</label>
                  <input
                    type="text"
                    value={newRecharge.consultant}
                    onChange={(e) => setNewRecharge({ ...newRecharge, consultant: e.target.value })}
                    placeholder="请输入咨询师姓名"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">付款凭证</label>
                <div className="flex gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setProofTab('file')}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      proofTab === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    文件上传
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofTab('text')}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      proofTab === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <Type className="w-3.5 h-3.5" />
                    凭证录入
                  </button>
                </div>

                {proofTab === 'file' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div
                      className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newRecharge.paymentProofName ? (
                        <div className="text-center">
                          <FileText className="w-8 h-8 mx-auto mb-1 text-blue-500" />
                          <p className="text-xs text-slate-600 truncate max-w-[200px]">
                            {newRecharge.paymentProofName}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">点击上传付款凭证</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newRecharge.paymentProofName}
                      onChange={(e) =>
                        setNewRecharge({
                          ...newRecharge,
                          paymentProofName: e.target.value,
                          paymentProofType: 'text',
                        })
                      }
                      placeholder="凭证标题/名称"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      value={newRecharge.paymentProof}
                      onChange={(e) =>
                        setNewRecharge({
                          ...newRecharge,
                          paymentProof: e.target.value,
                          paymentProofType: 'text',
                        })
                      }
                      placeholder="请输入凭证信息..."
                      className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>

              {newRecharge.amount > approvalFlow.storeLimit && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-xs text-yellow-700">
                    提示：该笔金额超过门店审批额度（¥{approvalFlow.storeLimit.toLocaleString()}），将自动进入财务终审流程
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddRecharge}
                  disabled={!newRecharge.memberId || !newRecharge.amount || !newRecharge.storeId}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  提交申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
