import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { LogOut, User as UserIcon, Menu, X, Layers, Bell } from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 text-charcoal-600 hover:text-charcoal-900 hover:bg-canvas-subtle rounded transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded bg-charcoal-900 flex items-center justify-center text-white shadow-subtle group-hover:bg-charcoal-800 transition-colors">
                <Layers className="w-5 h-5 text-coral-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-charcoal-900 leading-tight">
                  Queue<span className="text-coral-500">Flow</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-charcoal-500 font-medium leading-none">
                  Smart Queue System
                </span>
              </div>
            </Link>

            {user?.organization && (
              <span className="hidden sm:inline-flex items-center text-xs font-medium text-charcoal-600 bg-canvas-subtle px-2.5 py-1 rounded border border-border/60 ml-3">
                {user.organization}
              </span>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-canvas-subtle transition-colors border border-transparent hover:border-border"
              >
                <div className="w-8 h-8 rounded-full bg-coral-100 text-coral-700 border border-coral-200 flex items-center justify-center font-semibold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-charcoal-900 leading-tight">
                    {user?.name || 'Manager'}
                  </span>
                  <span className="text-[10px] text-charcoal-500 leading-tight">
                    {user?.email}
                  </span>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md border border-border shadow-elevated py-1 z-30">
                    <div className="px-4 py-2.5 border-b border-border/80">
                      <p className="text-xs font-semibold text-charcoal-900">{user?.name}</p>
                      <p className="text-[11px] text-charcoal-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-charcoal-700 hover:bg-canvas-subtle transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-charcoal-400" />
                      Account Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-danger hover:bg-red-50 transition-colors border-t border-border/60"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

