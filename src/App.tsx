import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesRecordPage } from './pages/SalesRecordPage';
import { QuotationPage } from './pages/QuotationPage';
import { InventoryAuditPage } from './pages/InventoryAuditPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InstallmentSalesPage } from './pages/InstallmentSalesPage';
import { RMAPage } from './pages/RMAPage';
import { LoginPage } from './pages/LoginPage';
import { BackupModal } from './components/modals/BackupModal';
import { AccessRestricted } from './components/common/AccessRestricted';
import { StockItem, Order } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLE_DEFINITIONS } from './types/rbac';

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentUser, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Workflow bridge: Initiate RMA directly from Sales Ledger
  const [rmaPrefill, setRmaPrefill] = useState<{
    serial: string;
    item: StockItem;
    orderId: number;
    customer: string;
  } | null>(null);

  // When role changes or upon login, redirect to permitted home tab if current tab is restricted
  useEffect(() => {
    if (currentUser) {
      const meta = ROLE_DEFINITIONS[currentUser.role];
      if (meta && !meta.allowedTabs.includes(activeTab)) {
        setActiveTab(meta.homeTab);
      }
    }
  }, [currentUser?.role]);

  // When logged out, reset transient states so next login starts clean
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveTab('dashboard');
      setRmaPrefill(null);
      setIsBackupOpen(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleInitiateRMAFromSales = (serial: string, item: StockItem, order: Order) => {
    setRmaPrefill({
      serial,
      item,
      orderId: order.id,
      customer: order.customerName || 'Customer'
    });
    setActiveTab('rma');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b12] text-slate-100 font-sans relative selection:bg-teal-500/30 selection:text-teal-200">
      {/* Layer 0 Ambient Lighting Atmosphere (Soft, restrained background aura) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-left ambient teal glow */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-radial from-teal-900/20 via-teal-950/5 to-transparent rounded-full blur-3xl" />
        {/* Center-right subtle warm amber glow */}
        <div className="absolute top-1/3 -right-20 w-[550px] h-[450px] bg-radial from-amber-500/8 via-amber-900/3 to-transparent rounded-full blur-3xl" />
        {/* Bottom-left subtle cyan accent glow */}
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[450px] bg-radial from-teal-700/12 via-teal-950/4 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Sidebar Navigation (Layer 1 Glass) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBackupModal={() => setIsBackupOpen(true)}
      />

      {/* Main Content Area (Layer 1/2) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Top Navbar (Layer 1 Floating Glass) */}
        <Navbar onOpenBackupModal={() => setIsBackupOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">
            {!canAccess(activeTab) ? (
              <AccessRestricted
                attemptedTab={activeTab}
                onNavigateHome={() => setActiveTab(ROLE_DEFINITIONS[currentUser?.role || 'cashier'].homeTab)}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />
                )}
                {activeTab === 'pos' && <POSPage />}
                {activeTab === 'inventory' && <InventoryPage />}
                {activeTab === 'sales' && (
                  <SalesRecordPage onInitiateRMA={handleInitiateRMAFromSales} />
                )}
                {activeTab === 'quotation' && <QuotationPage />}
                {activeTab === 'audit' && <InventoryAuditPage />}
                {activeTab === 'customers' && <CustomersPage />}
                {activeTab === 'suppliers' && <SuppliersPage />}
                {activeTab === 'installments' && <InstallmentSalesPage />}
                {activeTab === 'rma' && (
                  <RMAPage
                    initialRMAData={rmaPrefill}
                    onClearInitialData={() => setRmaPrefill(null)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Database Backup Simulation Modal (Layer 4) */}
      {isBackupOpen && <BackupModal onClose={() => setIsBackupOpen(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
