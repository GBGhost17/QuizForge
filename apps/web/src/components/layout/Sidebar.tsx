import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const { activeRole, isSidebarOpen, setSidebarOpen, setActiveRole } = useUIStore();
  const navigate = useNavigate();

  const handleRoleChange = (role: 'creator' | 'participant') => {
    setActiveRole(role);
    setSidebarOpen(false);
    navigate('/');
  };

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
      {/* Mobile Backdrop - positioned below Navbar (top-16) to never cover logo or navbar */}
      {isSidebarOpen && (
        <div
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 top-16 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Drawer - pinned and sticky below Navbar, never scrolls away or slides */}
      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out',
          'md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full px-4 py-4 overflow-y-auto">
          {/* Active Workspace Tag & Quick Role Switcher */}
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
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
                {activeRole === 'creator' ? 'Soạn đề' : 'Làm bài'}
              </Badge>
            </div>

            {/* Quick role selector */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 mt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => handleRoleChange('creator')}
                className={cn(
                  'flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeRole === 'creator'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                )}
                title="Chuyển sang không gian Soạn đề"
                aria-label="Soạn đề"
              >
                <BookOpen className="h-3 w-3" />
                <span>Soạn đề</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('participant')}
                className={cn(
                  'flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeRole === 'participant'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                )}
                title="Chuyển sang không gian Làm bài"
                aria-label="Làm bài"
              >
                <GraduationCap className="h-3 w-3" />
                <span>Làm bài</span>
              </button>
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
            <div className="pt-3 mt-auto shrink-0 border-t border-slate-200">
              <NavLink
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
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
