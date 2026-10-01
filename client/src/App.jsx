import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import About from './pages/About';
import Legal from './pages/Legal';
import Dashboard from './pages/Dashboard';
import ResearchList from './pages/ResearchList';
import ResearchDetail from './pages/ResearchDetail';
import SubmitResearch from './pages/SubmitResearch';
import AdminUsers from './pages/AdminUsers';
import AdminResearch from './pages/AdminResearch';
import AdminPrograms from './pages/AdminPrograms';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { GraduationCap, Menu } from 'lucide-react';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#093227]">
      <div className="text-lg font-semibold text-[#BFE0D3]">Loading...</div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { token, isAdmin, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return token && isAdmin ? children : <Navigate to="/" />;
}

function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#E6EDE9] bg-white/90 px-4 backdrop-blur-md md:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className="-ml-2 rounded-lg p-2 text-muted-green transition hover:bg-soft-green hover:text-forest">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-brand">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-[17px] font-semibold leading-none text-forest">ResearchHub</span>
          </div>
          <span className="ml-auto rounded-full bg-soft-green px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#176653]">Admin</span>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><Legal doc="privacy" /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><Legal doc="terms" /></PublicLayout>} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<PrivateRoute><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
      <Route path="/research" element={<PublicLayout><ResearchList /></PublicLayout>} />
      <Route path="/research/:id" element={<PublicLayout><ResearchDetail /></PublicLayout>} />
      <Route path="/submit" element={<AdminRoute><AdminLayout><SubmitResearch /></AdminLayout></AdminRoute>} />
      <Route path="/edit-research/:id" element={<AdminRoute><AdminLayout><SubmitResearch /></AdminLayout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
      <Route path="/admin/research" element={<AdminRoute><AdminLayout><AdminResearch /></AdminLayout></AdminRoute>} />
      <Route path="/admin/programs" element={<AdminRoute><AdminLayout><AdminPrograms /></AdminLayout></AdminRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}