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
];

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-medium transition-all ${
    isActive
      ? 'bg-[#23CE6B] text-[#062514] font-semibold'
      : 'text-[#EAFBF1]/75 hover:bg-white/10 hover:text-white'
  }`;

const tickerItems = [
  'RS-2026-0001',
  'Auto-catalogued',
  'Institutional Repository',
  'Peer reviewed',
  'Open access',
  'Since 2019',
];

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
        <div className="h-8 w-8 rounded-full gradient-btn-invert flex items-center justify-center text-xs font-bold font-mono">
          {(user?.full_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-white truncate max-w-[140px]">{user?.full_name || 'User'}</p>
          <p className="text-[10px] text-[#9FEBBF]">{isAdmin ? 'Administrator' : 'User'}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="rounded-full border-white/30 text-white hover:bg-white/15 hover:text-white" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  ) : null;

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
          <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#EAFBF1]/40">Administration</p>
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
    <header className="sticky top-0 z-40 border-b border-[#23CE6B]/25 bg-gradient-to-r from-[#0A2B1C] via-[#0F3A26] to-[#0A2B1C] shadow-[0_10px_40px_-18px_rgba(6,26,17,0.9)]">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { close(); navigate('/'); }} className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-2xl gradient-btn-invert flex items-center justify-center shrink-0 tilt-r-sm group-hover:rotate-0 transition-transform">
              <GraduationCap className="h-5 w-5 text-[#062514]" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-white">
              Research<span className="text-[#23CE6B]">Hub</span>
            </span>
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
              <span className="hidden xl:inline-flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-[#EAFBF1]/40">Administration</span>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {rightSide && <div className="hidden xl:flex items-center">{rightSide}</div>}

        <button onClick={() => setOpen(!open)} className="xl:hidden rounded-full p-2 text-[#EAFBF1] hover:bg-white/10">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="marquee-mask overflow-hidden border-t border-[#23CE6B]/20 bg-[#06180E]/40 py-1.5">
        <div className="ticker-track font-mono text-[10px] uppercase tracking-[0.3em] text-[#9FEBBF]/80">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="px-6 whitespace-nowrap">{item} <span className="text-[#23CE6B]">✦</span></span>
          ))}
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-[#23CE6B]/20 bg-[#0A2B1C]/98 px-4 py-3">
          <nav className="flex flex-col gap-1 pb-3">{mobileLinks}</nav>
          {token && (
            <div className="border-t border-[#23CE6B]/20 pt-3">
              {rightSide}
            </div>
          )}
        </div>
      )}
    </header>
  );
}