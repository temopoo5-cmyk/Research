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
import AdminCategories from './pages/AdminCategories';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { GraduationCap, Menu } from 'lucide-react';

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center">
      <div className="text-lg font-semibold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">Loading...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <Navbar />
      {children}
    </div>
  );
}

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-white/90 backdrop-blur-md border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">ResearchHub</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50">
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
      <Route path="/admin/categories" element={<AdminRoute><AdminLayout><AdminCategories /></AdminLayout></AdminRoute>} />
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