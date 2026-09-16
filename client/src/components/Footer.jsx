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
    <footer className="relative mt-16 overflow-hidden border-t border-emerald-100 bg-white/70 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="float-book" style={{ top: '20%', right: '4%', left: 'auto', animationDuration: '12s', ['--tilt']: '-6deg' }}>
          <BookOpen className="h-8 w-8 text-emerald-200" strokeWidth={1.3} />
        </div>
        <div className="float-book" style={{ bottom: '18%', left: '3%', animationDuration: '14s', animationDelay: '1s', ['--tilt']: '8deg' }}>
          <FileText className="h-7 w-7 text-teal-200" strokeWidth={1.3} />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl gradient-btn flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">ResearchHub</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              The central institutional repository for research papers, theses, and capstone projects.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Explore</p>
            <ul className="space-y-2">
              {links.map(l => (
                <li key={l.to}>
                  <button onClick={() => navigate(l.to)} className="text-sm text-foreground/80 hover:text-emerald-700 transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Repository</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-500" /> Research Paper · Thesis · Capstone</p>
              <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-500" /> Auto-cataloged codes (RP / TH / CP)</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-5 border-t border-emerald-100 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ResearchHub — Institutional Research Management System
        </div>
      </div>
    </footer>
  );
}