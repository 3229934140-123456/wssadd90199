export const formatMoney = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待审批',
    pending_store: '待店长审批',
    pending_finance: '待财务终审',
    approved: '已通过',
    rejected: '已驳回',
    normal: '正常',
    frozen: '已冻结',
    handled: '已处理',
  };
  return map[status] || status;
};

export const getRiskLevelText = (level: string): string => {
  const map: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };
  return map[level] || level;
};

export const getAlertTypeText = (type: string): string => {
  const map: Record<string, string> = {
    frequent_recharge: '短期多次充值',
    phone_change: '频繁换手机号',
    high_gift_ratio: '异常高赠送比例',
    large_refund: '大额退款',
  };
  return map[type] || type;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};
