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

  return (
    <div className="h-screen flex font-['Milliki',_sans-serif] overflow-hidden">
      {/* Left Side - Infographics */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Modern Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 opacity-90"></div>
        
        {/* Animated Background Elements - Smoother and more subtle */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Technical Grid Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32 V.5 H32" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-16 text-white w-full h-full">
          {/* Logo/Icon Area */}
          <div className="mb-10 relative">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
            <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
              <svg className="w-14 h-14 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold mb-6 text-center leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
              Servicare Maintenance
            </span>
            <br />
            <span className="text-indigo-400">Automation Platform</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-14 text-center max-w-lg font-light leading-relaxed">
            The complete solution for intelligent asset management, work order automation, and predictive maintenance analytics.
          </p>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            {[
              { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", title: "Smart Work Orders" },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", title: "Asset Lifecycle" },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Predictive Analytics" },
              { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", title: "Offline Mobile App" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors duration-300">
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
                <span className="text-sm font-medium text-white/90">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Stats Footer */}
          <div className="mt-auto pt-12 flex items-center justify-between w-full max-w-lg border-t border-white/10">
            <div className="text-left">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-xs text-indigo-200 uppercase tracking-wide">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-xs text-indigo-200 uppercase tracking-wide">Active Users</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-xs text-indigo-200 uppercase tracking-wide">Countries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Servicare Platform</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 relative overflow-hidden">
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

            <div className="text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 mt-2 text-sm">Please enter your credentials to access the platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <a
                  href="/signup"
                  className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors"
                >
                  Register Company
                </a>
              </p>
            </div>
          </div>

          {/* Quick Login Credentials */}
          <div className="mt-8">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${showCredentials ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-700">Quick Login / Demo Accounts</div>
                  <div className="text-xs text-slate-500">Click to expand available roles</div>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                {SAMPLE_CREDENTIALS.length} Roles
              </span>
            </button>

            {showCredentials && (
              <div className="mt-4 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fadeIn">
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-4 custom-scrollbar">
                  {['System', 'Vendor', 'Client'].map((category) => (
                    <div key={category}>
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3 pt-2">
                        {category === 'System' ? 'System Level' : category === 'Vendor' ? 'Tech Services Ltd. (Vendor)' : 'ACME Corp. (Client)'}
                      </h4>
                      <div className="space-y-1">
                        {SAMPLE_CREDENTIALS.filter(c => c.category === category).map((cred, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickLogin(cred)}
                            className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 rounded-lg transition-colors group flex items-center gap-3"
                          >
                            <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                              category === 'System' ? 'bg-purple-400' : category === 'Vendor' ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-700">{cred.role}</span>
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 font-mono">Autofill</span>
                              </div>
                              <div className="text-xs text-slate-500 truncate">{cred.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Select a role to populate credentials, then sign in.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2024 Servicare Maintenance Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
