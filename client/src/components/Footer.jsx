import React, { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Search } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/research', label: 'Browse Research' },
  { to: '/about', label: 'About' },
];

const socials = [
  { href: 'https://facebook.com', label: 'Facebook' },
  { href: 'https://x.com', label: 'X' },
  { href: 'https://youtube.com', label: 'YouTube' },
];

export default function Footer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [term, setTerm] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!params.get('q')) return;
    navigate(q ? `/research?q=${encodeURIComponent(q)}` : '/research');
  };

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <footer
      className="relative mt-10 overflow-hidden pb-7 pt-16 text-[#F5F8F2]"
      style={{ background: 'linear-gradient(180deg,#08604B 0%,#064C3B 100%)' }}
    >
      {/* Wave that blends into the page background */}
      <svg className="footer-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#F7F8F3" d="M0,70 C260,18 520,10 760,26 C1000,42 1220,54 1440,34 L1440,70 Z" />
      </svg>

      <div className="container-page relative z-10">
        <div className="flex flex-col items-center justify-between gap-7 lg:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div>
              <div className="footer-brand-name">ResearchHub</div>
              <div className="footer-brand-subtitle">Research. Discover. Make an Impact.</div>
            </div>
          </div>

          <nav className="footer-nav flex flex-wrap items-center justify-center gap-5 lg:gap-7">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="footer-search relative w-full sm:w-[300px]">
            <label htmlFor="footer-search" className="sr-only">Search research</label>
            <input
              id="footer-search"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search research, authors, keywords..."
            />
            <button type="submit" aria-label="Search">
              <Search className="h-[15px] w-[15px]" />
            </button>
          </form>
        </div>

        <div className="mb-5 mt-7 h-px" style={{ background: 'rgba(255,255,255,.12)' }} />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px]" style={{ color: 'rgba(245,250,247,.55)' }}>
            &copy; {new Date().getFullYear()} ResearchHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socials.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex transition hover:opacity-70"
                style={{ color: 'rgba(245,250,247,.82)' }}
              >
                <span className="text-[13px] font-semibold">{s.label.charAt(0)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Botanical line art */}
      <svg className="botanical botanical-left" viewBox="0 0 190 190" fill="none" aria-hidden="true">
        <path d="M20 190 C50 150 78 122 110 100 C132 84 156 70 176 60" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M62 130 C48 118 42 102 44 86 C60 92 70 108 62 130 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M96 108 C88 94 90 80 98 68 C108 80 108 96 96 108 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M128 84 C120 72 122 58 130 48 C140 60 140 74 128 84 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <circle cx="160" cy="66" r="4" stroke="#D9EDE5" strokeWidth="1.3" />
      </svg>

      <svg className="botanical botanical-right" viewBox="0 0 190 190" fill="none" aria-hidden="true">
        <path d="M170 190 C140 150 112 122 80 100 C58 84 34 70 14 60" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M128 130 C142 118 148 102 146 86 C130 92 120 108 128 130 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M94 108 C102 94 100 80 92 68 C82 80 82 96 94 108 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <path d="M62 84 C70 72 68 58 60 48 C50 60 50 74 62 84 Z" stroke="#D9EDE5" strokeWidth="1.3" />
        <circle cx="30" cy="66" r="4" stroke="#D9EDE5" strokeWidth="1.3" />
      </svg>
    </footer>
  );
}