import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, FileText, Sparkles } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/research', label: 'Browse Research' },
  { to: '/login', label: 'Sign In' },
  { to: '/register', label: 'Register' },
];

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-[#23CE6B]/20 bg-[#0A2B1C]/80 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="float-book" style={{ top: '20%', right: '4%', left: 'auto', animationDuration: '12s', ['--tilt']: '-6deg' }}>
          <BookOpen className="h-8 w-8 text-[#EAFBF1]/70/30" strokeWidth={1.3} />
        </div>
        <div className="float-book" style={{ bottom: '18%', left: '3%', animationDuration: '14s', animationDelay: '1s', ['--tilt']: '8deg' }}>
          <FileText className="h-7 w-7 text-[#EAFBF1]/70" strokeWidth={1.3} />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl gradient-btn flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">ResearchHub</span>
            </div>
            <p className="mt-3 text-sm text-[#EAFBF1]/60 max-w-xs">
              The central institutional repository for the campus research works.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#EAFBF1]/40 mb-3">Explore</p>
            <ul className="space-y-2">
              {links.map(l => (
                <li key={l.to}>
                  <button onClick={() => navigate(l.to)} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#EAFBF1]/40 mb-3">Repository</p>
            <div className="space-y-2 text-sm text-[#EAFBF1]/60">
              <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#23CE6B]" /> Research Works</p>
              <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#23CE6B]" /> Auto-cataloged RS codes</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-[#23CE6B]/20 text-center text-xs text-[#EAFBF1]/30">
          &copy; {new Date().getFullYear()} ResearchHub — Institutional Research Management System
        </div>
      </div>
    </footer>
  );
}