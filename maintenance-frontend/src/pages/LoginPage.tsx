import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

// All user credentials matching seed data based on README USER ROLES & PERMISSION MATRIX
const SAMPLE_CREDENTIALS = [
  // System Level
  { email: 'superadmin@system.local', password: 'Admin@12345', role: 'Super Administrator', category: 'System', description: 'Full platform access' },
  // Vendor Company - Tech Services Ltd.
  { email: 'admin@techservices.com', password: 'Password123!', role: 'Company Admin', category: 'Vendor', description: 'Company-level full access' },
  { email: 'maint.manager@techservices.com', password: 'Password123!', role: 'Maintenance Manager', category: 'Vendor', description: 'Full maintenance operations' },
  { email: 'supervisor@techservices.com', password: 'Password123!', role: 'Maintenance Supervisor', category: 'Vendor', description: 'Team supervision & approval' },
  { email: 'planner@techservices.com', password: 'Password123!', role: 'Planner/Scheduler', category: 'Vendor', description: 'Work planning & scheduling' },
  { email: 'technician@techservices.com', password: 'Password123!', role: 'Technician', category: 'Vendor', description: 'Field execution & updates' },
  { email: 'storekeeper@techservices.com', password: 'Password123!', role: 'Storekeeper', category: 'Vendor', description: 'Inventory management' },
  { email: 'reliability@techservices.com', password: 'Password123!', role: 'Reliability Engineer', category: 'Vendor', description: 'Predictive maintenance' },
  { email: 'finance@techservices.com', password: 'Password123!', role: 'Finance/Controller', category: 'Vendor', description: 'Financial oversight' },
  // Client Company - ACME Corporation
  { email: 'viewer@acmecorp.com', password: 'Password123!', role: 'Viewer', category: 'Client', description: 'Read-only access' },
  { email: 'requester@acmecorp.com', password: 'Password123!', role: 'Requester', category: 'Client', description: 'Submit work requests' },
  { email: 'manager@acmecorp.com', password: 'Password123!', role: 'Manager', category: 'Client', description: 'General management' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (credentials: { email: string; password: string }) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'System': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Vendor': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Client': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex font-['Milliki',_sans-serif]">
      {/* Left Side - Infographics */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-center font-['Milliki',_sans-serif]">
            Maintenance Automation
          </h1>
          <p className="text-xl text-white/80 mb-12 text-center max-w-md font-['Milliki',_sans-serif]">
            Streamline your maintenance operations with our comprehensive CMMS platform
          </p>

          {/* Feature List */}
          <div className="space-y-6 w-full max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Work Order Management</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Track, assign, and complete maintenance tasks efficiently</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Asset Management</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Monitor equipment lifecycle and maintain asset health</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Analytics & Reporting</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Get insights with real-time dashboards and KPI tracking</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Mobile Access</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Work offline and sync when connected with our PWA</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold font-['Milliki',_sans-serif]">99.9%</div>
              <div className="text-sm text-white/70 font-['Milliki',_sans-serif]">Uptime</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold font-['Milliki',_sans-serif]">10K+</div>
              <div className="text-sm text-white/70 font-['Milliki',_sans-serif]">Users</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold font-['Milliki',_sans-serif]">50+</div>
              <div className="text-sm text-white/70 font-['Milliki',_sans-serif]">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-['Milliki',_sans-serif]">Maintenance Platform</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 font-['Milliki',_sans-serif]">Welcome Back</h2>
              <p className="text-gray-600 mt-2 font-['Milliki',_sans-serif]">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-['Milliki',_sans-serif]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-['Milliki',_sans-serif]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-['Milliki',_sans-serif]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-['Milliki',_sans-serif]"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-['Milliki',_sans-serif]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-['Milliki',_sans-serif]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-['Milliki',_sans-serif]">
                Don't have an account?{' '}
                <a
                  href="/signup"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline font-['Milliki',_sans-serif]"
                >
                  Register your company
                </a>
              </p>
            </div>
          </div>

          {/* Quick Login Credentials */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 text-indigo-600 transition-transform ${showCredentials ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 font-['Milliki',_sans-serif]">Quick Login - Test Accounts</span>
              </div>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-semibold font-['Milliki',_sans-serif]">
                {SAMPLE_CREDENTIALS.length} roles
              </span>
            </button>

            {showCredentials && (
              <div className="px-4 pb-4 border-t border-gray-100 max-h-[400px] overflow-y-auto">
                {/* Group by category */}
                {['System', 'Vendor', 'Client'].map((category) => (
                  <div key={category} className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 font-['Milliki',_sans-serif]">
                      {category === 'System' ? 'System Level' : category === 'Vendor' ? 'Vendor Company (Tech Services Ltd.)' : 'Client Company (ACME Corporation)'}
                    </h4>
                    <div className="space-y-2">
                      {SAMPLE_CREDENTIALS.filter(c => c.category === category).map((cred, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickLogin(cred)}
                          className="w-full text-left px-3 py-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition border border-gray-200 hover:border-indigo-300 group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 truncate font-['Milliki',_sans-serif]">{cred.role}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-['Milliki',_sans-serif] ${getCategoryColor(cred.category)}`}>
                                  {cred.category}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-1 font-['Milliki',_sans-serif]">{cred.email}</div>
                              <div className="text-xs text-gray-400 mt-0.5 font-['Milliki',_sans-serif]">{cred.description}</div>
                            </div>
                            <div className="text-xs font-mono text-gray-400 group-hover:text-indigo-600 transition ml-2 flex-shrink-0 font-['Milliki',_sans-serif]">
                              Click to fill
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-4 text-center font-['Milliki',_sans-serif]">
                  Click any account to auto-fill, then click "Sign In"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
