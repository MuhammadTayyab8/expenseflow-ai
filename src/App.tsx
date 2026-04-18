import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import ExpensesList from './components/ExpensesList';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import { Shield, LayoutDashboard, LogOut, Settings, Wallet, BarChart3, Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppView = 'dashboard' | 'admin' | 'expenses' | 'analytics' | 'settings';

function AppContent() {
  const { user, loading, isAdmin, logout } = useAuth();
  const [view, setView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,95,0.4)]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const navigate = (v: AppView) => {
    setView(v);
    setIsSidebarOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'admin': return <AdminPanel onBack={() => setView('dashboard')} />;
      case 'expenses': return <ExpensesList />;
      case 'analytics': return <AnalyticsView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-accent selection:text-black overflow-hidden relative">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-[60] flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-accent rounded-lg shadow-[0_0_15px_rgba(0,255,95,0.3)] flex items-center justify-center">
            <Zap size={18} className="text-black fill-current" />
          </div>
          ExpenseFlow
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-foreground/60 hover:text-accent transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={`
        fixed inset-0 z-[70] bg-background/95 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 md:bg-transparent md:backdrop-blur-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:flex md:w-64 sidebar
      `}>
        <div className="flex flex-col h-full space-y-8 w-full">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="w-10 h-10 bg-accent rounded-xl shadow-[0_0_20px_rgba(0,255,95,0.3)] flex items-center justify-center">
              <Zap size={24} className="text-black fill-current" />
            </div>
            ExpenseFlow
          </div>

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => navigate(item.id as AppView)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
                  ${view === item.id ? 'nav-item-active' : 'text-foreground/40 hover:bg-secondary hover:text-foreground/60'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            
            <div className="mt-auto pt-4 border-t border-border">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
              >
                <LogOut size={18} />
                 Log Out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 h-screen overflow-y-auto bg-background custom-scrollbar pt-16 md:pt-0 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass border-t border-border flex items-center justify-around px-4 z-50">
          {navItems.slice(0, 4).map((item) => (
            <button 
              key={item.id}
              onClick={() => navigate(item.id as AppView)}
              className={`flex flex-col items-center gap-1 transition-colors ${view === item.id ? 'text-accent' : 'text-foreground/40'}`}
            >
              <item.icon size={20} />
              <span className="text-[8px] uppercase font-bold tracking-widest truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button 
            onClick={() => navigate('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'settings' ? 'text-accent' : 'text-foreground/40'}`}
          >
            <Settings size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">Prefs</span>
          </button>
        </nav>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-[65] backdrop-blur-sm"
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
