import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AssetsPage from './pages/AssetsPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// New Pages - Phase 8
import { CompanySignupPage } from './pages/CompanySignupPage';
import { InvitationAcceptPage } from './pages/InvitationAcceptPage';
import { SuperAdminDashboardPage } from './pages/SuperAdminDashboardPage';
import { CompanyManagementPage } from './pages/CompanyManagementPage';
import { PermissionManagementPage } from './pages/PermissionManagementPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { EmployeeInvitePage } from './pages/EmployeeInvitePage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';
import { LocationsPage } from './pages/LocationsPage';
import { ManufacturersPage } from './pages/ManufacturersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ServicesPage } from './pages/ServicesPage';
import { PriceBookPage } from './pages/PriceBookPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscriptionPlansPage } from './pages/SubscriptionPlansPage';
import { MySubscriptionPage } from './pages/MySubscriptionPage';
import AuditTrailPage from './pages/AuditTrailPage';

// Phase 1-3 Feature Pages
import { AssetDetailPage } from './pages/AssetDetailPage';
import { WorkOrderDetailPage } from './pages/WorkOrderDetailPage';
import { PreventiveMaintenancePage } from './pages/PreventiveMaintenancePage';
import { WorkOrderTemplatesPage } from './pages/WorkOrderTemplatesPage';
import { InventoryPage } from './pages/InventoryPage';
import { InventoryTransactionsPage } from './pages/InventoryTransactionsPage';
import { BillingPage } from './pages/BillingPage';
import { KpiDashboardPage } from './pages/KpiDashboardPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { WebhooksPage } from './pages/WebhooksPage';
import { PredictiveMaintenancePage } from './pages/PredictiveMaintenancePage';
import { IoTDashboardPage } from './pages/IoTDashboardPage';
import { AdvancedAnalyticsPage } from './pages/AdvancedAnalyticsPage';
import { ScannerPage } from './pages/ScannerPage';
import { SchedulingPage } from './pages/SchedulingPage';

// Onboarding Pages
import ClientsPage from './pages/ClientsPage';
import SitesPage from './pages/SitesPage';
import SLAManagementPage from './pages/SLAManagementPage';

// Teams Pages
import { TeamsPage } from './pages/TeamsPage';
import { TeamVisualizationPage } from './pages/TeamVisualizationPage';

// Finance Pages
import {
  FinanceDashboardPage,
  InvoicesPage,
  PurchaseOrdersPage,
  BudgetsPage,
  ExpensesPage,
  QuotesPage,
} from './pages/finance';

// Reports Pages
import { ReportsPage } from './pages/ReportsPage';
import { ReportBuilderPage } from './pages/ReportBuilderPage';
import {
  KpiDashboardPage as KpiDashboardReportPage,
  WorkOrderReportsPage,
  AssetPerformancePage,
  InventoryReportsPage,
  CostReportsPage,
} from './pages/reports';

// Super Admin Pages
import {
  RevenueDashboard,
  PlatformAnalytics,
  SystemConfiguration,
  EmailTemplates,
  ApiKeyManagement,
} from './pages/super-admin';

// Customer Portal Pages
import {
  PortalLoginPage,
  PortalDashboardPage,
  SubmitRequestPage,
  RequestDetailPage,
  RequestHistoryPage,
  NotificationsPage as PortalNotificationsPage,
} from './pages/portal';
import { PortalLayout } from './components/portal';
import { usePortalAuthStore } from './store/portalAuthStore';

function App() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { isAuthenticated: portalAuthenticated, _hasHydrated: portalHydrated } = usePortalAuthStore();

  // Wait for stores to rehydrate from localStorage before rendering
  if (!_hasHydrated || !portalHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<CompanySignupPage />} />
        <Route path="/invite/accept" element={<InvitationAcceptPage />} />

        {/* Customer Portal Routes - Separate from main app */}
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route
          path="/portal/*"
          element={
            portalAuthenticated ? (
              <PortalLayout />
            ) : (
              <Navigate to="/portal/login" />
            )
          }
        >
          <Route path="dashboard" element={<PortalDashboardPage />} />
          <Route path="submit-request" element={<SubmitRequestPage />} />
          <Route path="requests" element={<RequestHistoryPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="notifications" element={<PortalNotificationsPage />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/*"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          {/* Super Admin Dashboard */}
          <Route
            path="super-admin/dashboard"
            element={
              <ProtectedRoute superAdminOnly>
                <SuperAdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/revenue"
            element={
              <ProtectedRoute superAdminOnly>
                <RevenueDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/analytics"
            element={
              <ProtectedRoute superAdminOnly>
                <PlatformAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/configuration"
            element={
              <ProtectedRoute superAdminOnly>
                <SystemConfiguration />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/email-templates"
            element={
              <ProtectedRoute superAdminOnly>
                <EmailTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/api-keys"
            element={
              <ProtectedRoute superAdminOnly>
                <ApiKeyManagement />
              </ProtectedRoute>
            }
          />

          {/* Permission Management (Super Admin Only) */}
          <Route
            path="permissions"
            element={
              <ProtectedRoute requiredPermission="permissions:view">
                <PermissionManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Role Management */}
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPermission="roles:view">
                <RoleManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Invitation */}
          <Route
            path="users/invite"
            element={
              <ProtectedRoute requiredPermission="user_management:create">
                <EmployeeInvitePage />
              </ProtectedRoute>
            }
          />

          {/* Inventory Management */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <InventoryManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/services"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <ServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/locations"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <LocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/manufacturers"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <ManufacturersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/suppliers"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/categories"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/price-books"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <PriceBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/price-books/:organizationId"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <PriceBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/transactions"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <InventoryTransactionsPage />
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={<SettingsPage />}
          />
          <Route
            path="settings/profile"
            element={<ProfilePage />}
          />
          <Route
            path="settings/users-permissions"
            element={
              <ProtectedRoute requiredPermission="user_management:view">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/manufacturers"
            element={<ManufacturersPage />}
          />
          <Route
            path="settings/organizations"
            element={
              <ProtectedRoute requiredPermission="company_management:view">
                <CompanyManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/subscriptions"
            element={<SubscriptionPlansPage />}
          />
          <Route
            path="settings/my-subscription"
            element={<MySubscriptionPage />}
          />
          <Route
            path="settings/api"
            element={<SettingsPage />}
          />

          {/* Audit Trail */}
          <Route
            path="management/audit-trail"
            element={
              <ProtectedRoute requiredPermission="audit:view">
                <AuditTrailPage />
              </ProtectedRoute>
            }
          />

          {/* Existing Routes */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredPermission="user_management:view">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets"
            element={
              <ProtectedRoute requiredPermission="asset_management:view">
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assets/:id"
            element={
              <ProtectedRoute requiredPermission="asset_management:view">
                <AssetDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Scanner/QR Code Route */}
          <Route
            path="scanner"
            element={
              <ProtectedRoute requiredPermission="tools:view">
                <ScannerPage />
              </ProtectedRoute>
            }
          />

          {/* Scheduling Calendar */}
          <Route
            path="scheduling"
            element={
              <ProtectedRoute requiredPermission="scheduling:view">
                <SchedulingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="scheduling/calendar"
            element={
              <ProtectedRoute requiredPermission="scheduling:view">
                <SchedulingPage />
              </ProtectedRoute>
            }
          />

          {/* Onboarding Module */}
          <Route
            path="onboarding/clients"
            element={
              <ProtectedRoute requiredPermission="client_management:view">
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding/sites"
            element={
              <ProtectedRoute requiredPermission="client_management:view">
                <SitesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding/sla"
            element={
              <ProtectedRoute requiredPermission="sla:view">
                <SLAManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding/price-books"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <PriceBookPage />
              </ProtectedRoute>
            }
          />

          {/* Teams Module */}
          <Route
            path="teams"
            element={
              <ProtectedRoute requiredPermission="performance:view">
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams/visualization"
            element={
              <ProtectedRoute requiredPermission="performance:view">
                <TeamVisualizationPage />
              </ProtectedRoute>
            }
          />

          {/* Finance Module */}
          <Route
            path="finance"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <FinanceDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/invoices"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/purchase-orders"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <PurchaseOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/quotes"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <QuotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/expenses"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/budgets"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BudgetsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="work-orders"
            element={
              <ProtectedRoute requiredPermission="work_order_management:view">
                <WorkOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-orders/:id"
            element={
              <ProtectedRoute requiredPermission="work_order_management:view">
                <WorkOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="work-orders/templates"
            element={
              <ProtectedRoute requiredPermission="work_order_management:view">
                <WorkOrderTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />

          {/* Preventive Maintenance */}
          <Route
            path="preventive-maintenance"
            element={
              <ProtectedRoute requiredPermission="pm_schedules:view">
                <PreventiveMaintenancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="preventive-maintenance/templates"
            element={
              <ProtectedRoute requiredPermission="pm_schedules:view">
                <WorkOrderTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="preventive-maintenance/calendar"
            element={
              <ProtectedRoute requiredPermission="pm_schedules:view">
                <PreventiveMaintenancePage />
              </ProtectedRoute>
            }
          />

          {/* Inventory Management */}
          <Route
            path="inventory-parts"
            element={
              <ProtectedRoute requiredPermission="inventory:view">
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* Billing */}
          <Route
            path="billing"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/overview"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/invoices"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/payment-methods"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/usage"
            element={
              <ProtectedRoute requiredPermission="billing:view">
                <BillingPage />
              </ProtectedRoute>
            }
          />

          {/* Reports & Analytics */}
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredPermission="reporting:view">
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/builder"
            element={
              <ProtectedRoute requiredPermission="reporting:create">
                <ReportBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/kpi"
            element={
              <ProtectedRoute requiredPermission="reporting:view">
                <KpiDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/analytics"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <AdvancedAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics Dashboard Routes */}
          <Route
            path="analytics/kpi"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <KpiDashboardReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics/work-orders"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <WorkOrderReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics/assets"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <AssetPerformancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics/inventory"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <InventoryReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics/costs"
            element={
              <ProtectedRoute requiredPermission="analytics:view">
                <CostReportsPage />
              </ProtectedRoute>
            }
          />

          {/* API & Integrations */}
          <Route path="integrations/api-keys" element={<ApiKeysPage />} />
          <Route path="integrations/webhooks" element={<WebhooksPage />} />

          {/* Enterprise Features */}
          <Route path="predictive-maintenance" element={<PredictiveMaintenancePage />} />
          <Route path="iot-dashboard" element={<IoTDashboardPage />} />

          {/* Redirect based on user role */}
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
