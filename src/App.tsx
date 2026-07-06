import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { NotificationProvider } from './lib/notifications';
import { AuthPage } from './components/AuthPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './components/DashboardPage';
import { ReceptionPage } from './components/ReceptionPage';
import { TriagePage } from './components/TriagePage';
import { ConsultationPage } from './components/ConsultationPage';
import { LabPage } from './components/LabPage';
import { PharmacyPage } from './components/PharmacyPage';
import { QueueDisplayPage } from './components/QueueDisplayPage';
import { AdminPage } from './components/AdminPage';

function AppContent() {
  const { profile, loading, signIn } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loginLoading, setLoginLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!profile) {
    const handleLogin = async (email: string, password: string) => {
      setLoginLoading(true);
      const result = await signIn(email, password);
      setLoginLoading(false);
      return result;
    };

    return <AuthPage onLogin={handleLogin} loading={loginLoading} />;
  }

  // Queue display is a full-screen page
  if (currentPage === 'display') {
    return <QueueDisplayPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'reception':
        return <ReceptionPage />;
      case 'triage':
        return <TriagePage />;
      case 'consultation':
        return <ConsultationPage />;
      case 'lab':
        return <LabPage />;
      case 'pharmacy':
        return <PharmacyPage />;
      case 'users':
        return <AdminPage />;
      case 'settings':
        return <AdminPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
