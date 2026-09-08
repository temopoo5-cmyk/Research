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
import { Tags, Pencil, Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');

  const fetchData = () => axios.get(`${API}/categories/`).then(r => { if (Array.isArray(r.data)) setCategories(r.data); }).catch(() => {});
  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setName(''); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setName(c.name); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await axios.put(`${API}/categories/${editing.id}`, { name }); }
      else { await axios.post(`${API}/categories/`, { name }); }
      setShowModal(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await axios.delete(`${API}/categories/${id}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Manage Categories</span></h1>
          <p className="text-muted-foreground">Research categories for classification</p>
        </div>
        <Button className="gradient-btn" onClick={openNew}><Tags className="h-4 w-4" /> Add Category</Button>
      </div>

      <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                  <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
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
        <DialogContent className="border-emerald-100 bg-white">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>{editing ? 'Update category details' : 'Create a new research category'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="border-emerald-200 focus-visible:ring-emerald-500" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="gradient-btn">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}