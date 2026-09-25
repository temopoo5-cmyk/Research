import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Tabs, TabsList, TabsTrigger,
} from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, CheckCircle2, XCircle, RotateCcw, Pencil, Trash2 } from 'lucide-react';

export default function AdminResearch() {
  const [research, setResearch] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = () => {
    const params = {};
    if (filter !== 'all') params.status = filter;
    if (search) params.search = search;
    axios.get(`${API}/research/all`, { params }).then(r => { if (Array.isArray(r.data)) setResearch(r.data); }).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [filter]);

  const updateStatus = (id, status) => {
    axios.patch(`${API}/research/${id}/status`, { status }).then(() => fetchData());
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this research?')) return;
    await axios.delete(`${API}/research/${id}`);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Catalog</p>
          <h1 className="headline text-4xl">Manage <span className="gradient-text italic">Research</span></h1>
          <p className="text-muted-foreground mt-1">Approve, reject, edit, or remove research records</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
        <TabsList className="rounded-full bg-white/70 border border-border shadow-sm">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-[#23CE6B] data-[state=active]:text-[#062514]">All</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full data-[state=active]:bg-[#23CE6B] data-[state=active]:text-[#062514]">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="rounded-full data-[state=active]:bg-[#23CE6B] data-[state=active]:text-[#062514]">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-full data-[state=active]:bg-[#23CE6B] data-[state=active]:text-[#062514]">Rejected</TabsTrigger>
        </TabsList>

        <Card className="quirk-c">
          <CardContent className="p-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search research..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()} className="pl-9" />
              </div>
              <Button className="gradient-btn rounded-full" onClick={fetchData}>Search</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#23CE6B]/15 hover:bg-[#23CE6B]/20">
                    <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Authors</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {research.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold text-[#12854A] text-xs">{r.code}</TableCell>
                       <TableCell><Link to={`/research/${r.id}`} className="font-medium hover:text-[#12854A] hover:underline">{r.title}</Link></TableCell>
                      <TableCell className="text-muted-foreground">{r.authors}</TableCell>
                      <TableCell className="text-muted-foreground font-mono">{r.year}</TableCell>
                      <TableCell><Badge variant={r.status} className="capitalize">{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {r.status !== 'approved' && <Button size="sm" className="gradient-btn rounded-full" onClick={() => updateStatus(r.id, 'approved')}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>}
                          {r.status !== 'rejected' && <Button size="sm" variant="destructive" className="rounded-full" onClick={() => updateStatus(r.id, 'rejected')}><XCircle className="h-3.5 w-3.5" /></Button>}
                          {r.status !== 'pending' && <Button size="sm" variant="outline" className="rounded-full border-amber-300/60 text-amber-600 hover:bg-amber-500/10" onClick={() => updateStatus(r.id, 'pending')}><RotateCcw className="h-3.5 w-3.5" /></Button>}
                          <Link to={`/edit-research/${r.id}`}><Button size="sm" variant="outline" className="rounded-full"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                          <Button size="sm" variant="ghost" className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {research.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No research found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}