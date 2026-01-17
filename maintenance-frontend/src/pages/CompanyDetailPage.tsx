import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companyApi, domainVerificationApi, Company, DomainVerification } from '../services/api';

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

export const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [verification, setVerification] = useState<DomainVerification | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const companyData = await companyApi.getById(id);
      setCompany(companyData);

      // Fetch domain verification status
      try {
        const verificationData = await domainVerificationApi.getStatus(id);
        setVerification(verificationData);
      } catch (err) {
        // Verification might not exist yet
        setVerification(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateVerification = async () => {
    if (!id) return;

    setActionLoading(true);
    try {
      const data = await domainVerificationApi.initiate(id);
      setVerification(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to initiate domain verification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    if (!verification) return;

    setActionLoading(true);
    try {
      const data = await domainVerificationApi.verify(verification.id);
      setVerification(data);
      await fetchCompanyDetails(); // Refresh company data
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Verification failed. Please ensure the file is uploaded correctly.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryVerification = async () => {
    if (!verification) return;

    setActionLoading(true);
    try {
      const data = await domainVerificationApi.retry(verification.id);
      setVerification(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to retry verification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEmailValidationMode = async (mode: string) => {
    if (!id) return;

    if (!confirm(`Change email validation mode to ${mode}?`)) return;

    try {
      await companyApi.updateEmailValidationMode(id, mode);
      await fetchCompanyDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update email validation mode', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Company not found'}</p>
        </div>
        <button
          onClick={() => navigate('/companies')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Companies
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'verification', label: 'Domain Verification' },
    { id: 'settings', label: 'Settings' },
  ];

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

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/companies')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Companies
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="mt-2 text-gray-600">{company.workEmail}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              company.type === 'VENDOR'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {company.type}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              company.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : company.status === 'PENDING_APPROVAL'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {company.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.industry || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {company.website}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Verified Domain</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {company.verifiedDomain || 'Not verified'}
                  {company.isDomainVerified && (
                    <svg className="w-4 h-4 ml-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Work Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.workEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.address && (
                    <>
                      {company.address}<br />
                      {company.city}, {company.state} {company.postalCode}<br />
                      {company.country}
                    </>
                  )}
                  {!company.address && 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Validation Mode</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.emailValidationMode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(company.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {company.approvedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(company.approvedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Verification</h2>

          {!verification ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No verification initiated</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start the domain verification process to enable strict email validation
              </p>
              <button
                onClick={handleInitiateVerification}
                disabled={actionLoading}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Initiate Verification
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Verification Status</p>
                  <p className="text-sm text-gray-500">Domain: {verification.domain}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  verification.status === 'VERIFIED'
                    ? 'bg-green-100 text-green-800'
                    : verification.status === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {verification.status}
                </span>
              </div>

              {/* Instructions */}
              {verification.status !== 'VERIFIED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Verification Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                    <li>Create a text file with the following content:</li>
                    <div className="mt-2 p-3 bg-white border border-blue-300 rounded font-mono text-xs break-all">
                      {verification.verificationHash}
                    </div>
                    <li className="mt-3">Save the file as: <code className="px-1 bg-white border border-blue-300 rounded">{verification.verificationFileName}</code></li>
                    <li>Upload this file to the root of your website: <code className="px-1 bg-white border border-blue-300 rounded">https://{verification.domain}/{verification.verificationFileName}</code></li>
                    <li>Click "Verify Now" button below to check if the file is accessible</li>
                  </ol>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleVerifyNow}
                  disabled={actionLoading || verification.status === 'VERIFIED'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Verify Now'}
                </button>

                {verification.status === 'FAILED' && (
                  <button
                    onClick={handleRetryVerification}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Retry Verification
                  </button>
                )}
              </div>

              {/* Automatic Check Info */}
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Automatic Verification</h3>
                <p className="text-sm text-gray-600">
                  Our system automatically checks pending verifications every 4 hours. You can also manually verify using the button above.
                </p>
                {verification.lastCheckedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last checked: {new Date(verification.lastCheckedAt).toLocaleString()}
                  </p>
                )}
                {verification.attemptCount > 0 && (
                  <p className="text-xs text-gray-500">
                    Attempts: {verification.attemptCount} / 10
                  </p>
                )}
                {verification.failureReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-600">
                      <strong>Failure Reason:</strong> {verification.failureReason}
                    </p>
                  </div>
                )}
              </div>

              {verification.status === 'VERIFIED' && verification.verifiedAt && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900">Domain Verified Successfully!</p>
                      <p className="text-xs text-green-700 mt-1">
                        Verified on {new Date(verification.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Settings</h2>

          {/* Email Validation Mode */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Email Validation Mode</h3>
            <p className="text-sm text-gray-600 mb-4">
              Control how employee email addresses are validated during invitation
            </p>

            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="radio"
                  id="flexible"
                  name="emailMode"
                  checked={company.emailValidationMode === 'FLEXIBLE'}
                  onChange={() => handleUpdateEmailValidationMode('FLEXIBLE')}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="flexible" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">Flexible Mode</span>
                  <span className="block text-sm text-gray-600">
                    Only blocks public email domains (gmail.com, yahoo.com, etc.). Employees can use any corporate email.
                  </span>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="radio"
                  id="strict"
                  name="emailMode"
                  checked={company.emailValidationMode === 'STRICT'}
                  onChange={() => handleUpdateEmailValidationMode('STRICT')}
                  disabled={!company.isDomainVerified}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="strict" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Strict Mode
                    {!company.isDomainVerified && (
                      <span className="ml-2 text-xs text-yellow-600">(Requires domain verification)</span>
                    )}
                  </span>
                  <span className="block text-sm text-gray-600">
                    Only allows email addresses from your verified domain ({company.verifiedDomain || 'Not verified'})
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
