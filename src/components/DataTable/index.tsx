import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  columns: {
    key: string;
    title: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (record: T, index: number) => React.ReactNode;
  }[];
  data: T[];
  rowKey?: string;
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  className?: string;
  onRowClick?: (record: T) => void;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  pagination,
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1;

  const currentPage = pagination?.current || 1;
  const pageSize = pagination?.pageSize || 10;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = pagination ? data.slice(startIndex, endIndex) : data;

  return (
    <div className={clsx('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.align === 'left' && 'text-left',
                    !col.align && 'text-left',
                    col.width && `w-${col.width}`
                  )}
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              pageData.map((record, index) => (
                <tr
                  key={record[rowKey] || index}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-50'
                  )}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-3.5 text-sm',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.align === 'left' && 'text-left',
                        !col.align && 'text-left text-slate-600'
                      )}
                    >
                      {col.render
                        ? col.render(record, startIndex + index)
                        : record[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <div className="text-sm text-slate-500">
            共 {pagination.total} 条记录
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                currentPage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onChange(pageNum)}
                  className={clsx(
                    'min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors',
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                currentPage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
