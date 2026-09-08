import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { GraduationCap, BookOpen, Search, FolderOpen } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <Navbar />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)] relative">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 max-w-5xl w-full items-center">
        <div className="hidden md:block">
          <div className="inline-flex h-14 w-14 rounded-2xl gradient-btn items-center justify-center mb-5 shadow-lg shadow-emerald-200">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-3">
            <span className="gradient-text">ResearchHub</span>
          </h1>
          <p className="text-emerald-900/70 text-lg mb-8 max-w-md">
            Centralized repository for research papers, theses, and capstone projects.
          </p>
          <div className="space-y-4">
            {[['BookOpen', 'Research Repository', 'Organize papers, theses & capstones'], ['FolderOpen', 'Unique Cataloging', 'Auto-assigned codes for every work'], ['Search', 'Smart Search', 'Filter by program, year, category, keywords']].map(([icon, title, desc]) => {
              const Icon = icon === 'BookOpen' ? BookOpen : icon === 'FolderOpen' ? FolderOpen : Search;
              return (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white/70 backdrop-blur border border-white/60 shadow-sm">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><Icon className="h-4 w-4" /></div>
                  <div><p className="font-semibold text-sm text-emerald-900">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <Card className="w-full max-w-md mx-auto shadow-xl shadow-emerald-200/40 border-emerald-100 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 md:hidden mb-2">
              <div className="h-9 w-9 rounded-xl gradient-btn flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
              <span className="font-bold text-lg gradient-text">ResearchHub</span>
            </div>
            <CardTitle className="text-2xl gradient-text">Welcome back</CardTitle>
            <CardDescription>Sign in to access the research repository</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter your username" className="border-emerald-200 focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" className="border-emerald-200 focus-visible:ring-emerald-500" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-btn">{loading ? 'Signing in...' : 'Sign In'}</Button>
            </form>
            <div className="mt-5 text-center text-sm text-muted-foreground">
              Don't have an account? <a href="/register" className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">Register</a>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground bg-emerald-50/50 rounded-lg py-2 border border-emerald-100">
              Demo admin: <strong className="text-emerald-700">admin</strong> / <strong className="text-emerald-700">admin123</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}