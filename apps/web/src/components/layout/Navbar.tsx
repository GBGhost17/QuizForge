import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LogOut, Menu, Shield, User, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { activeRole, setActiveRole, isSidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Mobile Trigger */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <Link
            to="/"
            className="flex items-center space-x-2 text-slate-900 font-bold text-xl tracking-tight"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <span className="text-lg font-black">Q</span>
            </div>
            <span>
              Quiz<span className="text-indigo-600">Forge</span>
            </span>
          </Link>
        </div>

        {/* Center: Workspace Role Mode Switcher (Visible when Authenticated) */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveRole('creator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRole === 'creator'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Giáo viên / Soạn đề</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('participant')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRole === 'participant'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Học sinh / Làm bài</span>
            </button>
          </div>
        )}

        {/* Right: Auth Profile Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                      <Shield className="h-3 w-3 mr-0.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm">
                {user.name.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-1.5">Đăng xuất</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
