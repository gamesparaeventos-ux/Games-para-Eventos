import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';

import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './modules/auth/Login';
import { AdminLogin } from './modules/auth/AdminLogin';
import { HomePage } from './modules/website/HomePage';

import { DashboardPage } from './modules/dashboard/Dashboard';
import { MyEventsPage } from './modules/dashboard/MyEventsPage';
import { EventosPage } from './modules/dashboard/EventosPage';
import { LeadsPage } from './modules/dashboard/LeadsPage';
import { MyGamesPage } from './modules/dashboard/MyGamesPage';
import { CreditsPage } from './modules/dashboard/CreditsPage';
import { CustomizePage } from './modules/dashboard/CustomizePage';
import { DownloadsPage } from './modules/dashboard/DownloadsPage';
import { SupportPage } from './modules/dashboard/SupportPage';
import { AccountPage } from './modules/dashboard/AccountPage';
import { HistoryPage } from './modules/dashboard/HistoryPage';

import { AdminClientsPage } from './components/admin/AdminClientsPage';
import AdminLeads from './components/admin/AdminLeads';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
    <h1 className="text-5xl font-black text-slate-200">404</h1>
    <p className="text-slate-500 font-medium mt-2">Página não encontrada</p>
  </div>
);

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center text-xl font-bold">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center text-xl font-bold">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.email === 'gamesparaeventos@gmail.com') {
    return <>{children}</>;
  }

  return <Navigate to="/dashboard" replace />;
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin/leads"
                element={
                  <AdminGuard>
                    <AdminLeads />
                  </AdminGuard>
                }
              />

              <Route
                path="/admin/clients"
                element={
                  <AdminGuard>
                    <AdminClientsPage />
                  </AdminGuard>
                }
              />

              <Route
                path="/"
                element={
                  <AuthGuard>
                    <DashboardLayout />
                  </AuthGuard>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="events" element={<MyEventsPage />} />
                <Route path="events/new" element={<EventosPage />} />
                <Route path="games" element={<MyGamesPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="customize" element={<CustomizePage />} />
                <Route path="credits" element={<CreditsPage />} />
                <Route path="downloads" element={<DownloadsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}