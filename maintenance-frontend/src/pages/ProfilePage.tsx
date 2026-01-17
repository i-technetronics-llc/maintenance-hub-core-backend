import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.put('/auth/profile', { firstName, lastName, email });
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setMessage('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/enable-mfa');
      setQrCodeUrl(response.data.qrCode); // Updated to match backend response
      setShowMfaSetup(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-mfa', { token: mfaToken });
      setMessage('2FA enabled successfully');
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setMfaToken('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/disable-mfa');
      setMessage('2FA disabled successfully');
      setMfaEnabled(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            Update Profile
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>

        {!mfaEnabled && !showMfaSetup && (
          <div>
            <p className="text-gray-600 mb-4">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button
              onClick={handleEnableMFA}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
            >
              Enable 2FA
            </button>
          </div>
        )}

        {showMfaSetup && !mfaEnabled && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
            )}
            <form onSubmit={handleVerifyMFA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || mfaToken.length !== 6}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Verify & Enable
                </button>
                <button
                  type="button"
                  onClick={() => setShowMfaSetup(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {mfaEnabled && (
          <div>
            <p className="text-green-600 mb-4">
              Two-factor authentication is enabled for your account.
            </p>
            <button
              onClick={handleDisableMFA}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
