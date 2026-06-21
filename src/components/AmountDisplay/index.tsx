import { formatMoney } from '@/utils/format';
import { clsx } from 'clsx';

interface AmountDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  prefix?: string;
  color?: 'default' | 'green' | 'red' | 'orange' | 'blue';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-2xl font-bold',
};

const colorClasses = {
  default: 'text-slate-800',
  green: 'text-emerald-600',
  red: 'text-red-600',
  orange: 'text-orange-500',
  blue: 'text-blue-600',
};

export default function AmountDisplay({
  amount,
  size = 'md',
  prefix = '¥',
  color = 'default',
  className = '',
}: AmountDisplayProps) {
  return (
    <span className={clsx(
      'font-mono tabular-nums',
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      {prefix}
      {formatMoney(amount)}
    </span>
  );
}
