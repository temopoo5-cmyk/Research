import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import FloatingBooks, { BookPile } from '../components/FloatingBooks';
import { Search, FileText, ChevronLeft, ChevronRight, Users, BookOpen as BookOpenIcon, GraduationCap, Sparkles, FolderOpen, ArrowRight, Cpu, Quote } from 'lucide-react';

const typeMeta = {
  'Research Paper': { icon: FileText, bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-600 border-orange-100', hover: 'group-hover:text-orange-600' },
  'Thesis': { icon: GraduationCap, bar: 'bg-blue-600', chip: 'bg-blue-50 text-blue-600 border-blue-100', hover: 'group-hover:text-blue-600' },
  'Capstone Project': { icon: Cpu, bar: 'bg-violet-600', chip: 'bg-violet-50 text-violet-600 border-violet-100', hover: 'group-hover:text-violet-600' },
};

export default function Home() {
  const navigate = useNavigate();
  const [research, setResearch] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', program: '', year: '', category: '', type: '' });

  const fetchData = () => {
    setLoading(true);
    const params = { ...filters, page, limit: 12 };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    axios.get(`${API}/research/`, { params }).then(r => {
      setResearch(Array.isArray(r.data?.data) ? r.data.data : []);
      setTotalPages(Number.isFinite(r.data?.pages) ? r.data.pages : 1);
      setLoading(false);
    }).catch(() => { setResearch([]); setTotalPages(1); setLoading(false); });
  };

  useEffect(() => {
    axios.get(`${API}/programs/`).then(r => { if (Array.isArray(r.data)) setPrograms(r.data); }).catch(() => {});
    axios.get(`${API}/categories/`).then(r => { if (Array.isArray(r.data)) setCategories(r.data); }).catch(() => {});
    axios.get(`${API}/stats/`).then(r => { if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) setStats(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [page]);

  const handleSearch = (e) => { if (e) e.preventDefault(); setPage(1); fetchData(); };
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-[#4F6D7A]/20 bg-[#EAF7F0]">
        <FloatingBooks />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#23CE6B]/70 border border-[#4F6D7A]/30 px-3 py-1 text-xs font-medium text-[#243010] mb-5">
                <Sparkles className="h-3.5 w-3.5" /> Central research repository
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                <span className="gradient-text">Discover research</span> papers, theses &amp; capstones
              </h1>
              <p className="text-[#4F6D7A] text-lg mb-8 max-w-2xl">
                Browse and search the institutional repository. Submissions are automatically cataloged with unique codes.
              </p>
              {stats && (
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Research Works', value: stats.total, icon: FileText },
                    { label: 'Programs', value: stats.programs, icon: FolderOpen },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3 rounded-xl bg-[#DCEFE4]/80 backdrop-blur border border-[#4F6D7A]/20 px-4 py-3 shadow-sm">
                      <div className="h-9 w-9 rounded-lg bg-[#23CE6B]/15 text-[#23CE6B] flex items-center justify-center"><s.icon className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xl font-bold text-[#0A122A] leading-none">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  ))}
                  <Button className="gradient-btn" onClick={() => navigate('/register')}>
                    Join the Repository <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <BookPile />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Card className="border-[#4F6D7A]/20 shadow-lg shadow-[#4F6D7A]/10 -mt-2 bg-[#DCEFE4]">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                <div className="space-y-2 xl:col-span-2">
                  <Label className="text-xs text-muted-foreground">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Title, author, keywords..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="pl-9 border-[#4F6D7A]/30 ring-[#23CE6B]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Program</Label>
                  <Select value={filters.program || 'all'} onValueChange={v => setFilters({...filters, program: v === 'all' ? '' : v})}>
                    <SelectTrigger className="border-[#4F6D7A]/30 ring-[#23CE6B]"><SelectValue placeholder="All Programs" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(p => <SelectItem key={p.id} value={p.code}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Select value={filters.year ? String(filters.year) : 'all'} onValueChange={v => setFilters({...filters, year: v === 'all' ? '' : v})}>
                    <SelectTrigger className="border-[#4F6D7A]/30 ring-[#23CE6B]"><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={filters.category || 'all'} onValueChange={v => setFilters({...filters, category: v === 'all' ? '' : v})}>
                    <SelectTrigger className="border-[#4F6D7A]/30 ring-[#23CE6B]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={filters.type || 'all'} onValueChange={v => setFilters({...filters, type: v === 'all' ? '' : v})}>
                    <SelectTrigger className="border-[#4F6D7A]/30 ring-[#23CE6B]"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Research Paper">Research Paper</SelectItem>
                      <SelectItem value="Thesis">Thesis</SelectItem>
                      <SelectItem value="Capstone Project">Capstone Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">&nbsp;</Label>
                  <Button type="submit" className="w-full gradient-btn"><Search className="h-4 w-4" /> Search</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-10 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Latest Research</h2>
          {research.length > 0 && <span className="text-sm text-muted-foreground">{research.length} result{research.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-[#4F6D7A]/20 bg-[#DCEFE4]"><CardContent className="p-6 space-y-3"><div className="h-4 w-20 bg-[#23CE6B]/15 rounded animate-pulse" /><div className="h-5 w-full bg-[#23CE6B]/15 rounded animate-pulse" /><div className="h-4 w-2/3 bg-[#23CE6B]/15 rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        ) : research.length === 0 ? (
          <Card className="border-[#4F6D7A]/20 bg-[#DCEFE4]">
            <CardContent className="py-16 text-center">
              <BookOpenIcon className="h-12 w-12 mx-auto mb-3 text-[#23CE6B]/50" />
              <h3 className="font-semibold text-lg mb-1">No research found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {research.map(r => {
                const meta = typeMeta[r.research_type] || { icon: FileText, bar: 'bg-[#23CE6B]', chip: 'bg-[#23CE6B]/10 text-[#23CE6B] border-[#23CE6B]/20', hover: 'group-hover:text-[#23CE6B]' };
                const Icon = meta.icon;
                return (
                  <Card key={r.id} className="border-[#4F6D7A]/20 transition-all hover:shadow-xl hover:shadow-[#23CE6B]/10 hover:-translate-y-1 cursor-pointer overflow-hidden group bg-[#DCEFE4]"
                    onClick={() => navigate(`/research/${r.id}`)}>
                    <div className={`h-1.5 ${meta.bar}`} />
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#0A122A] tracking-wide bg-[#4F6D7A]/30 px-2.5 py-1 rounded-md">{r.code}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.chip}`}>
                          <Icon className="h-3 w-3" />{r.research_type}
                        </span>
                      </div>
                      <h3 className={`font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#0A122A] transition-colors ${meta.hover}`}>{r.title}</h3>
                      <p className="text-sm text-[#4F6D7A]/80 flex items-center gap-1.5 mb-2.5"><Users className="h-3.5 w-3.5 text-[#23CE6B]" />{r.authors}</p>
                      {r.abstract && (
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-3 flex items-start gap-1.5">
                          <Quote className="h-3 w-3 rotate-180 shrink-0 mt-0.5 text-[#23CE6B]/70" />
                          <span className="italic">{r.abstract}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-3 border-t border-[#4F6D7A]/35">
                        {r.program_name && <span>{r.program_name}</span>}
                        <span>{r.year}</span>
                        {r.category_name && <span className="text-[#23CE6B]">{r.category_name}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="border-[#4F6D7A]/30 text-[#243010] hover:bg-[#4F6D7A]/10"><ChevronLeft className="h-4 w-4" /> Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
                  <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)} className={p === page ? 'gradient-btn' : 'border-[#4F6D7A]/30 text-[#243010] hover:bg-[#4F6D7A]/10'}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="border-[#4F6D7A]/30 text-[#243010] hover:bg-[#4F6D7A]/10">Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}