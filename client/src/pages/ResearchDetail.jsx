import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Download, Eye, Users, Award, FolderTree, Calendar, FileText, Tags, CheckCircle2, XCircle, Inbox } from 'lucide-react';

export default function ResearchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [research, setResearch] = useState(null);

  useEffect(() => { axios.get(`${API}/research/${id}`).then(r => setResearch(r.data)).catch(() => navigate('/')); }, [id]);

  if (!research) return <div className="flex items-center justify-center h-64"><div className="text-lg font-semibold gradient-text">Loading...</div></div>;

  const keywords = research.keywords ? research.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

  const detailRows = [
    { label: 'Research Code', value: research.code, icon: FileText },
    { label: 'Authors', value: research.authors, icon: Users },
    { label: 'Adviser', value: research.adviser || 'N/A', icon: Award },
    { label: 'Program', value: research.program_name ? `${research.program_name} (${research.program_code})` : 'N/A', icon: FolderTree },
    { label: 'Year', value: research.year, icon: Calendar },
    { label: 'Research Type', value: research.research_type, icon: FileText },
    { label: 'Category', value: research.category_name || 'N/A', icon: Tags },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
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
            {detailRows.map((row, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><row.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-medium text-foreground">{row.value}</p>
                </div>
              </div>
            ))}
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
              <p className="text-sm font-semibold text-emerald-800 mb-2">Abstract</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{research.abstract}</p>
            </div>
          )}

          {research.file_path && (
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
          )}

          {!research.file_path && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <Inbox className="h-4 w-4" /> No digital document attached for this research.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}