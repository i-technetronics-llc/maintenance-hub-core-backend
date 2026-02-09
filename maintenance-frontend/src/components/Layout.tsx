import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { companyApi, Company } from '../services/api';
import { Can } from './Can';
import { Logo } from './Logo';

interface SubMenuItem {
  path: string;
  label: string;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  subItems?: SubMenuItem[];
}

export default function Layout() {
  const { user, logout, isSuperAdmin } = useAuthStore();
  const {
    selectedOrganization,
    organizations,
    setSelectedOrganization,
    setOrganizations,
    setIsLoading: setOrgLoading,
    clearOrganization
  } = useOrganizationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearOrganization();
    logout();
    navigate('/login');
  };

  // Load organizations for super-admin
  useEffect(() => {
    const loadOrganizations = async () => {
      if (isSuperAdmin()) {
        try {
          setOrgLoading(true);
          const response = await companyApi.getAll({ status: 'active' });
          // Handle various response structures
          let orgs: Company[] = [];
          if (Array.isArray(response)) {
            orgs = response;
          } else if (response?.data && Array.isArray(response.data)) {
            orgs = response.data;
          } else if (response?.items && Array.isArray(response.items)) {
            orgs = response.items;
          }
          setOrganizations(orgs);
        } catch (error) {
          console.error('Failed to load organizations:', error);
          setOrganizations([]);
        } finally {
          setOrgLoading(false);
        }
      }
    };
    loadOrganizations();
  }, [isSuperAdmin, setOrganizations, setOrgLoading]);

  // Close profile menu and org dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle organization selection
  const handleOrganizationSelect = (org: Company | null) => {
    setSelectedOrganization(org);
    setOrgDropdownOpen(false);
    setOrgSearchTerm('');
  };

  // Filter organizations based on search
  const filteredOrganizations = (Array.isArray(organizations) ? organizations : []).filter(org =>
    org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  // Navigation items with permission requirements - Based on README Application Modules
  const navigationItems: NavigationItem[] = [
    // 1. Dashboard
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    // Scanner - QR/Barcode scanning
    {
      path: '/scanner',
      label: 'Scanner',
      permission: 'tools:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
    // 2. Asset Management Module
    {
      path: '/assets',
      label: 'Asset Management',
      permission: 'asset_management:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    // 3. Work Order Management Module
    {
      path: '/work-orders',
      label: 'Work Orders',
      permission: 'work_order_management:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      subItems: [
        { path: '/work-orders', label: 'All Work Orders' },
        { path: '/work-orders/templates', label: 'Templates' },
        { path: '/work-orders/checklists', label: 'Checklists' },
      ],
    },
    // 4. Preventive Maintenance Module
    {
      path: '/preventive-maintenance',
      label: 'PM Schedules',
      permission: 'pm_schedules:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      subItems: [
        { path: '/preventive-maintenance', label: 'Schedules' },
        { path: '/preventive-maintenance/calendar', label: 'Calendar View' },
        { path: '/preventive-maintenance/templates', label: 'PM Templates' },
      ],
    },
    // 5. Inventory & Stock Management Module
    {
      path: '/inventory',
      label: 'Inventory',
      permission: 'inventory:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      subItems: [
        { path: '/inventory', label: 'Stock Items' },
        { path: '/inventory/locations', label: 'Warehouses' },
        { path: '/inventory/transactions', label: 'Transactions' },
        { path: '/inventory/suppliers', label: 'Suppliers' },
        { path: '/inventory/manufacturers', label: 'Manufacturers' },
        { path: '/inventory/categories', label: 'Categories' },
        { path: '/inventory/price-books', label: 'Price Books' },
      ],
    },
    // 6. Onboarding Module
    {
      path: '/onboarding',
      label: 'Onboarding',
      permission: 'client_management:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      subItems: [
        { path: '/onboarding/clients', label: 'Client Mgt' },
        { path: '/onboarding/sites', label: 'Site Mgt' },
        { path: '/onboarding/sla', label: 'SLA Management' },
        { path: '/onboarding/price-books', label: 'Price Book' },
      ],
    },
    // 7. Analytics & Reporting Module
    {
      path: '/analytics',
      label: 'Reports & Analytics',
      permission: 'reporting:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      subItems: [
        { path: '/analytics/kpi', label: 'KPI Dashboard' },
        { path: '/analytics/work-orders', label: 'Work Order Reports' },
        { path: '/analytics/assets', label: 'Asset Performance' },
        { path: '/analytics/inventory', label: 'Inventory Reports' },
        { path: '/analytics/costs', label: 'Cost Reports' },
        { path: '/reports/builder', label: 'Custom Report Builder' },
      ],
    },
    // 8. Teams Module
    {
      path: '/teams',
      label: 'Teams',
      permission: 'performance:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      subItems: [
        { path: '/teams', label: 'All Teams' },
        { path: '/teams/visualization', label: 'Teams Visualization' },
      ],
    },
    // 9. Finance Module
    {
      path: '/finance',
      label: 'Finance',
      permission: 'billing:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      subItems: [
        { path: '/finance', label: 'Dashboard' },
        { path: '/finance/invoices', label: 'Invoices' },
        { path: '/finance/purchase-orders', label: 'Purchase Orders' },
        { path: '/finance/quotes', label: 'Quotes & Estimates' },
        { path: '/finance/expenses', label: 'Expenses' },
        { path: '/finance/budgets', label: 'Budgets' },
      ],
    },
    // 10. User & Access Management Module
    {
      path: '/user-management',
      label: 'User Management',
      permission: 'user_management:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      subItems: [
        { path: '/users', label: 'Users' },
        { path: '/roles', label: 'Roles' },
        { path: '/permissions', label: 'Permissions' },
      ],
    },
    // 9. Billing Module (Super Admin / Company Admin with billing permission)
    {
      path: '/billing',
      label: 'Billing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      permission: 'billing:view',
      subItems: [
        { path: '/billing/overview', label: 'Overview' },
        { path: '/billing/invoices', label: 'Invoices' },
        { path: '/billing/payment-methods', label: 'Payment Methods' },
        { path: '/billing/usage', label: 'Usage' },
      ],
    },
    // 10. Compliance & Audit Module
    {
      path: '/compliance',
      label: 'Compliance & Audit',
      permission: 'audit:view',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      subItems: [
        { path: '/compliance/audit-trail', label: 'Audit Trail' },
        { path: '/compliance/checklists', label: 'Compliance Checklists' },
        { path: '/compliance/sops', label: 'SOPs' },
      ],
    },
    // 10. Settings & Configuration Module
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      subItems: [
        { path: '/settings/profile', label: 'Profile' },
        { path: '/settings/organizations', label: 'Organizations' },
        { path: '/settings/notifications', label: 'Notifications' },
        isSuperAdmin()
          ? { path: '/settings/subscriptions', label: 'Subscriptions & Plans' }
          : { path: '/settings/my-subscription', label: 'My Subscription' },
        { path: '/settings/api', label: 'API & Integrations' },
      ],
    },
  ];

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  // Auto-expand menu if current path is in sub-items
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.subItems) {
        const isInSubMenu = item.subItems.some(
          sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')
        );
        if (isInSubMenu && !expandedMenus.includes(item.path)) {
          setExpandedMenus(prev => [...prev, item.path]);
        }
      }
    });
  }, [location.pathname]);

  const SidebarNavLink = ({ item }: { item: NavigationItem }) => {
    const isActive = location.pathname === item.path ||
      (item.subItems?.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')) ?? false);
    const isExpanded = expandedMenus.includes(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
      return (
        <div className="mb-1">
          <button
            onClick={() => toggleMenu(item.path)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition ${
              isActive
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <span className={sidebarOpen ? 'mr-3' : 'mx-auto'}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </div>
            {sidebarOpen && (
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {sidebarOpen && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.subItems?.map((subItem) => {
                const isSubActive = location.pathname === subItem.path;
                return (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`block pl-8 pr-4 py-2 text-sm rounded-lg transition ${
                      isSubActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition mb-1 ${
          isActive
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className={sidebarOpen ? 'mr-3' : 'mx-auto'}>{item.icon}</span>
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className={`p-4 border-b border-gray-200 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center flex-col space-y-2'}`}>
          <Logo collapsed={!sidebarOpen} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition ${!sidebarOpen && 'w-full flex justify-center'}`}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${!sidebarOpen && 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navigationItems.map((item) => {
            // If item has permission requirement, wrap in Can component
            if (item.permission) {
              return (
                <Can key={item.path} permission={item.permission}>
                  <SidebarNavLink item={item} />
                </Can>
              );
            }

            // Otherwise, show to everyone
            return <SidebarNavLink key={item.path} item={item} />;
          })}
        </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-gray-200 relative" ref={profileMenuRef}>
          {sidebarOpen ? (
            <div>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold mr-3 ring-2 ring-blue-200">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.role?.name}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <Can permission="user_management:view">
                    <Link
                      to="/users"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Team Members
                    </Link>
                  </Can>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/help"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & Support
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-blue-200 hover:ring-blue-300 transition">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </button>

              {/* Dropdown Menu for Collapsed Sidebar */}
              {profileMenuOpen && (
                <div className="absolute bottom-0 left-full ml-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <Can permission="user_management:view">
                    <Link
                      to="/users"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Team Members
                    </Link>
                  </Can>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/help"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & Support
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {/* Organization Selector for Super Admin */}
              {isSuperAdmin() && (
                <div className="relative" ref={orgDropdownRef}>
                  <button
                    onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 min-w-[200px]"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                      {selectedOrganization ? selectedOrganization.name : 'All Organizations'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Organization Dropdown */}
                  {orgDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search organizations..."
                            value={orgSearchTerm}
                            onChange={(e) => setOrgSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* All Organizations Option */}
                      <div className="max-h-64 overflow-y-auto">
                        <button
                          onClick={() => handleOrganizationSelect(null)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                            !selectedOrganization ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">All Organizations</p>
                            <p className="text-xs text-gray-500">View data from all organizations</p>
                          </div>
                          {!selectedOrganization && (
                            <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        {/* Organization List */}
                        {filteredOrganizations.length > 0 ? (
                          filteredOrganizations.map((org) => (
                            <button
                              key={org.id}
                              onClick={() => handleOrganizationSelect(org)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                                selectedOrganization?.id === org.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {org.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                                <p className="text-xs text-gray-500 truncate">{org.type}</p>
                              </div>
                              {selectedOrganization?.id === org.id && (
                                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-gray-500">
                            No organizations found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
