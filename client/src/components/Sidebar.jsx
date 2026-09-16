import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { LayoutDashboard, Upload, Users, FolderTree, Tags, BookMarked, LogOut, GraduationCap, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/submit', label: 'Submit Research', icon: Upload },
];

const adminItems = [
  { to: '/admin/research', label: 'Manage Research', icon: BookMarked },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/programs', label: 'Manage Programs', icon: FolderTree },
  { to: '/admin/categories', label: 'Manage Categories', icon: Tags },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNav = () => onClose();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const inner = (
    <div className="flex h-full w-64 flex-col bg-[#123F29] backdrop-blur-md border-r border-[#23CE6B]/20 shadow-lg shadow-[#23CE6B]/15">
      <div className="flex items-center justify-between p-5">
        <button onClick={handleLogout} className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gradient-btn flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight text-white">ResearchHub</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
          </div>
        </button>
        <button onClick={onClose} className="md:hidden rounded-lg p-1.5 text-[#EAFBF1]/60 hover:bg-[#23CE6B]/20 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <Separator className="bg-[#23CE6B]/15" />
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#23CE6B] text-[#0A122A] font-semibold shadow-md shadow-[#23CE6B]/30' : 'text-white/60 hover:bg-[#23CE6B]/20 hover:text-white'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#23CE6B] text-[#0A122A] font-semibold shadow-md shadow-[#23CE6B]/30' : 'text-white/60 hover:bg-[#23CE6B]/20 hover:text-white'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-[#23CE6B]/15" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-[#23CE6B] flex items-center justify-center text-[#0A122A] font-semibold text-sm">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-white">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="outline" className="w-full border-[#23CE6B]/30 text-white/60 hover:text-white hover:border-[#23CE6B]/50" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleNav} />
      <div className={`fixed top-0 left-0 bottom-0 z-50 md:translate-x-0 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {inner}
      </div>
    </>
  );
}