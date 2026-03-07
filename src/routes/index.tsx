import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AdminProvider } from '../contexts/AdminContext';

// Layouts e Website
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HomePage } from '../modules/website/HomePage';

// Autenticação
import { Login } from '../modules/auth/Login';
import { AdminLogin } from '../modules/auth/AdminLogin';

// Admin - Componentes do Painel
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminClients from '../components/admin/AdminClients';
import AdminEvents from '../components/admin/AdminEvents';
import AdminGames from '../components/admin/AdminGames';
import AdminPayments from '../components/admin/AdminPayments';
import AdminLeads from '../components/admin/AdminLeads';
import AdminActivations from '../components/admin/AdminActivations';
import AdminCredits from '../components/admin/AdminCredits';
import AdminReports from '../components/admin/AdminReports';
import AdminSupport from '../components/admin/AdminSupport';
import AdminSettings from '../components/admin/AdminSettings';
import AdminAudit from '../components/admin/AdminAudit';
import AdminRisk from '../components/admin/AdminRisk';
import AdminRefunds from '../components/admin/AdminRefunds';

// Dashboard Cliente e Players
import { DashboardPage } from '../modules/dashboard/Dashboard';
import { LeadsPage } from '../modules/dashboard/LeadsPage';
import { CreditsPage } from '../modules/dashboard/CreditsPage';
import { SupportPage } from '../modules/dashboard/SupportPage';
import { MyEventsPage } from '../modules/dashboard/MyEventsPage';
import { MyGamesPage } from '../modules/dashboard/MyGamesPage';
import { NewEventPage } from '../modules/dashboard/NewEventPage';
import { CustomizePage } from '../modules/dashboard/CustomizePage';
import { AccountPage } from '../modules/dashboard/AccountPage';
import { DownloadsPage } from '../modules/dashboard/DownloadsPage';
import { HistoryPage } from '../modules/dashboard/HistoryPage';
import { QuizEditor } from '../modules/events/editors/QuizEditor';
import { RouletteEditor } from '../modules/events/editors/RouletteEditor';
import { MemoryEditor } from '../modules/events/editors/MemoryEditor';
import { BalloonEditor } from '../modules/events/editors/BalloonEditor';
import { QuizPlayer } from '../modules/player/QuizPlayer';
import { RoulettePlayer } from '../modules/player/RoulettePlayer';
import { MemoryPlayer } from '../modules/player/MemoryPlayer';
import { BalloonPlayer } from '../modules/player/BalloonPlayer';

const queryClient = new QueryClient();

// Interface para evitar o uso de 'any' na configuração do evento
interface EventConfig {
  type?: string;
}

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">Validando acesso...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.email === 'gamesparaeventos@gmail.com') return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
};

function EditorDispatcher() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as { type?: string } | null;
  const [type, setType] = useState<string | null>(state?.type || null);
  const [loading, setLoading] = useState(!state?.type);

  useEffect(() => {
    if (!type && id) {
      supabase.from('events').select('config').eq('id', id).single()
        .then(({ data }) => {
          const config = data?.config as EventConfig | null;
          setType(config?.type || 'quiz');
          setLoading(false);
        });
    }
  }, [id, type]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;
  if (type === 'roulette' || type === 'gift') return <RouletteEditor />;
  if (type === 'memory' || type === 'ghost') return <MemoryEditor />;
  if (type === 'balloon' || type === 'pop') return <BalloonEditor />;
  return <QuizEditor />;
}

function PlayerDispatcher() {
  const { id } = useParams();
  const [type, setType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      supabase.from('events').select('config').eq('id', id).single()
        .then(({ data }) => {
          const config = data?.config as EventConfig | null;
          setType(config?.type || 'quiz');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;
  if (type === 'roulette' || type === 'gift') return <RoulettePlayer />;
  if (type === 'memory' || type === 'ghost') return <MemoryPlayer />;
  if (type === 'balloon' || type === 'pop') return <BalloonPlayer />;
  return <QuizPlayer />;
}

export function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <BrowserRouter>
            <Routes>
              {/* --- ROTAS PÚBLICAS --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/play/:id" element={<PlayerDispatcher />} />

              {/* --- ROTAS ADMIN --- */}
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/clients" element={<AdminGuard><AdminClients /></AdminGuard>} />
              <Route path="/admin/events" element={<AdminGuard><AdminEvents /></AdminGuard>} />
              <Route path="/admin/games" element={<AdminGuard><AdminGames /></AdminGuard>} />
              <Route path="/admin/payments" element={<AdminGuard><AdminPayments /></AdminGuard>} />
              <Route path="/admin/refunds" element={<AdminGuard><AdminRefunds /></AdminGuard>} />
              <Route path="/admin/leads" element={<AdminGuard><AdminLeads /></AdminGuard>} />
              <Route path="/admin/activations" element={<AdminGuard><AdminActivations /></AdminGuard>} />
              <Route path="/admin/credits" element={<AdminGuard><AdminCredits /></AdminGuard>} />
              <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
              <Route path="/admin/support" element={<AdminGuard><AdminSupport /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
              <Route path="/admin/audit" element={<AdminGuard><AdminAudit /></AdminGuard>} />
              <Route path="/admin/risk" element={<AdminGuard><AdminRisk /></AdminGuard>} />

              {/* --- ÁREA DO CLIENTE --- */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events" element={<MyEventsPage />} />
                <Route path="/games" element={<MyGamesPage />} />
                <Route path="/events/new" element={<NewEventPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/customize" element={<CustomizePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/downloads" element={<DownloadsPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>

              <Route path="/event/:id/edit" element={<EditorDispatcher />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}