import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import BookOpening from '../components/BookOpening';
import { ArrowLeft, Users, Award, FolderTree, Calendar, FileText, Tags, CheckCircle2, XCircle, BookOpen } from 'lucide-react';

const rowMeta = {
  adviser: { icon: Award, tint: 'bg-amber-100 text-amber-700' },
  program: { icon: FolderTree, tint: 'bg-[#23CE6B]/15 text-[#12854A]' },
  year: { icon: Calendar, tint: 'bg-sky-100 text-sky-700' },
  code: { icon: FileText, tint: 'bg-orange-100 text-orange-700' },
};

export default function ResearchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [research, setResearch] = useState(null);
  const [opening, setOpening] = useState(true);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    axios.get(`${API}/research/${id}`).then(r => setResearch(r.data)).catch(() => navigate('/'));
  }, [id]);

  useEffect(() => {
    setOpening(true);
    setReveal(false);
    const t1 = setTimeout(() => setReveal(true), 2100);
    const t2 = setTimeout(() => setOpening(false), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id]);

  if (!research) return <div className="flex items-center justify-center h-64"><div className="text-lg font-semibold gradient-text">Loading...</div></div>;

  const keywords = research.keywords ? research.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
  const authors = research.authors ? research.authors.split(',').map(a => a.trim()).filter(Boolean) : [];

  const detailRows = [
    { key: 'code', label: 'Research Code', value: research.code },
    { key: 'adviser', label: 'Adviser', value: research.adviser || 'N/A' },
    { key: 'program', label: 'Program', value: research.program_name ? `${research.program_name} (${research.program_code})` : 'N/A' },
    { key: 'year', label: 'Year', value: research.year },
  ];

  return (
    <>
      {opening && <BookOpening title={research.title} authors={authors.join(', ')} />}

      <div
        className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
        style={{
          opacity: reveal ? 1 : 0,
          transform: reveal ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
          {isAdmin && (
            <div className="flex gap-2">
              {research.status !== 'approved' && (
                <Button className="gradient-btn rounded-full" onClick={() => { axios.patch(`${API}/research/${id}/status`, { status: 'approved' }).then(r => setResearch(r.data)); }}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
              {research.status !== 'rejected' && (
                <Button variant="destructive" className="rounded-full" onClick={() => { axios.patch(`${API}/research/${id}/status`, { status: 'rejected' }).then(r => setResearch(r.data)); }}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="quirk-c overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#23CE6B] via-[#1B7A45] to-[#7DD3FC]" />
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant={research.status} className="capitalize">{research.status}</Badge>
              <span className="code-tag sticker bg-[#0B2E1B] text-[#9FEBBF] -rotate-2">{research.code}</span>
            </div>
            <p className="eyebrow mb-2">Catalogued work</p>
            <CardTitle className="font-display text-3xl leading-tight">{research.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {detailRows.map((row, i) => {
                const meta = rowMeta[row.key] || { icon: FileText, tint: 'bg-[#23CE6B]/15 text-[#12854A]' };
                const Icon = meta.icon;
                return (
                  <div key={row.key} className={`flex items-start gap-3 p-3.5 rounded-2xl ${i % 2 ? 'quirk-b' : 'quirk-a'} bg-white/70 border border-border`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.tint}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Authors</p>
              <div className="flex flex-wrap gap-2">
                {authors.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-border shadow-sm text-sm font-medium">
                    <span className="h-5 w-5 rounded-full bg-[#23CE6B]/20 text-[#12854A] flex items-center justify-center text-[10px] font-bold font-mono">{a.charAt(0).toUpperCase()}</span>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {keywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5"><Tags className="h-3.5 w-3.5" /> Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-[#23CE6B]/15 text-[#12854A] text-xs font-medium">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {research.abstract && (
              <div>
                <Separator className="mb-4" />
                <p className="text-sm font-semibold text-[#12854A] mb-2 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Abstract</p>
                <div className="relative rounded-2xl rounded-br-sm border border-border bg-white/70 p-5 sm:p-6 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#23CE6B]" />
                  <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground font-display first-letter:text-4xl first-letter:font-semibold first-letter:text-[#12854A] first-letter:float-left first-letter:mr-2 first-letter:leading-none">
                    {research.abstract}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}