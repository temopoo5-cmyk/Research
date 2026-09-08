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
import { UploadCloud, Info } from 'lucide-react';

export default function SubmitResearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', authors: '', adviser: '', program_id: '', year: new Date().getFullYear(), category_id: '', research_type: 'Thesis', abstract: '', keywords: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!id;

  useEffect(() => {
    axios.get(`${API}/programs/`).then(r => setPrograms(r.data));
    axios.get(`${API}/categories/`).then(r => setCategories(r.data));
    if (isEdit) {
      axios.get(`${API}/research/${id}`).then(r => {
        const d = r.data;
        setForm({ title: d.title, authors: d.authors, adviser: d.adviser || '', program_id: d.program_id ? String(d.program_id) : '', year: d.year, category_id: d.category_id ? String(d.category_id) : '', research_type: d.research_type, abstract: d.abstract || '', keywords: d.keywords || '' });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      if (file) fd.append('file', file);
      if (isEdit) {
        await axios.put(`${API}/research/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API}/research/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      <div>
        <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">{isEdit ? 'Edit Research' : 'Submit Research'}</span></h1>
        <p className="text-muted-foreground">{isEdit ? 'Update the research record' : 'Submit a new research paper, thesis, or capstone project'}</p>
      </div>

      <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />
        <CardContent className="p-6 md:p-8">
          {error && <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <Info className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>A unique research code (e.g. <strong className="text-emerald-700">TH-2026-0001</strong>) will be automatically assigned when submitted.</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Enter the research title" className="border-emerald-200 focus-visible:ring-emerald-500" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="authors">Authors *</Label>
                <Input id="authors" value={form.authors} onChange={e => setForm({...form, authors: e.target.value})} required placeholder="e.g. Juan Dela Cruz, Maria Santos" className="border-emerald-200 focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adviser">Adviser</Label>
                <Input id="adviser" value={form.adviser} onChange={e => setForm({...form, adviser: e.target.value})} placeholder="Research adviser" className="border-emerald-200 focus-visible:ring-emerald-500" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program_id ? String(form.program_id) : 'none'} onValueChange={v => setForm({...form, program_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="border-emerald-200 focus:ring-emerald-500"><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Program</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={String(form.year)} onValueChange={v => setForm({...form, year: parseInt(v)})}>
                  <SelectTrigger className="border-emerald-200 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Research Type *</Label>
                <Select value={form.research_type} onValueChange={v => setForm({...form, research_type: v})}>
                  <SelectTrigger className="border-emerald-200 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Research Paper">Research Paper</SelectItem>
                    <SelectItem value="Thesis">Thesis</SelectItem>
                    <SelectItem value="Capstone Project">Capstone Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id ? String(form.category_id) : 'none'} onValueChange={v => setForm({...form, category_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="border-emerald-200 focus:ring-emerald-500"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Category</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input id="keywords" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="Comma-separated keywords, e.g. machine learning, education" className="border-emerald-200 focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea id="abstract" rows={5} value={form.abstract} onChange={e => setForm({...form, abstract: e.target.value})} placeholder="Enter the research abstract..." className="border-emerald-200 focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Document File {isEdit && <span className="text-muted-foreground font-normal">(leave empty to keep current)</span>}</Label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
                <UploadCloud className="h-5 w-5 text-emerald-600 shrink-0" />
                <Input id="file" type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} className="border-0 focus-visible:ring-0 file:px-3 file:py-2 file:rounded-md file:bg-emerald-100 file:text-emerald-800 file:border-0 file:font-medium" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="gradient-btn min-w-40">{loading ? 'Submitting...' : isEdit ? 'Update Research' : 'Submit Research'}</Button>
              <Button type="button" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}