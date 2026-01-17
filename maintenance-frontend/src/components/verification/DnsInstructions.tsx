import { useState } from 'react';

interface DnsInstructionsProps {
  method: 'file' | 'dns_txt' | 'dns_cname';
  domain: string;
  token: string;
}

export const DnsInstructions: React.FC<DnsInstructionsProps> = ({ method, domain, token }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const fileName = `maintenance-verify-${token.slice(0, 8)}.txt`;
  const fileUrl = `https://${domain}/${fileName}`;
  const txtRecord = `_cmms-verification.${domain}`;
  const cnameRecord = `_cmms-verification.${domain}`;
  const cnameValue = `verify.maintenance-cmms.com`;

  const renderFileInstructions = () => (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">File Upload Method</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Create a new file named <code className="bg-blue-100 px-1 rounded">{fileName}</code></li>
          <li>Add the verification token as the file content</li>
          <li>Upload the file to your website's root directory</li>
          <li>Ensure the file is publicly accessible</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {fileName}
            </code>
            <button
              onClick={() => copyToClipboard(fileName, 'filename')}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {copied === 'filename' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File Content (Token)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {token}
            </code>
            <button
              onClick={() => copyToClipboard(token, 'token')}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {copied === 'token' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {fileUrl}
            </code>
            <button
              onClick={() => copyToClipboard(fileUrl, 'url')}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {copied === 'url' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTxtInstructions = () => (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">DNS TXT Record Method</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800">
          <li>Log in to your domain registrar or DNS provider</li>
          <li>Navigate to DNS settings for your domain</li>
          <li>Add a new TXT record with the values below</li>
          <li>Save the changes (may take up to 48 hours to propagate)</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
          <code className="block p-3 bg-gray-100 rounded-lg font-mono text-sm">TXT</code>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Host / Name</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {txtRecord}
            </code>
            <button
              onClick={() => copyToClipboard(txtRecord, 'txtrecord')}
              className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              {copied === 'txtrecord' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value / Content</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              cmms-verification={token}
            </code>
            <button
              onClick={() => copyToClipboard(`cmms-verification=${token}`, 'txtvalue')}
              className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              {copied === 'txtvalue' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TTL</label>
          <code className="block p-3 bg-gray-100 rounded-lg font-mono text-sm">3600 (or default)</code>
        </div>
      </div>
    </div>
  );

  const renderCnameInstructions = () => (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">DNS CNAME Record Method</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
          <li>Log in to your domain registrar or DNS provider</li>
          <li>Navigate to DNS settings for your domain</li>
          <li>Add a new CNAME record with the values below</li>
          <li>Save the changes (may take up to 48 hours to propagate)</li>
        </ol>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
          <code className="block p-3 bg-gray-100 rounded-lg font-mono text-sm">CNAME</code>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Host / Name</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {cnameRecord}
            </code>
            <button
              onClick={() => copyToClipboard(cnameRecord, 'cnamerecord')}
              className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              {copied === 'cnamerecord' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Points To / Value</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              {token.slice(0, 12)}.{cnameValue}
            </code>
            <button
              onClick={() => copyToClipboard(`${token.slice(0, 12)}.${cnameValue}`, 'cnamevalue')}
              className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              {copied === 'cnamevalue' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TTL</label>
          <code className="block p-3 bg-gray-100 rounded-lg font-mono text-sm">3600 (or default)</code>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {method === 'file' && renderFileInstructions()}
      {method === 'dns_txt' && renderTxtInstructions()}
      {method === 'dns_cname' && renderCnameInstructions()}
    </div>
  );
};
