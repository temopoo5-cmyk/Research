import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, FileText, Sparkles } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/research', label: 'Browse Research' },
];

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[#23CE6B]/25 bg-gradient-to-br from-[#0A2B1C] via-[#0F3A26] to-[#06180E] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute -top-16 -right-10 h-56 w-56 blob-shape border border-[#23CE6B]/25" />
        <div className="absolute bottom-10 left-4 h-32 w-32 blob-shape-alt border border-dashed border-[#23CE6B]/25" />
        <div className="absolute inset-0 grid-lines opacity-40" />
        <div className="float-book" style={{ top: '22%', right: '6%', animationDuration: '12s', ['--tilt']: '-6deg' }}>
          <BookOpen className="h-8 w-8 text-[#9FEBBF]/50" strokeWidth={1.3} />
        </div>
        <div className="float-book" style={{ bottom: '18%', left: '5%', animationDuration: '14s', animationDelay: '1s', ['--tilt']: '8deg' }}>
          <FileText className="h-7 w-7 text-[#9FEBBF]/45" strokeWidth={1.3} />
        </div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl gradient-btn-invert flex items-center justify-center shrink-0 tilt-r-sm">
                <GraduationCap className="h-5 w-5 text-[#062514]" />
              </div>
              <span className="font-display font-semibold text-lg text-white">Research<span className="text-[#23CE6B]">Hub</span></span>
            </div>
            <p className="mt-4 text-sm text-white/65 max-w-xs">
              The central institutional repository for the campus research works.
            </p>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.3em] text-[#23CE6B]">Est. 2019</span>
          </div>
          <div>
            <p className="eyebrow !text-[#23CE6B] mb-4">Explore</p>
            <ul className="space-y-2">
              {links.map(l => (
                <li key={l.to}>
                  <button onClick={() => navigate(l.to)} className="text-sm text-white/70 hover:text-[#23CE6B] transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow !text-[#23CE6B] mb-4">Repository</p>
            <div className="space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#23CE6B]" /> Research Works</p>
              <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#23CE6B]" /> Auto-cataloged RS codes</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-5 border-t border-white/10 text-center text-xs text-white/40 font-mono">
          &copy; {new Date().getFullYear()} ResearchHub — Institutional Research Management System
        </div>
      </div>
    </footer>
  );
}