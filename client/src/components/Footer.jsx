import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Facebook, Twitter, Youtube } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/research', label: 'Browse Research' },
  { to: '/about', label: 'About' },
];

const socials = [
  { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
  { href: 'https://x.com', label: 'X', Icon: Twitter },
  { href: 'https://youtube.com', label: 'YouTube', Icon: Youtube },
];

const legal = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

export default function Footer() {
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
        <div className="flex flex-col items-center justify-between gap-7 border-b border-white/10 pb-8 lg:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <GraduationCap className="h-[18px] w-[18px] text-white" />
            </span>
            <div>
              <div className="footer-brand-name">ResearchHub</div>
              <p className="footer-brand-subtitle">Research. Discover. Make an Impact.</p>
            </div>
          </div>

          <nav className="footer-nav flex flex-wrap items-center justify-center gap-5 lg:gap-7">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
              >
                <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-[12.5px] sm:flex-row">
          <p className="footer-copy">&copy; {new Date().getFullYear()} ResearchHub. All rights reserved.</p>
          <div className="flex gap-5">
            {legal.map(l => (
              <Link key={l.to} to={l.to} className="footer-legal">
                {l.label}
              </Link>
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
