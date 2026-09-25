import React from 'react';
import { Lock, Quote, MapPin } from 'lucide-react';

export function LabNotice({ compact = false }) {
  return (
    <>
      <span className="code-tag sticker-mint bg-[#23CE6B]/20 text-[#12854A] inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3" /> Abstract preview
      </span>
      <p className={`relative z-10 flex items-start gap-1.5 leading-snug text-muted-foreground ${compact ? 'text-[11px] mt-2' : 'text-sm mt-4'}`}>
        <MapPin className="h-3.5 w-3.5 shrink-0 mt-px text-[#12854A]" />
        <span>
          Want the full research book? Read it at the{' '}
          <span className="font-semibold text-[#12854A]">Research Laboratory of De La Salle John Bosco College</span>.
        </span>
      </p>
    </>
  );
}

export default function LockedAbstract({ text, compact = false }) {
  if (!text) return null;

  const previewLength = compact ? 140 : 240;
  const preview = text.length > previewLength ? `${text.slice(0, previewLength).trimEnd()}…` : text;

  if (compact) {
    return (
      <div className="abstract-lock rounded-xl border border-border bg-white/60 p-3.5">
        <div className="flex items-start gap-1.5">
          <Quote className="h-3 w-3 rotate-180 shrink-0 mt-0.5 text-[#23CE6B]" />
          <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-3">{preview}</p>
        </div>
        <div className="relative z-10">
          <LabNotice compact />
        </div>
      </div>
    );
  }

  return (
    <div className="abstract-lock rounded-2xl rounded-br-sm border border-border bg-white/70 p-5 sm:p-6 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#23CE6B]" />
      <div className="flex items-start gap-1.5">
        <Quote className="h-3 w-3 rotate-180 shrink-0 mt-1 text-[#23CE6B]" />
        <p className="text-sm sm:text-[15px] italic leading-relaxed text-muted-foreground font-display">
          {preview}
        </p>
      </div>
      <div className="relative z-10">
        <LabNotice />
        <div className="mt-4 rounded-2xl bg-[#0A2B1C] px-4 py-3 text-[#9FEBBF] text-xs sm:text-sm leading-relaxed flex items-start gap-2.5">
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-[#23CE6B]" />
          <p>
            Abstracts are previewed online only. The complete manuscript is available for reading at the{' '}
            <span className="font-semibold text-[#23CE6B]">Research Laboratory</span> of De La Salle John Bosco College.
          </p>
        </div>
      </div>
    </div>
  );
}
