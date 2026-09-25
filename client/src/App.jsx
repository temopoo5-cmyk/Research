import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
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
    <div className="min-h-screen bg-[#0A2B1C] flex items-center justify-center">
      <div className="text-lg font-semibold font-mono text-[#23CE6B]">Loading...</div>
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

function PageBackdrop() {
  return (
    <div className="page-backdrop" aria-hidden="true">
      <div className="backdrop-blob backdrop-blob-1" />
      <div className="backdrop-blob backdrop-blob-2" />
      <div className="backdrop-blob backdrop-blob-3" />
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PageBackdrop />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <PageBackdrop />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-gradient-to-r from-[#0A2B1C] to-[#0F3A26] border-b border-[#23CE6B]/25">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-2xl gradient-btn-invert flex items-center justify-center shrink-0 tilt-r-sm">
            <GraduationCap className="h-4 w-4 text-[#062514]" />
          </div>
          <span className="font-display font-semibold text-white">Research<span className="text-[#23CE6B]">Hub</span></span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="rounded-full p-2 text-[#EAFBF1] hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="pt-14 md:pt-8 p-4 md:pl-64 md:p-8">
        <div className="md:ml-8">{children}</div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
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