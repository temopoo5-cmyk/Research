import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Info, BookMarked, FileText, ArrowLeft } from 'lucide-react';

export default function SubmitResearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ title: '', authors: '', adviser: '', program_id: '', year: new Date().getFullYear(), abstract: '', keywords: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!id;

  useEffect(() => {
    axios.get(`${API}/programs/`).then(r => { if (Array.isArray(r.data)) setPrograms(r.data); }).catch(() => {});
    if (isEdit) {
      axios.get(`${API}/research/${id}`).then(r => {
        const d = r.data;
        setForm({ title: d.title, authors: d.authors, adviser: d.adviser || '', program_id: d.program_id ? String(d.program_id) : '', year: d.year, abstract: d.abstract || '', keywords: d.keywords || '' });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await axios.put(`${API}/research/${id}`, form);
      } else {
        await axios.post(`${API}/research/`, form);
      }
      navigate(isAdmin ? '/admin/research' : '/research');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    }
    setLoading(false);
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
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">{error}</div>}

          <div className="admin-note mb-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
            <span>A unique research code (e.g. <strong className="font-mono font-semibold text-[#0C765E]">RS-2026-0001</strong>) will be automatically assigned when submitted.</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Enter the research title" className="rounded-xl border-[#DCEBE5] bg-ivory" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authors">Authors *</Label>
                <Input id="authors" value={form.authors} onChange={e => setForm({...form, authors: e.target.value})} required placeholder="e.g. Juan Dela Cruz, Maria Santos" className="rounded-xl border-[#DCEBE5] bg-ivory" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adviser">Adviser</Label>
                <Input id="adviser" value={form.adviser} onChange={e => setForm({...form, adviser: e.target.value})} placeholder="Research adviser" className="rounded-xl border-[#DCEBE5] bg-ivory" />
              </div>
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
    </div>
  );
}