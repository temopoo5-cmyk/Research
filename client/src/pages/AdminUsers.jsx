import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'user' });

  const fetchUsers = () => axios.get(`${API}/users/`).then(r => { if (Array.isArray(r.data)) setUsers(r.data); }).catch(() => {});
  useEffect(() => { fetchUsers(); }, []);

  const openNew = () => { setEditing(null); setForm({ username: '', password: '', full_name: '', role: 'user' }); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const data = { full_name: form.full_name, role: form.role };
        if (form.password) data.password = form.password;
        await axios.put(`${API}/users/${editing.id}`, data);
      } else {
        await axios.post(`${API}/users/`, form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`${API}/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Manage Users</span></h1>
          <p className="text-muted-foreground">Add, edit, or remove system users</p>
        </div>
        <Button className="gradient-btn" onClick={openNew}><UserPlus className="h-4 w-4" /> Add User</Button>
      </div>

      <Card className="border-[#4F6D7A]/20 shadow-xl shadow-[#4F6D7A]/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#4F6D7A]/50 hover:bg-[#4F6D7A]">
                  <TableHead>ID</TableHead><TableHead>Username</TableHead><TableHead>Full Name</TableHead><TableHead>Role</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="font-semibold">{u.username}</TableCell>
                    <TableCell>{u.full_name}</TableCell>
                    <TableCell><Badge variant={u.role === 'admin' ? 'approved' : 'secondary'}>{u.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="border-[#4F6D7A]/30 text-[#243010] hover:bg-[#4F6D7A]" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(u.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="border-[#4F6D7A]/20 bg-white">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editing ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>{editing ? 'Update user account details' : 'Create a new system user'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required className="border-[#4F6D7A]/30 ring-[#23CE6B]" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="border-[#4F6D7A]/30 ring-[#23CE6B]" />
            </div>
            <div className="space-y-2">
              <Label>{editing ? 'New Password (leave blank to keep)' : 'Password'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} className="border-[#4F6D7A]/30 ring-[#23CE6B]" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger className="border-[#4F6D7A]/30 ring-[#23CE6B]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="border-[#4F6D7A]/30 text-[#243010] hover:bg-[#4F6D7A]" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="gradient-btn">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}