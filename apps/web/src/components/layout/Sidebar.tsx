import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  FileText,
  FolderKanban,
  GraduationCap,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { isAuthenticated } = useAuth();
  const { activeRole, isSidebarOpen, setSidebarOpen } = useUIStore();

  const creatorNavItems: NavItem[] = [
    { label: 'Tổng quan', to: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      label: 'Ngân hàng câu hỏi',
      to: '/question-banks',
      icon: <FolderKanban className="h-4 w-4" />,
    },
    { label: 'Đề thi & Xuất bản', to: '/tests', icon: <FileText className="h-4 w-4" /> },
    {
      label: 'Bài nộp & Chấm thi',
      to: '/submissions',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    { label: 'Import Markdown', to: '/import', icon: <Upload className="h-4 w-4" /> },
  ];

  const participantNavItems: NavItem[] = [
    { label: 'Tổng quan', to: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Vào thi bằng mã', to: '/join', icon: <KeyRound className="h-4 w-4" /> },
    { label: 'Lịch sử bài làm', to: '/attempts', icon: <History className="h-4 w-4" /> },
    {
      label: 'Tự luyện tập',
      to: '/practice',
      icon: <Sparkles className="h-4 w-4" />,
    },
  ];

  const currentItems = activeRole === 'creator' ? creatorNavItems : participantNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white pt-16 transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col flex-1 px-4 py-4 overflow-y-auto">
          {/* Active Workspace Tag */}
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Không gian làm việc
              </span>
              <Badge
                variant={activeRole === 'creator' ? 'default' : 'secondary'}
                className="text-[10px] py-0"
              >
                {activeRole === 'creator' ? (
                  <BookOpen className="h-3 w-3 mr-1" />
                ) : (
                  <GraduationCap className="h-3 w-3 mr-1" />
                )}
                {activeRole === 'creator' ? 'Giáo viên' : 'Học sinh'}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1" aria-label="Sidebar Navigation">
            {currentItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <span className="text-slate-500">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom Settings Link */}
          {isAuthenticated && (
            <div className="pt-4 border-t border-slate-200">
              <NavLink
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Cài đặt hệ thống</span>
              </NavLink>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
