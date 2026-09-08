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
      <div>
        <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Manage Research</span></h1>
        <p className="text-muted-foreground">Approve, reject, edit, or remove research records</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="space-y-6">
        <TabsList className="bg-white border border-emerald-100 shadow-sm">
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white">Rejected</TabsTrigger>
        </TabsList>

        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50">
          <CardContent className="p-6">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search research..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()} className="pl-9 border-emerald-200 focus-visible:ring-emerald-500" />
              </div>
              <Button className="gradient-btn" onClick={fetchData}>Search</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                    <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Authors</TableHead><TableHead>Type</TableHead><TableHead>Year</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {research.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold text-emerald-700">{r.code}</TableCell>
                      <TableCell><Link to={`/research/${r.id}`} className="font-medium hover:text-emerald-700 hover:underline">{r.title}</Link></TableCell>
                      <TableCell className="text-muted-foreground">{r.authors}</TableCell>
                      <TableCell>{r.research_type}</TableCell>
                      <TableCell className="text-muted-foreground">{r.year}</TableCell>
                      <TableCell><Badge variant={r.status} className="capitalize">{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {r.status !== 'approved' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(r.id, 'approved')}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>}
                          {r.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'rejected')}><XCircle className="h-3.5 w-3.5" /></Button>}
                          {r.status !== 'pending' && <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => updateStatus(r.id, 'pending')}><RotateCcw className="h-3.5 w-3.5" /></Button>}
                          <Link to={`/edit-research/${r.id}`}><Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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