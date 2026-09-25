import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Info } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Repository intake</p>
          <h1 className="headline text-4xl">{isEdit ? 'Edit' : 'Submit'} <span className="gradient-text italic">Research</span></h1>
          <p className="text-muted-foreground mt-1">{isEdit ? 'Update the research record' : 'Submit a new research work to the institutional repository'}</p>
        </div>
        <span className="code-tag sticker bg-[#0B2E1B] text-[#9FEBBF] -rotate-1">RS / INTAKE FORM</span>
      </div>

      <Card className="quirk-c overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#23CE6B] via-[#1B7A45] to-[#7DD3FC]" />
        <CardContent className="p-6 md:p-8">
          {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground p-4 rounded-2xl quirk-b bg-[#23CE6B]/10 border border-[#23CE6B]/30">
            <Info className="h-4 w-4 text-[#12854A] shrink-0" />
            <span>A unique research code (e.g. <strong className="text-[#12854A] font-mono">RS-2026-0001</strong>) will be automatically assigned when submitted.</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Enter the research title" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="authors">Authors *</Label>
                <Input id="authors" value={form.authors} onChange={e => setForm({...form, authors: e.target.value})} required placeholder="e.g. Juan Dela Cruz, Maria Santos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adviser">Adviser</Label>
                <Input id="adviser" value={form.adviser} onChange={e => setForm({...form, adviser: e.target.value})} placeholder="Research adviser" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program_id ? String(form.program_id) : 'none'} onValueChange={v => setForm({...form, program_id: v === 'none' ? '' : v})}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Program</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={String(form.year)} onValueChange={v => setForm({...form, year: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input id="keywords" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="Comma-separated keywords, e.g. machine learning, education" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea id="abstract" rows={5} value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})} placeholder="Enter the research abstract..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="gradient-btn min-w-40 rounded-full">{loading ? 'Submitting...' : isEdit ? 'Update Research' : 'Submit Research'}</Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}