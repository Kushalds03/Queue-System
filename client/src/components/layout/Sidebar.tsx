import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  Settings,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenCreateQueue?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, onOpenCreateQueue }) => {
  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Queues', path: '/queues', icon: Layers },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 z-40 md:z-20 h-[calc(100vh-4rem)] w-64 bg-white border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col gap-6">
          {/* Quick Action Button */}
          {onOpenCreateQueue && (
            <button
              onClick={() => {
                onOpenCreateQueue();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-coral-50 hover:bg-coral-100/80 active:bg-coral-200/80 text-coral-700 font-semibold text-xs py-2.5 px-3 rounded border border-coral-200 transition-colors shadow-subtle"
            >
              <PlusCircle className="w-4 h-4 text-coral-500" />
              Create New Queue
            </button>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider px-3 mb-1">
              Main Menu
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-colors ${
                      isActive
                        ? 'bg-canvas-subtle text-coral-600 font-semibold border-l-2 border-coral-500 rounded-l-none'
                        : 'text-charcoal-700 hover:bg-canvas-subtle hover:text-charcoal-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Version Widget */}
        <div className="p-4 border-t border-border/80 bg-canvas/60">
          <div className="flex items-center justify-between text-[11px] text-charcoal-500">
            <span className="font-medium">QueueFlow</span>
            <span className="font-mono text-[10px] bg-canvas-subtle px-1.5 py-0.5 rounded border border-border">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

