import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi, Company } from '../services/api';

export const CompanyManagementPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createFormData, setCreateFormData] = useState({
    name: '',
    organizationTypeCode: 'VENDOR',
    website: '',
    workEmail: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    industry: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter, typeFilter]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await companyApi.getAll();
      const data = response?.data;
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    if (!Array.isArray(companies)) {
      setFilteredCompanies([]);
      return;
    }
    let filtered = companies;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(term) ||
          company.workEmail.toLowerCase().includes(term) ||
          company.verifiedDomain?.toLowerCase().includes(term) ||
          company.website.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((company) => company.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((company) => company.type === typeFilter);
    }

    setFilteredCompanies(filtered);
  };

  const handleSuspend = async (companyId: string) => {
    if (!confirm('Are you sure you want to suspend this company? All users will lose access.')) return;

    setActionLoading(companyId);
    try {
      await companyApi.suspend(companyId);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      await companyApi.activate(companyId);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (companyId: string) => {
    if (!confirm('Are you sure you want to approve this company?')) return;

    setActionLoading(companyId);
    try {
      await companyApi.approve(companyId);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await companyApi.create(createFormData);
      await fetchCompanies();
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        organizationTypeCode: 'VENDOR',
        website: '',
        workEmail: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        industry: '',
      });
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getVerificationBadge = (isDomainVerified: boolean) => {
    if (isDomainVerified) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="mt-2 text-gray-600">Manage all companies on the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Company
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or domain..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="VENDOR">Vendor</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredCompanies.length} of {companies.length} companies
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'No companies have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain & Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.workEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.type === 'VENDOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {company.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{company.verifiedDomain || 'N/A'}</div>
                      <div className="mt-1">{getVerificationBadge(company.isDomainVerified)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(company.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/inventory/price-books/${company.id}`)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Price Books"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => navigate(`/companies/${company.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {company.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleApprove(company.id)}
                            disabled={actionLoading === company.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Approve Company"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}

                        {company.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSuspend(company.id)}
                            disabled={actionLoading === company.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Suspend Company"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}

                        {(company.status === 'SUSPENDED' || company.status === 'INACTIVE') && (
                          <button
                            onClick={() => handleActivate(company.id)}
                            disabled={actionLoading === company.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Activate Company"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Company</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              <form onSubmit={handleCreateCompany}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={createFormData.name}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="organizationTypeCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Type *
                    </label>
                    <select
                      id="organizationTypeCode"
                      name="organizationTypeCode"
                      required
                      value={createFormData.organizationTypeCode}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="VENDOR">Vendor Company</option>
                      <option value="CLIENT">Client Organization</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                      Industry *
                    </label>
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      required
                      value={createFormData.industry}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Website *
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      required
                      value={createFormData.website}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="workEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      id="workEmail"
                      name="workEmail"
                      required
                      value={createFormData.workEmail}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={createFormData.phone}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={createFormData.address}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={createFormData.city}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={createFormData.state}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={createFormData.country}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={createFormData.postalCode}
                      onChange={handleCreateFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Creating...' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
