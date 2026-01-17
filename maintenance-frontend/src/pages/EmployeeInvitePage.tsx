import { useState, useEffect } from 'react';
import { userApi, roleApi, permissionApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  department: string;
  phone: string;
  permissions: string[];
}

interface PendingInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  invitedAt: string;
  invitationAccepted: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
}

const DEPARTMENTS = [
  'Engineering',
  'Operations',
  'Maintenance',
  'IT',
  'Administration',
  'Human Resources',
  'Finance',
  'Sales',
  'Customer Support',
  'Quality Assurance',
  'Other',
];

export const EmployeeInvitePage = () => {
  const { user, isSuperAdmin } = useAuthStore();
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    department: '',
    phone: '',
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailValidation, setEmailValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    if (user?.company?.id) {
      fetchPendingInvitations();
    }
  }, [user]);

  useEffect(() => {
    if (formData.email) {
      validateEmail(formData.email);
    } else {
      setEmailValidation(null);
    }
  }, [formData.email]);

  const fetchRoles = async () => {
    try {
      const response = await roleApi.getAll();
      setRoles(Array.isArray(response) ? response : []);
      if (response.length > 0 && !formData.roleId) {
        const defaultRole = response.find((r: Role) => r.name === 'EMPLOYEE') || response[response.length - 1];
        setFormData(prev => ({ ...prev, roleId: defaultRole.id }));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([
        { id: '2', name: 'COMPANY_ADMIN' },
        { id: '3', name: 'MANAGER' },
        { id: '4', name: 'EMPLOYEE' },
      ]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await permissionApi.getAll();
      setPermissions(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user?.company?.id) return;

    try {
      const response = await userApi.getPendingInvitations(user.company.id);
      setPendingInvitations(response.data || []);
    } catch (err: any) {
      console.error('Failed to load pending invitations:', err);
    }
  };

  const validateEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailValidation({
        valid: false,
        message: 'Invalid email format',
      });
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'mail.com', 'protonmail.com', 'yandex.com',
    ];

    if (publicDomains.includes(domain)) {
      setEmailValidation({
        valid: false,
        message: `Public email domains (${domain}) are not allowed. Please use a corporate email address.`,
      });
      return;
    }

    if (user?.company && user.company.type !== 'CLIENT') {
      setEmailValidation({
        valid: true,
        message: 'Email domain looks valid. Validation will be performed on submission.',
      });
    } else {
      setEmailValidation({
        valid: true,
        message: 'Email format is valid',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: permissions.map(p => p.id),
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: [],
    }));
  };

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    p.module.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const module = permission.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailValidation?.valid) {
      setError('Please fix email validation errors before submitting');
      return;
    }

    if (!formData.roleId) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    try {
      await userApi.invite({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        phone: formData.phone,
        department: formData.department,
        permissions: formData.permissions,
      });

      setSuccess(`Invitation sent successfully to ${formData.email}`);

      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: roles.length > 0 ? roles[roles.length - 1].id : '',
        department: '',
        phone: '',
        permissions: [],
      });

      await fetchPendingInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      await userApi.resendInvitation(userId);
      alert('Invitation resent successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (userId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await userApi.cancelInvitation(userId);
      await fetchPendingInvitations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invite Employees</h1>
        <p className="mt-2 text-gray-600">
          Send invitations to employees to join your company
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invitation Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Invitation</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                  emailValidation === null
                    ? 'border-gray-300 focus:ring-blue-500'
                    : emailValidation.valid
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-red-300 focus:ring-red-500'
                }`}
                placeholder="employee@company.com"
              />
              {emailValidation && (
                <div className={`mt-1 text-xs flex items-start ${
                  emailValidation.valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  <svg
                    className={`w-4 h-4 mr-1 mt-0.5 ${
                      emailValidation.valid ? 'text-green-500' : 'text-red-500'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {emailValidation.valid ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  {emailValidation.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Permissions Section */}
            {(isSuperAdmin() || user?.role?.name === 'COMPANY_ADMIN') && permissions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Permissions (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showPermissions ? 'Hide' : 'Show'} Permissions ({formData.permissions.length} selected)
                  </button>
                </div>

                {showPermissions && (
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        Clear
                      </button>
                    </div>

                    {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                      <div key={module} className="border-b border-gray-100 pb-2 last:border-0">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{module}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {modulePermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="capitalize">{permission.action.toLowerCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !emailValidation?.valid}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>

          {/* Email Validation Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Email Validation Rules</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- Public email domains (gmail.com, yahoo.com, etc.) are not allowed</li>
              <li>- Employees must use a corporate email address</li>
              {user?.company?.type !== 'CLIENT' && (
                <li>- Additional validation may be performed based on company settings</li>
              )}
            </ul>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Invitations</h2>

          {pendingInvitations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Send your first invitation using the form
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {invitation.firstName} {invitation.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{invitation.email}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          Role: {invitation.roleName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Invited: {new Date(invitation.invitedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-lg">
                      Pending
                    </span>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Resend
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
