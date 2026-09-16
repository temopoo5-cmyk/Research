import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import BookOpening from '../components/BookOpening';
import { ArrowLeft, Download, Eye, Users, Award, FolderTree, Calendar, FileText, Tags, CheckCircle2, XCircle, Inbox, BookOpen } from 'lucide-react';

const rowMeta = {
  adviser: { icon: Award, tint: 'bg-amber-100 text-amber-700' },
  program: { icon: FolderTree, tint: 'bg-emerald-100 text-emerald-700' },
  year: { icon: Calendar, tint: 'bg-sky-100 text-sky-700' },
  type: { icon: BookOpen, tint: 'bg-violet-100 text-violet-700' },
  category: { icon: Tags, tint: 'bg-teal-100 text-teal-700' },
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
    { key: 'type', label: 'Research Type', value: research.research_type },
    { key: 'category', label: 'Category', value: research.category_name || 'N/A' },
  ];

  return (
    <>
      {opening && <BookOpening title={research.title} authors={authors.join(', ')} type={research.research_type} />}

      <div
        className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
        style={{
          opacity: reveal ? 1 : 0,
          transform: reveal ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
          {isAdmin && (
            <div className="flex gap-2">
              {research.status !== 'approved' && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { axios.patch(`${API}/research/${id}/status`, { status: 'approved' }).then(r => setResearch(r.data)); }}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
              {research.status !== 'rejected' && (
                <Button variant="destructive" onClick={() => { axios.patch(`${API}/research/${id}/status`, { status: 'rejected' }).then(r => setResearch(r.data)); }}>
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant={research.status} className="capitalize">{research.status}</Badge>
              <span className="text-sm font-bold text-emerald-700 tracking-wide bg-emerald-50 px-3 py-1 rounded-md">{research.code}</span>
            </div>
            <CardTitle className="text-2xl leading-snug">{research.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {detailRows.map(row => {
                const meta = rowMeta[row.key] || { icon: FileText, tint: 'bg-emerald-100 text-emerald-700' };
                const Icon = meta.icon;
                return (
                  <div key={row.key} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.tint}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="text-sm font-medium text-foreground">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Authors</p>
              <div className="flex flex-wrap gap-2">
                {authors.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-100 shadow-sm text-sm font-medium text-emerald-900">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{a.charAt(0).toUpperCase()}</span>
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
                    <span key={i} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {research.abstract && (
              <div>
                <Separator className="bg-emerald-100 mb-4" />
                <p className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Abstract</p>
                <div className="relative rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-5 sm:p-6 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-400" />
                  <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground font-serif first-letter:text-4xl first-letter:font-bold first-letter:text-emerald-600 first-letter:float-left first-letter:mr-2 first-letter:leading-none">
                    {research.abstract}
                  </p>
                </div>
              </div>
            )}

            {research.file_path ? (
              <div>
                <Separator className="bg-emerald-100 mb-4" />
                <div className="flex flex-wrap gap-2">
                  <a href={`${API}/research/download/${research.id}`} download>
                    <Button className="gradient-btn"><Download className="h-4 w-4" /> Download Document</Button>
                  </a>
                  <a href={`${API}/research/download/${research.id}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Eye className="h-4 w-4" /> Open Preview</Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                <Inbox className="h-4 w-4" /> No digital document attached for this research.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}