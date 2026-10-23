import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Info, BookMarked, FileText, ArrowLeft, Plus, UserPlus, Search, X, Save, Loader2 } from 'lucide-react';

export default function SubmitResearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState([]);
  const [authorDialogOpen, setAuthorDialogOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState('');
  const [newAuthorDialogOpen, setNewAuthorDialogOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState({ name: '', email: '', affiliation: '', orcid: '' });
  const [creatingAuthor, setCreatingAuthor] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', adviser: '', program_id: '', year: new Date().getFullYear(), abstract: '', keywords: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!id;

  useEffect(() => {
    axios.get(`${API}/programs/`).then(r => { if (Array.isArray(r.data)) setPrograms(r.data); }).catch(() => {});
    // fetch all authors (paginated)
    const fetchAllAuthors = async () => {
      try {
        let allAuthors = [];
        let page = 1;
        const limit = 200;
        while (true) {
          const res = await axios.get(`${API}/authors/`, { params: { limit, page, sort: 'name' } });
          const data = res.data.data || res.data;
          if (!Array.isArray(data) || data.length === 0) break;
          allAuthors = allAuthors.concat(data);
          if (data.length < limit) break;
          page++;
        }
        setAuthors(allAuthors);
      } catch (e) {}
    };
    fetchAllAuthors();
    if (isEdit) {
      axios.get(`${API}/research/${id}`).then(r => {
        const d = r.data;
        const authorIds = d.author_details?.map(a => a.id) || [];
        setSelectedAuthorIds(authorIds);
        const authorNames = d.author_details?.map(a => a.name).join(', ') || d.authors || '';
        setForm({ title: d.title, authors: authorNames, adviser: d.adviser || '', program_id: d.program_id ? String(d.program_id) : '', year: d.year, abstract: d.abstract || '', keywords: d.keywords || '' });
      });
    }
  }, [id]);

  const handleAuthorSelect = (authorId) => {
    setSelectedAuthorIds(prev => {
      const next = prev.includes(authorId) ? prev.filter(id => id !== authorId) : [...prev, authorId];
      const names = authors.filter(a => next.includes(a.id)).map(a => a.name);
      setForm(f => ({ ...f, authors: names.join(', ') }));
      return next;
    });
  };

  const handleCreateAuthor = async (e) => {
    e.preventDefault();
    if (!newAuthor.name.trim()) return;
    setCreatingAuthor(true);
    try {
      const res = await axios.post(`${API}/authors/`, newAuthor);
      setAuthors(prev => [res.data, ...prev]);
      setSelectedAuthorIds(prev => [...prev, res.data.id]);
      setForm(f => ({ ...f, authors: [...authors.filter(a => selectedAuthorIds.includes(a.id)), res.data].map(a => a.name).join(', ') }));
      setNewAuthor({ name: '', email: '', affiliation: '', orcid: '' });
      setNewAuthorDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create author');
    }
    setCreatingAuthor(false);
  };

  const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, author_ids: selectedAuthorIds };
      if (isEdit) {
        await axios.put(`${API}/research/${id}`, payload);
      } else {
        await axios.post(`${API}/research/`, payload);
      }
      setTimeout(() => navigate(isAdmin ? '/admin/research' : '/research'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="admin-eyebrow">
            <BookMarked className="h-3 w-3" />
            Repository Intake
          </span>
          <h1 className="admin-title mt-3">{isEdit ? 'Edit' : 'Submit'} <em>Research</em></h1>
          <p className="admin-subtitle">{isEdit ? 'Update the research record' : 'Submit a new research work to the institutional repository'}</p>
        </div>
        <Button type="button" variant="outline" className="rounded-full border-[#DCEBE5] text-[13px] font-semibold text-muted-green transition hover:bg-soft-green hover:text-forest" onClick={() => navigate(isAdmin ? '/admin/research' : '/research')}>
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="admin-panel overflow-hidden">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title"><FileText className="h-4 w-4 text-emerald-brand" /> Work Details</h2>
          <span className="text-[12px] font-semibold text-muted-green"><span className="text-red-500">*</span> Required fields</span>
        </div>
        <div className="admin-panel-body">
          <div className="admin-note mb-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
            <span>A unique research code (e.g. <strong className="font-mono font-semibold text-[#0C765E]">RS-2026-0001</strong>) will be automatically assigned when submitted.</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Enter the research title" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="space-y-2">
                <Label>Authors *</Label>
                <Dialog open={authorDialogOpen} onOpenChange={setAuthorDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="relative">
                      <div className="rounded-xl border-[#DCEBE5] bg-ivory px-4 py-2.5 min-h-[44px] flex flex-wrap items-center gap-2">
{selectedAuthorIds.length === 0 ? (
                              <span className="text-[#A3B5AF]">Select authors...</span>
                            ) : (
                              <>
                                {selectedAuthorIds.map(id => {
                                  const author = authors.find(a => a.id === id);
                                  return author ? (
                                    <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-soft-green text-[12px] font-medium text-[#0C765E]">
                                      {author.name}
                                      <button type="button" onClick={() => handleAuthorSelect(id)} className="text-[#0C765E] hover:text-red-500"><X className="h-3 w-3" /></button>
                                    </span>
                                  ) : null;
                                })}
                              </>
                            )}
                      </div>
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8AA79E]" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[60vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        Select Authors
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNewAuthorDialogOpen(true)}><Save className="h-3.5 w-3.5" /> Enter</Button>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> New</Button>
                          </DialogTrigger>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8AA79E]" />
                        <input type="search" value={authorSearch} onChange={e => setAuthorSearch(e.target.value)} placeholder="Search authors..." className="w-full pl-10 pr-4 py-2 rounded-xl border-[#DCEBE5] bg-ivory text-[13.5px] focus-visible:border-emerald-brand" />
                      </div>
                      <div className="max-h-[40vh] overflow-y-auto space-y-2">
                        {filteredAuthors.length === 0 ? (
                          <p className="text-center text-muted-green py-4">No authors found. <Link to="/admin/authors/new" className="text-emerald-brand underline">Create new author</Link></p>
                        ) : (
                          filteredAuthors.map(a => (
                            <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-soft-green transition cursor-pointer">
                              <Checkbox checked={selectedAuthorIds.includes(a.id)} onChange={() => handleAuthorSelect(a.id)} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-forest truncate">{a.name}</p>
                                <p className="text-[11px] text-muted-green truncate">{a.affiliation || 'No affiliation'}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-[11px] text-muted-green">{selectedAuthorIds.length} author{selectedAuthorIds.length !== 1 ? 's' : ''} selected</p>
              </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program_id ? String(form.program_id) : 'none'} onValueChange={v => setForm({...form, program_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="rounded-xl border-[#DCEBE5] bg-ivory"><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Program</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={String(form.year)} onValueChange={v => setForm({...form, year: parseInt(v)})}>
                  <SelectTrigger className="rounded-xl border-[#DCEBE5] bg-ivory"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input id="keywords" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="Comma-separated keywords, e.g. machine learning, education" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea id="abstract" rows={5} value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})} placeholder="Enter the research abstract..." className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3 border-t border-[#EEF3F0] pt-5">
            <Button type="submit" disabled={loading} className="gradient-btn min-w-40 rounded-full">
              {loading ? 'Saving...' : isEdit ? 'Update Research' : 'Submit Research'}
            </Button>
            <Button type="button" variant="outline" className="rounded-full border-[#DCEBE5] text-[13px] font-semibold text-muted-green transition hover:bg-soft-green hover:text-forest" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </div>
      </form>

      <Dialog open={newAuthorDialogOpen} onOpenChange={setNewAuthorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Author</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAuthor} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="new-author-name">Name *</Label>
              <Input id="new-author-name" value={newAuthor.name} onChange={e => setNewAuthor({...newAuthor, name: e.target.value})} required placeholder="Author name" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-author-email">Email</Label>
              <Input id="new-author-email" type="email" value={newAuthor.email} onChange={e => setNewAuthor({...newAuthor, email: e.target.value})} placeholder="author@example.com" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-author-affiliation">Affiliation</Label>
              <Input id="new-author-affiliation" value={newAuthor.affiliation} onChange={e => setNewAuthor({...newAuthor, affiliation: e.target.value})} placeholder="Institution/Organization" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-author-orcid">ORCID</Label>
              <Input id="new-author-orcid" value={newAuthor.orcid} onChange={e => setNewAuthor({...newAuthor, orcid: e.target.value})} placeholder="0000-0000-0000-0000" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={creatingAuthor || !newAuthor.name.trim()} className="gradient-btn rounded-full flex-1">
                {creatingAuthor ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & Add'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setNewAuthorDialogOpen(false)} className="rounded-full border-[#DCEBE5] text-[13px] font-semibold text-muted-green flex-1">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}