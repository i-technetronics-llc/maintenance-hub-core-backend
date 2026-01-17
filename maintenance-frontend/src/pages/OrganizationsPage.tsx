import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Toast component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {type === 'success' ? (
          <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className={type === 'success' ? 'text-green-800' : 'text-red-800'}>{message}</span>
        <button onClick={onClose} className={`ml-4 ${type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Organization form interface
interface OrganizationForm {
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  email: string;
  phone: string;
  website: string;
  domain: string;
}

const initialFormState: OrganizationForm = {
  name: '',
  type: 'VENDOR',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  email: '',
  phone: '',
  website: '',
  domain: '',
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState<OrganizationForm>(initialFormState);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, typeFilter, statusFilter]);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showToast('Failed to fetch organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(term) ||
          org.address?.toLowerCase().includes(term) ||
          org.contactInfo?.email?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((org) => {
        if (org.organizationType) {
          return org.organizationType.code === typeFilter;
        }
        return org.type === typeFilter;
      });
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((org) => org.status === statusFilter);
    }

    setFilteredOrganizations(filtered);
  };

  const openCreateDrawer = () => {
    setFormData(initialFormState);
    setEditingOrg(null);
    setWizardStep(1);
    setDomainVerified(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (org: any) => {
    setFormData({
      name: org.name || '',
      type: org.type || org.organizationType?.code || 'VENDOR',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      country: org.country || '',
      postalCode: org.postalCode || '',
      email: org.contactInfo?.email || '',
      phone: org.contactInfo?.phone || '',
      website: org.website || '',
      domain: org.domain || '',
    });
    setEditingOrg(org);
    setWizardStep(1);
    setDomainVerified(!!org.isDomainVerified);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setWizardStep(1);
    setFormData(initialFormState);
    setEditingOrg(null);
    setDomainVerified(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    // Validate step 1
    if (!formData.name || !formData.type || !formData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setWizardStep(2);
  };

  const handlePrevStep = () => {
    setWizardStep(1);
  };

  const handleVerifyDomain = async () => {
    if (!formData.domain) {
      showToast('Please enter a domain to verify', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate domain verification - in real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if domain is accessible (simplified check)
      const domain = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // For demo, consider it verified if it has a valid format
      const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain);

      if (isValidDomain) {
        setDomainVerified(true);
        showToast('Domain verified successfully!', 'success');
      } else {
        showToast('Invalid domain format. Please enter a valid domain (e.g., example.com)', 'error');
      }
    } catch (error) {
      showToast('Failed to verify domain. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
        },
        website: formData.website,
        domain: formData.domain,
        isDomainVerified: domainVerified,
      };

      if (editingOrg) {
        await api.patch(`/organizations/${editingOrg.id}`, payload);
        showToast('Organization updated successfully!', 'success');
      } else {
        await api.post('/organizations', payload);
        showToast('Organization created successfully!', 'success');
      }

      closeDrawer();
      fetchOrganizations();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save organization', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (orgId: string) => {
    try {
      await api.delete(`/organizations/${orgId}`);
      showToast('Organization deleted successfully!', 'success');
      setDeleteConfirm(null);
      fetchOrganizations();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete organization', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getOrgType = (org: any) => {
    if (org.organizationType) {
      return {
        code: org.organizationType.code,
        name: org.organizationType.name,
      };
    }
    return {
      code: org.type,
      name: org.type === 'VENDOR' ? 'Vendor' : 'Client',
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Organization</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this organization? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeDrawer}></div>
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-xl animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingOrg ? 'Edit Organization' : 'Create Organization'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Step {wizardStep} of 2: {wizardStep === 1 ? 'Organization Details' : 'Domain Verification'}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 bg-gray-50">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${wizardStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Details</span>
                <span className="text-xs text-gray-500">Verify Domain</span>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {/* Organization Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter organization name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Organization Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="VENDOR">Vendor</option>
                      <option value="CLIENT">Client</option>
                    </select>
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@organization.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://www.organization.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Country & Postal Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  {/* Domain Verification Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Domain Verification</h3>
                    <p className="text-sm text-blue-700">
                      Verify your organization's domain to enable strict email validation for employees.
                      This step is optional but recommended.
                    </p>
                  </div>

                  {/* Domain Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="domain"
                        value={formData.domain}
                        onChange={handleInputChange}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={domainVerified}
                      />
                      <button
                        onClick={handleVerifyDomain}
                        disabled={isVerifying || domainVerified || !formData.domain}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          domainVerified
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                      >
                        {isVerifying ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </span>
                        ) : domainVerified ? (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {domainVerified && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-900">Domain Verified</p>
                          <p className="text-sm text-green-700 mt-1">
                            Your domain has been verified successfully. Employees will need to use @{formData.domain} email addresses.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skip Info */}
                  {!domainVerified && (
                    <p className="text-sm text-gray-500 text-center">
                      You can skip this step and verify your domain later
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex justify-between">
                {wizardStep === 1 ? (
                  <>
                    <button
                      onClick={closeDrawer}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePrevStep}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : editingOrg ? 'Update Organization' : 'Create Organization'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Organizations</h2>
          <p className="mt-2 text-gray-600">Manage vendor and client organizations</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded transition ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={openCreateDrawer}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Organization
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, address, or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Type
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="VENDOR">Vendor</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>

          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredOrganizations.length} of {organizations.length} organizations
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => {
            const orgType = getOrgType(org);
            return (
              <div key={org.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      orgType.code === 'VENDOR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {orgType.name}
                    </span>
                    {/* Action Buttons */}
                    <button
                      onClick={() => openEditDrawer(org)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(org.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {org.address && (
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{org.address}</span>
                    </div>
                  )}
                  {org.contactInfo?.email && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{org.contactInfo.email}</span>
                    </div>
                  )}
                  {org.contactInfo?.phone && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{org.contactInfo.phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    org.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {org.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org) => {
                  const orgType = getOrgType(org);
                  return (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          {org.address && <div className="text-sm text-gray-500">{org.address}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          orgType.code === 'VENDOR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {orgType.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{org.contactInfo?.email || '-'}</div>
                        <div className="text-sm text-gray-500">{org.contactInfo?.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          org.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditDrawer(org)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(org.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating a new organization.'}
          </p>
          {!searchTerm && typeFilter === 'ALL' && statusFilter === 'ALL' && (
            <button
              onClick={openCreateDrawer}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Organization
            </button>
          )}
        </div>
      )}
    </div>
  );
}
