import { useState, useEffect } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'system' | 'custom';
  variables: string[];
  isActive: boolean;
  lastModified: string;
}

export const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to {{siteName}}!',
          body: 'Hello {{firstName}},\n\nWelcome to {{siteName}}! Your account has been created successfully.\n\nYou can now login at: {{loginUrl}}\n\nBest regards,\n{{siteName}} Team',
          type: 'system',
          variables: ['firstName', 'siteName', 'loginUrl'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Password Reset',
          subject: 'Reset Your Password',
          body: 'Hello {{firstName}},\n\nYou requested to reset your password. Click the link below to set a new password:\n\n{{resetLink}}\n\nThis link will expire in 24 hours.\n\nIf you did not request this, please ignore this email.',
          type: 'system',
          variables: ['firstName', 'resetLink'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Work Order Assigned',
          subject: 'New Work Order Assigned: {{woNumber}}',
          body: 'Hello {{assigneeName}},\n\nA new work order has been assigned to you:\n\nWork Order: {{woNumber}}\nTitle: {{woTitle}}\nPriority: {{woPriority}}\nDue Date: {{woDueDate}}\n\nView details: {{woLink}}',
          type: 'system',
          variables: ['assigneeName', 'woNumber', 'woTitle', 'woPriority', 'woDueDate', 'woLink'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Company Approved',
          subject: 'Your Company Has Been Approved!',
          body: 'Hello {{adminName}},\n\nGreat news! Your company {{companyName}} has been approved.\n\nYou can now access all features of the platform.\n\nLogin here: {{loginUrl}}',
          type: 'system',
          variables: ['adminName', 'companyName', 'loginUrl'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Employee Invitation',
          subject: "You've been invited to join {{companyName}}",
          body: 'Hello {{firstName}},\n\n{{inviterName}} has invited you to join {{companyName}} on our maintenance platform.\n\nClick the link below to accept the invitation and set up your account:\n\n{{inviteLink}}\n\nThis invitation expires in 7 days.',
          type: 'system',
          variables: ['firstName', 'inviterName', 'companyName', 'inviteLink'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
        {
          id: '6',
          name: 'Subscription Expiring',
          subject: 'Your Subscription is Expiring Soon',
          body: 'Hello {{adminName}},\n\nYour {{planName}} subscription for {{companyName}} will expire on {{expiryDate}}.\n\nRenew now to avoid service interruption.\n\nRenew: {{renewLink}}',
          type: 'system',
          variables: ['adminName', 'planName', 'companyName', 'expiryDate', 'renewLink'],
          isActive: true,
          lastModified: new Date().toISOString(),
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      // Mock save - replace with API call
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate) return;
    alert('Test email sent to your email address');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500">Manage system email templates</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Template
        </button>
      </div>

      <div className="flex gap-6">
        {/* Template List */}
        <div className="w-80 bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(false);
                }}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    template.type === 'system' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {template.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">{template.subject}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Template Editor */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border">
          {selectedTemplate ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendTest}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Send Test
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Template
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTemplate.subject}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">{selectedTemplate.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                  {isEditing ? (
                    <textarea
                      value={selectedTemplate.body}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  ) : (
                    <pre className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                      {selectedTemplate.body}
                    </pre>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-mono cursor-pointer hover:bg-blue-100"
                        onClick={() => {
                          if (isEditing) {
                            navigator.clipboard.writeText(`{{${variable}}}`);
                          }
                        }}
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Active Status</p>
                    <p className="text-sm text-gray-500">Enable or disable this email template</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTemplate.isActive}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, isActive: e.target.checked })}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <p className="text-sm text-gray-500">
                  Last modified: {new Date(selectedTemplate.lastModified).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              Select a template to view or edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
