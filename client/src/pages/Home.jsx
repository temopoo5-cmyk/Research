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
import { Search, FileText, ChevronLeft, ChevronRight, Users, BookOpen as BookOpenIcon, Sparkles, FolderOpen, ArrowRight, Quote } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [research, setResearch] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', program: '', year: '' });

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
    axios.get(`${API}/stats/`).then(r => { if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) setStats(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [page]);

  const handleSearch = (e) => { if (e) e.preventDefault(); setPage(1); fetchData(); };
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-[#23CE6B]/25 bg-gradient-to-br from-[#0A2B1C] via-[#0E3A24] to-[#0A2418]">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A2418] to-transparent" aria-hidden="true" />
        <FloatingBooks />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#23CE6B]/15 border border-[#23CE6B]/40 px-3.5 py-1.5 text-xs font-medium font-mono uppercase tracking-[0.18em] text-[#9FEBBF] mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Central research repository
              </div>
              <h1 className="headline-xl text-white text-5xl lg:text-[4.4rem] mb-5">
                Discover research
                <span className="block text-[#23CE6B] italic font-normal">works worth keeping.</span>
              </h1>
              <p className="text-[#9FEBBF]/85 text-lg mb-8 max-w-2xl">
                Browse and search the institutional repository. Submissions are automatically cataloged with unique codes.
              </p>
              {stats && (
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: 'Research Works', value: stats.total, icon: FileText },
                    { label: 'Programs', value: stats.programs, icon: FolderOpen },
                  ].map((s, i) => (
                    <div key={s.label} className={`flex items-center gap-3 rounded-2xl ${i === 0 ? 'quirk-a' : 'quirk-b'} glass-green px-4 py-3 float-slow`} style={{ animationDelay: `${i * 0.6}s` }}>
                      <div className="h-9 w-9 rounded-xl bg-[#23CE6B]/20 text-[#9FEBBF] flex items-center justify-center"><s.icon className="h-4 w-4" /></div>
                      <div>
                        <p className="font-display text-2xl font-semibold text-white leading-none">{s.value}</p>
                        <p className="text-xs text-[#9FEBBF]/70">{s.label}</p>
                      </div>
                    </div>
                  ))}
                  <Button className="gradient-btn-invert" onClick={() => navigate('/register')}>
                    Join the Repository <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="lg:pt-16"><BookPile /></div>
          </div>
        </div>
        <div className="relative z-10 h-4 bg-[#FBFDF8] [clip-path:polygon(0_70%,8%_55%,18%_78%,30%_52%,42%_76%,56%_48%,70%_74%,84%_54%,100%_72%,100%_100%,0_100%)]" aria-hidden="true" />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Card className="quirk-c -mt-1 card-lift">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 xl:col-span-2">
                  <Label className="eyebrow">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Title, author, code, keywords..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="eyebrow">Program</Label>
                  <Select value={filters.program || 'all'} onValueChange={v => setFilters({...filters, program: v === 'all' ? '' : v})}>
                    <SelectTrigger><SelectValue placeholder="All Programs" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(p => <SelectItem key={p.id} value={p.code}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="eyebrow">Year</Label>
                  <Select value={filters.year ? String(filters.year) : 'all'} onValueChange={v => setFilters({...filters, year: v === 'all' ? '' : v})}>
                    <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="eyebrow opacity-0 pointer-events-none">Go</Label>
                  <Button type="submit" className="w-full gradient-btn"><Search className="h-4 w-4" /> Search</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Fresh from the desk</p>
            <h2 className="headline text-3xl lg:text-4xl">Latest <span className="gradient-text italic">Research</span></h2>
          </div>
          {research.length > 0 && <span className="code-tag sticker-mint bg-[#23CE6B]/20 text-[#12854A] shrink-0">{research.length} result{research.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}><CardContent className="p-6 space-y-3"><div className="h-4 w-20 bg-muted rounded animate-pulse" /><div className="h-5 w-full bg-muted rounded animate-pulse" /><div className="h-4 w-2/3 bg-muted rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        ) : research.length === 0 ? (
          <Card className="quirk-a">
            <CardContent className="py-16 text-center">
              <div className="h-14 w-14 mx-auto mb-4 rounded-2xl quirk-b bg-[#23CE6B]/15 text-[#12854A] flex items-center justify-center tilt-l-sm"><BookOpenIcon className="h-7 w-7" /></div>
              <h3 className="font-display text-xl font-semibold mb-1">No research found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {research.map((r, i) => (
                  <Card key={r.id} className="card-lift cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/research/${r.id}`)}>
                    <div className={`h-1.5 ${i % 3 === 0 ? 'bg-[#23CE6B]' : i % 3 === 1 ? 'bg-[#1B7A45]' : 'bg-[#7DD3FC]'}`} />
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="code-tag sticker bg-[#0B2E1B] text-[#9FEBBF] -rotate-2">{r.code}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{r.year}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold leading-snug mb-2 line-clamp-2 transition-colors group-hover:text-[#12854A]">{r.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3"><Users className="h-3.5 w-3.5 text-[#12854A]" />{r.authors}</p>
                      {r.abstract && (
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-4 flex items-start gap-1.5">
                          <Quote className="h-3 w-3 rotate-180 shrink-0 mt-0.5 text-[#23CE6B]" />
                          <span className="italic">{r.abstract}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-3 border-t border-border">
                        {r.program_name && <span className="font-medium text-[#12854A]">{r.program_name}</span>}
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(p => (
                  <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)} className={p === page ? 'gradient-btn rounded-full' : 'rounded-full'}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}