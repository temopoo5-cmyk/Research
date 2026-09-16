import React from 'react';
import { Book, BookOpen, BookMarked, Library, Feather } from 'lucide-react';

const bookPositions = [
  { icon: BookOpen, top: '8%', left: '3%', size: 'h-10 w-10', color: 'text-[#23CE6B]/40', dur: '9s', delay: '0s', tilt: '-8deg' },
  { icon: Book, top: '66%', left: '6%', size: 'h-14 w-14', color: 'text-[#4F6D7A]/30', dur: '11.5s', delay: '1.2s', tilt: '6deg' },
  { icon: BookMarked, top: '20%', left: '88%', size: 'h-11 w-11', color: 'text-[#23CE6B]/40', dur: '10s', delay: '0.6s', tilt: '-4deg' },
  { icon: Library, top: '76%', left: '86%', size: 'h-12 w-12', color: 'text-[#4F6D7A]/30', dur: '12s', delay: '2.1s', tilt: '9deg' },
  { icon: Book, top: '42%', left: '93%', size: 'h-10 w-10', color: 'text-[#23CE6B]/40', dur: '9.5s', delay: '1.7s', tilt: '-10deg' },
  { icon: Feather, top: '50%', left: '2%', size: 'h-8 w-8', color: 'text-[#4F6D7A]/30', dur: '8.5s', delay: '2.6s', tilt: '-6deg' },
];

export default function FloatingBooks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {bookPositions.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="float-book"
            style={{
              top: b.top,
              left: b.left,
              animationDuration: b.dur,
              animationDelay: b.delay,
              ['--tilt']: b.tilt,
            }}
          >
            <Icon className={`${b.size} ${b.color}`} strokeWidth={1.4} />
          </div>
        );
      })}
    </div>
  );
}

export function BookPile() {
  return (
    <div className="relative hidden lg:block" aria-hidden="true">
      <div
        className="float-book"
        style={{ left: 'auto', right: '-14px', top: '-34px', animationDuration: '8s', ['--tilt']: '8deg' }}
      >
        <div className="flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-[#0A122A] shadow-lg shadow-orange-200 font-semibold text-xs">
          <Book className="h-4 w-4" /> Repository Guide
        </div>
      </div>

      <div className="relative">
        <div className="mb-3 flex items-end gap-3">
          <div className="flex h-9 w-7 rotate-6 items-center justify-center rounded-sm bg-gradient-to-b from-violet-600 to-purple-600 text-[9px] font-bold text-[#0A122A] shadow-lg shadow-violet-200">
            AI
          </div>
          <div className="flex h-10 w-8 -rotate-3 items-center justify-center rounded-sm bg-gradient-to-b from-amber-600 to-orange-500 text-[9px] font-bold text-[#0A122A] shadow-lg shadow-amber-200">
            TH
          </div>
          <div className="flex h-8 w-6 rotate-3 items-center justify-center rounded-sm bg-[#23CE6B] text-[9px] font-bold text-[#0A122A] shadow-lg shadow-[#23CE6B]/30">
            RP
          </div>
        </div>
        <div className="rounded-lg bg-[#EAF7F0] p-4 text-[#0A122A] shadow-2xl shadow-[#0A122A]/40 ring-1 ring-white/10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#23CE6B]">ResearchHub</p>
          <p className="mt-1 text-xl font-bold leading-snug">A Library of<br />Ideas</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#4F6D7A]">
            <BookOpen className="h-3.5 w-3.5 text-[#23CE6B]" /> Theses, Capstones &amp; Papers
          </div>
        </div>
      </div>
    </div>
  );
}