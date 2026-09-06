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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBackupModal={() => setIsBackupOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenBackupModal={() => setIsBackupOpen(true)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
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

      {/* Database Backup Simulation Modal */}
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
