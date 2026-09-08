import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BookOpen, CheckCircle2, Clock, XCircle, Users, FolderTree, ArrowRight, FileText, Award } from 'lucide-react';

const StatusIcon = ({ status }) => {
  const map = { approved: CheckCircle2, pending: Clock, rejected: XCircle };
  const Icon = map[status] || Clock;
  return <Icon className="h-5 w-5" />;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    axios.get(`${API}/stats/`).then(r => { if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) setStats(r.data); }).catch(() => {});
    axios.get(`${API}/research/?limit=5`).then(r => { if (Array.isArray(r.data?.data)) setRecent(r.data.data); }).catch(() => {});
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="text-lg font-semibold gradient-text">Loading...</div></div>;

  const statCards = [
    { label: 'Total Research', value: stats.total, icon: BookOpen, color: 'bg-emerald-500 text-white' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-700' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-red-100 text-red-700' },
    { label: 'Users', value: stats.users, icon: Users, color: 'bg-teal-100 text-teal-700' },
    { label: 'Programs', value: stats.programs, icon: FolderTree, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Dashboard</span></h1>
        <p className="text-muted-foreground">Overview of the research repository</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="border-emerald-100 transition-all hover:shadow-lg hover:shadow-emerald-100/60 hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" /> Recent Submissions</CardTitle>
            <Link to="/research">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">View All <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map(r => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-emerald-50/50" onClick={() => window.location.href = `/research/${r.id}`}>
                        <TableCell className="font-semibold text-emerald-700">{r.code}</TableCell>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell>{r.research_type}</TableCell>
                        <TableCell>
                          <Badge variant={r.status} className="gap-1"><StatusIcon status={r.status} />{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-emerald-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-emerald-600" /> By Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stats.byType.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {stats.byType.map(t => (
                  <div key={t.research_type} className="flex items-center justify-between py-2 border-b border-emerald-50 last:border-0">
                    <span className="text-sm text-foreground">{t.research_type}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{t.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-emerald-600" /> By Year</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stats.byYear.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {stats.byYear.slice(0, 5).map(y => (
                  <div key={y.year} className="flex items-center justify-between py-2 border-b border-emerald-50 last:border-0">
                    <span className="text-sm text-foreground">{y.year}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{y.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}