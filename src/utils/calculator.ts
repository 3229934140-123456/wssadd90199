import type { GiftRule, Member, ConsumeRecord } from '@/types';

export const calculateGiftAmount = (
  amount: number,
  giftRules: GiftRule[]
): number => {
  const rule = giftRules.find(
    (r) => amount >= r.minAmount && amount <= r.maxAmount
  );
  if (!rule) return 0;
  const gift = amount * rule.giftRatio;
  return Math.min(gift, rule.maxGift);
};

export const calculateDeduction = (
  amount: number,
  member: Member,
  canUseGift: boolean = true
): { principal: number; gift: number } => {
  if (!canUseGift) {
    return { principal: amount, gift: 0 };
  }

  const giftDeduction = Math.min(member.giftBalance, amount);
  const principalDeduction = amount - giftDeduction;

  return {
    principal: principalDeduction,
    gift: giftDeduction,
  };
};

export const calculateMixedDeduction = (
  projects: { name?: string; price: number; canUseGift: boolean }[],
  member: Member
): { principal: number; gift: number; items: { name: string; price: number; principal: number; gift: number; canUseGift: boolean }[] } => {
  const giftOnlyTotal = projects.filter(p => p.canUseGift).reduce((s, p) => s + p.price, 0);
  const principalOnlyTotal = projects.filter(p => !p.canUseGift).reduce((s, p) => s + p.price, 0);

  const giftAvailable = member.giftBalance;
  const giftForGiftItems = Math.min(giftAvailable, giftOnlyTotal);
  const giftRemaining = giftAvailable - giftForGiftItems;
  const principalForGiftItems = giftOnlyTotal - giftForGiftItems;

  const totalPrincipal = principalForGiftItems + principalOnlyTotal;

  return {
    principal: totalPrincipal,
    gift: giftForGiftItems,
    items: projects.map(p => {
      if (p.canUseGift) {
        const itemGift = Math.min(giftAvailable, p.price);
        return { name: p.name || '', price: p.price, principal: p.price - itemGift, gift: itemGift, canUseGift: true };
      }
      return { name: p.name || '', price: p.price, principal: p.price, gift: 0, canUseGift: false };
    }),
  };
};

export const calculateRefund = (
  requestAmount: number,
  member: Member,
  consumeRecords: ConsumeRecord[],
  feeRate: number = 0.05
): {
  refundableAmount: number;
  consumedGift: number;
  fee: number;
  principalDeduction: number;
  giftDeduction: number;
} => {
  const totalGiftConsumed = consumeRecords.reduce(
    (sum, r) => sum + r.giftDeduction,
    0
  );
  const totalGiftRecharged = member.principalBalance + totalGiftConsumed > 0
    ? member.giftBalance + totalGiftConsumed
    : member.giftBalance;

  const giftRatio = totalGiftRecharged > 0
    ? totalGiftConsumed / totalGiftRecharged
    : 0;

  const consumedGift = requestAmount * giftRatio;
  const refundableBeforeFee = requestAmount - consumedGift;
  const fee = refundableBeforeFee * feeRate;
  const refundableAmount = refundableBeforeFee - fee;

  const giftDeduction = Math.min(member.giftBalance, consumedGift);
  const principalDeduction = requestAmount - giftDeduction;

  return {
    refundableAmount: Math.max(0, refundableAmount),
    consumedGift,
    fee,
    principalDeduction: Math.min(principalDeduction, member.principalBalance),
    giftDeduction,
  };
};

export const calculateRiskScore = (
  alertCount: number,
  highGiftRatioCount: number,
  refundRate: number,
  crossStoreRatio: number
): number => {
  const score =
    alertCount * 4 +
    highGiftRatioCount * 3 +
    refundRate * 20 +
    crossStoreRatio * 10;
  return Math.min(100, Math.max(0, score));
};
