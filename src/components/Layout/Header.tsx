import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function Header() {
  const { getPendingAlertCount } = useSettingsStore();
  const alertCount = getPendingAlertCount();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-800">储值风控管理后台</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索会员、订单..."
            className="w-64 h-9 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-800">财务管理员</p>
            <p className="text-xs text-slate-500">总部财务</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
