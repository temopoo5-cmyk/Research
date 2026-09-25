import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { LayoutDashboard, Upload, Users, FolderTree, BookMarked, LogOut, GraduationCap, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/submit', label: 'Submit Research', icon: Upload },
];

const adminItems = [
  { to: '/admin/research', label: 'Manage Research', icon: BookMarked },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/programs', label: 'Manage Programs', icon: FolderTree },
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
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-[#0A2B1C] via-[#0E3423] to-[#0A2B1C] border-r border-[#23CE6B]/25 shadow-[0_20px_60px_-30px_rgba(6,26,17,0.95)]">
      <div className="relative overflow-hidden border-b border-[#23CE6B]/20 p-5">
        <div className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rounded-full border border-[#23CE6B]/25" />
        <div className="pointer-events-none absolute right-3 top-0 h-14 w-14 rotate-45 rounded-[1rem] border border-[#9FEBBF]/15" />
        <div className="relative z-10 flex items-center justify-between">
          <button onClick={handleLogout} className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-2xl gradient-btn-invert flex items-center justify-center shrink-0 tilt-l-sm group-hover:rotate-0 transition-transform">
              <GraduationCap className="h-5 w-5 text-[#062514]" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg leading-tight text-white">Research<span className="text-[#23CE6B]">Hub</span></h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9FEBBF] mt-0.5">Admin Panel</p>
            </div>
          </button>
          <button onClick={onClose} className="md:hidden rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? 'bg-[#23CE6B] text-[#062514] font-semibold shadow-[3px_3px_0_0_rgba(255,255,255,0.35)]' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${isActive ? 'bg-[#23CE6B] text-[#062514] font-semibold shadow-[3px_3px_0_0_rgba(255,255,255,0.35)]' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-[#23CE6B]/15" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-[#23CE6B] flex items-center justify-center text-[#062514] font-semibold text-sm font-mono">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-white">{user?.full_name || 'User'}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9FEBBF]">Administrator</p>
          </div>
        </div>
        <Button variant="outline" className="w-full rounded-full border-white/25 text-white/70 hover:text-white hover:bg-white/10" onClick={handleLogout}>
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