import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { FolderTree, Pencil, Trash2 } from 'lucide-react';

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchData = () => axios.get(`${API}/programs/`).then(r => { if (Array.isArray(r.data)) setPrograms(r.data); }).catch(() => {});
  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', code: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, code: p.code }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await axios.put(`${API}/programs/${editing.id}`, form); }
      else { await axios.post(`${API}/programs/`, form); }
      setShowModal(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this program?')) return;
    await axios.delete(`${API}/programs/${id}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Academics</p>
          <h1 className="headline text-4xl">Manage <span className="gradient-text italic">Programs</span></h1>
          <p className="text-muted-foreground mt-1">Academic programs available for research records</p>
        </div>
        <Button className="gradient-btn rounded-full" onClick={openNew}><FolderTree className="h-4 w-4" /> Add Program</Button>
      </div>

      <Card className="quirk-c overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#23CE6B]/15 hover:bg-[#23CE6B]/20">
                  <TableHead>ID</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground font-mono">{p.id}</TableCell>
                    <TableCell><span className="code-tag sticker-mint bg-[#23CE6B]/20 text-[#12854A]">{p.code}</span></TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing ? 'Edit Program' : 'Add Program'}</DialogTitle>
            <DialogDescription>{editing ? 'Update program details' : 'Create a new academic program'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Program Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Program Code</Label>
              <Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="e.g. CS" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="gradient-btn rounded-full">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}