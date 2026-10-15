import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Building2, Award, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';

export default function AdminAuthorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', email: '', affiliation: '', orcid: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      axios.get(`${API}/authors/${id}`).then(r => {
        setForm({ name: r.data.name, email: r.data.email || '', affiliation: r.data.affiliation || '', orcid: r.data.orcid || '' });
      }).catch(() => navigate('/admin/authors'));
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await axios.patch(`${API}/authors/${id}`, form);
      } else {
        await axios.post(`${API}/authors/`, form);
      }
      navigate('/admin/authors');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save author');
      setLoading(false);
    }
  };

  return (
    <div className="admin-page max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/authors"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
        <div>
          <h1 className="admin-title">{isEdit ? 'Edit Author' : 'New Author'}</h1>
          <p className="admin-subtitle">{isEdit ? 'Update author information' : 'Add a new author to the catalog'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Author Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Juan Dela Cruz" className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan@university.edu" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="affiliation">Affiliation</Label>
                <Input id="affiliation" value={form.affiliation} onChange={e => setForm({...form, affiliation: e.target.value})} placeholder="University/Institution" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="orcid">ORCID</Label>
                <Input id="orcid" value={form.orcid} onChange={e => setForm({...form, orcid: e.target.value})} placeholder="0000-0000-0000-0000" className="mt-1.5" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E6EDE9]">
              <Link to="/admin/authors"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={loading} className="gradient-btn">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? 'Update' : 'Create')} Author
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}