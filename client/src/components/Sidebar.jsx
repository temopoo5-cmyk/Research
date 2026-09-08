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
    <div className="flex h-full w-64 flex-col bg-white/95 backdrop-blur-md border-r border-emerald-100 shadow-lg shadow-emerald-100/50">
      <div className="flex items-center justify-between p-5">
        <button onClick={handleLogout} className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gradient-btn flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">ResearchHub</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
          </div>
        </button>
        <button onClick={onClose} className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      <Separator className="bg-emerald-100" />
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-200' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
        {adminItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-200' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700'}`}
          >
            <item.icon className="h-4 w-4" />{item.label}
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-emerald-100" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="outline" className="w-full text-muted-foreground hover:text-red-600 hover:border-red-200" onClick={handleLogout}>
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