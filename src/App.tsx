import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login/Login';
import { Layout } from './components/Layout/Layout';
import { AutoLogout } from './components/AutoLogout/AutoLogout';

// Lazy loading larger pages
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage'));
const OrdensPage = lazy(() => import('./pages/Ordens/OrdensPage'));
const AgendaPage = lazy(() => import('./pages/Agenda/AgendaPage'));
const EstoquePage = lazy(() => import('./pages/Estoque/EstoquePage'));
const RelatoriosPage = lazy(() => import('./pages/Relatorios/RelatoriosPage'));
const ConfiguracoesPage = lazy(() => import('./pages/Configuracoes/ConfiguracoesPage'));
const PreventivaPage = lazy(() => import('./pages/Preventiva/PreventivaPage'));
const FaturamentoPage = lazy(() => import('./pages/Faturamento/FaturamentoPage'));
const ContratosPage = lazy(() => import('./pages/Contratos/ContratosPage'));
const OrcamentosPage = lazy(() => import('./pages/Orcamentos/OrcamentosPage'));
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage'));
const FornecedoresPage = lazy(() => import('./pages/Fornecedores/FornecedoresPage'));
const ConhecimentoPage = lazy(() => import('./pages/Conhecimento/ConhecimentoPage'));
const QualidadePage = lazy(() => import('./pages/Qualidade/QualidadePage'));
const IntegracaoPage = lazy(() => import('./pages/Integracao/IntegracaoPage'));
const FidelidadePage = lazy(() => import('./pages/Fidelidade/FidelidadePage'));
const ConformidadePage = lazy(() => import('./pages/Conformidade/ConformidadePage'));
const EducacaoPage = lazy(() => import('./pages/Educacao/EducacaoPage'));
const SustentabilidadePage = lazy(() => import('./pages/Sustentabilidade/SustentabilidadePage'));
const MarketplacePage = lazy(() => import('./pages/Marketplace/MarketplacePage'));
const PerformancePage = lazy(() => import('./pages/Performance/PerformancePage'));
const ClienteDashboard = lazy(() => import('./pages/ClientePortal/ClienteDashboard'));
const AgendamentoOnline = lazy(() => import('./pages/ClientePortal/AgendamentoOnline'));
import './index.css';

// Componente para proteger rotas que requerem autenticação
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 50%, #e4eaf2 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente para redirecionar usuários já autenticados
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8eef5 0%, #f0f4f8 50%, #e4eaf2 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}



function AppRoutes() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>
        Carregando módulos...
      </div>
    }>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Rotas protegidas com layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="ordens" element={<OrdensPage />} />
          <Route path="orcamentos" element={<OrcamentosPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="estoque" element={<EstoquePage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="fornecedores" element={<FornecedoresPage />} />

          {/* Novos Módulos SaaS */}
          <Route path="contratos" element={<ContratosPage />} />
          <Route path="preventiva" element={<PreventivaPage />} />
          <Route path="faturamento" element={<FaturamentoPage />} />
          <Route path="conhecimento" element={<ConhecimentoPage />} />
          <Route path="qualidade" element={<QualidadePage />} />
          <Route path="integracao" element={<IntegracaoPage />} />
          <Route path="fidelidade" element={<FidelidadePage />} />
          <Route path="conformidade" element={<ConformidadePage />} />
          <Route path="educacao" element={<EducacaoPage />} />
          <Route path="sustentabilidade" element={<SustentabilidadePage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="performance" element={<PerformancePage />} />

          {/* Portal do Cliente */}
          <Route path="portal" element={<ClienteDashboard />} />
          <Route path="portal/agendar" element={<AgendamentoOnline />} />

          {/* Rota Admin */}
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {/* Rota Pública de Rastreamento */}
        <Route path="/track/:publicId" element={<TrackingPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  console.log('App: Rendering started');
  return (
    <BrowserRouter>
      <AuthProvider>
        <AutoLogout />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
