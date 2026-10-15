import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { ArrowLeft, Mail, Building2, Award, BookOpen, Calendar, Users, TrendingUp, Edit, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export default function AdminAuthorDetail() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [research, setResearch] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('publications');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      axios.get(`${API}/authors/${id}`),
      axios.get(`${API}/authors/${id}/stats`)
    ]).then(([authorRes, statsRes]) => {
      if (cancelled) return;
      setAuthor(authorRes.data);
      setResearch(authorRes.data.research || []);
      setStats(statsRes.data);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="admin-page flex items-center justify-center min-h-[400px]">Loading...</div>;
  if (!author) return <div className="admin-page text-center py-12">Author not found</div>;

  const statusConfig = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="admin-page space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/authors"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <div className="flex-1">
          <h1 className="admin-title">{author.name}</h1>
          <p className="admin-subtitle">Author Profile & Publications</p>
        </div>
        <Link to={`/admin/authors/${id}/edit`}><Button variant="outline"><Edit className="h-4 w-4" /> Edit</Button></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-brand text-white text-3xl font-bold">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-forest">{author.name}</h3>
              {author.affiliation && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-green"><Building2 className="h-3.5 w-3.5" /> {author.affiliation}</p>}
              {author.email && <a href={`mailto:${author.email}`} className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-green hover:text-forest"><Mail className="h-3.5 w-3.5" /> {author.email}</a>}
              {author.orcid && <a href={`https://orcid.org/${author.orcid}`} target="_blank" rel="noopener" className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-green hover:text-forest"><Award className="h-3.5 w-3.5" /> ORCID: {author.orcid}</a>}
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="py-4"><div className="text-2xl font-bold text-forest">{stats?.total_publications || 0}</div><div className="text-[12px] text-muted-green">Total Publications</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold text-emerald-600">{stats?.approved || 0}</div><div className="text-[12px] text-muted-green">Approved</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</div><div className="text-[12px] text-muted-green">Pending</div></CardContent></Card>
            <Card><CardContent className="py-4"><div className="text-2xl font-bold text-[#0C765E]">{stats?.programs_count || 0}</div><div className="text-[12px] text-muted-green">Programs</div></CardContent></Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1.5 rounded-full border border-[#E6EDE9] bg-white p-1.5">
              <TabsTrigger value="publications" className="px-4 py-1.5 text-[13px] font-semibold text-muted-green">Publications ({research.length})</TabsTrigger>
              <TabsTrigger value="stats" className="px-4 py-1.5 text-[13px] font-semibold text-muted-green">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="publications" className="admin-panel mt-5">
              {research.length === 0 ? (
                <div className="py-14 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#8AA79E]" />
                  <h3 className="section-title text-[22px]">No publications yet</h3>
                </div>
              ) : (
                <Table className="admin-table">
                  <TableHeader><TableRow className="border-0"><TableHead>Title</TableHead><TableHead>Program</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {research.map(r => (
                      <TableRow key={r.id}>
                        <TableCell><Link to={`/admin/research/${r.id}`} className="font-medium text-forest hover:underline">{r.title}</Link></TableCell>
                        <TableCell>{r.program_name || <span className="text-[#A3B5AF]">—</span>}</TableCell>
                        <TableCell className="font-mono text-muted-green">{r.year}</TableCell>
                        <TableCell><Badge variant={r.status} className="capitalize">{r.status}</Badge></TableCell>
                        <TableCell className="text-right"><Link to={`/admin/research/${r.id}`} className="p-2 rounded-full text-muted-green hover:bg-soft-green hover:text-forest" title="View"><MoreHorizontal className="h-4 w-4" /></Link></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="stats" className="admin-panel mt-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="py-4"><div className="text-2xl font-bold text-forest">{stats?.years_active || 0}</div><div className="text-[12px] text-muted-green">Years Active</div></CardContent></Card>
                <Card><CardContent className="py-4"><div className="text-2xl font-bold text-forest">{stats?.first_year || '—'}</div><div className="text-[12px] text-muted-green">First Publication</div></CardContent></Card>
                <Card><CardContent className="py-4"><div className="text-2xl font-bold text-forest">{stats?.latest_year || '—'}</div><div className="text-[12px] text-muted-green">Latest Publication</div></CardContent></Card>
                <Card><CardContent className="py-4"><div className="text-2xl font-bold text-forest">{stats?.rejected || 0}</div><div className="text-[12px] text-muted-green">Rejected</div></CardContent></Card>
              </div>

              {(stats?.by_year?.length || stats?.by_program?.length) && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {stats.by_year?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Publications by Year</CardTitle></CardHeader>
                      <CardContent>
                        <Table className="admin-table"><TableHeader><TableRow><TableHead>Year</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                        <TableBody>{stats.by_year.map(y => (<TableRow key={y.year}><TableCell className="font-mono">{y.year}</TableCell><TableCell className="text-right font-semibold text-[#0C765E]">{y.count}</TableCell></TableRow>))}</TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                  {stats.by_program?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Publications by Program</CardTitle></CardHeader>
                      <CardContent>
                        <Table className="admin-table"><TableHeader><TableRow><TableHead>Program</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                        <TableBody>{stats.by_program.map(p => (<TableRow key={p.code}><TableCell>{p.name}</TableCell><TableCell className="text-right font-semibold text-[#0C765E]">{p.count}</TableCell></TableRow>))}</TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}