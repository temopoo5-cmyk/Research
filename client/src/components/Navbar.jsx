import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { GraduationCap, Menu, X, LogOut } from 'lucide-react';

const publicItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/research', label: 'Browse Research' },
];

const authItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/submit', label: 'Submit Research' },
];

const adminItems = [
  { to: '/admin/research', label: 'Manage Research' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/programs', label: 'Manage Programs' },
  { to: '/admin/categories', label: 'Manage Categories' },
];

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
    isActive
      ? 'bg-emerald-50 text-emerald-700 font-semibold'
      : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700'
  }`;

export default function Navbar() {
  const { token, user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  const rightSide = token ? (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full gradient-btn flex items-center justify-center text-white text-xs font-bold">
          {(user?.full_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">{user?.full_name || 'User'}</p>
          <p className="text-[10px] text-muted-foreground">{isAdmin ? 'Administrator' : 'User'}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('/login')}>
        Sign In
      </Button>
      <Button size="sm" className="gradient-btn" onClick={() => navigate('/register')}>
        Register
      </Button>
    </div>
  );

  const mobileLinks = (
    <>
      {publicItems.map(item => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={close} className={linkClass}>
          {item.label}
        </NavLink>
      ))}
      {token && (
        <>
          {authItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={close} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Administration</p>
          {adminItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={close} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md shadow-sm shadow-emerald-100/40">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { close(); navigate('/'); }} className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-btn flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">ResearchHub</span>
          </button>
        </div>

        <nav className="hidden xl:flex items-center gap-1">
          {publicItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          {token && (
            <>
              {authItems.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
              <span className="hidden xl:inline-flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Administration</span>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="hidden xl:flex items-center">{rightSide}</div>

        <button onClick={() => setOpen(!open)} className="xl:hidden rounded-lg p-2 text-emerald-700 hover:bg-emerald-50">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="xl:hidden border-t border-emerald-100 bg-white/95 backdrop-blur-md px-4 py-3">
          <nav className="flex flex-col gap-1 pb-3">{mobileLinks}</nav>
          <div className="border-t border-emerald-100 pt-3">
            {token ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full gradient-btn flex items-center justify-center text-white text-xs font-bold">
                    {(user?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{user?.full_name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground">{isAdmin ? 'Administrator' : 'User'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-emerald-200 text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /><span className="hidden">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => { close(); navigate('/login'); }}>
                  Sign In
                </Button>
                <Button size="sm" className="gradient-btn" onClick={() => { close(); navigate('/register'); }}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}