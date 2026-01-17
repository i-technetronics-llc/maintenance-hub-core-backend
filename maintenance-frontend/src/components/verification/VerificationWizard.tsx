import { useState } from 'react';
import { DnsInstructions } from './DnsInstructions';
import { VerificationStatus } from './VerificationStatus';
import { VerificationTimer } from './VerificationTimer';

interface VerificationWizardProps {
  domain: string;
  companyId: string;
  verificationId?: string;
  onComplete: () => void;
  onSkip?: () => void;
}

type VerificationMethod = 'file' | 'dns_txt' | 'dns_cname';
type WizardStep = 'method' | 'instructions' | 'verify' | 'complete';

export const VerificationWizard: React.FC<VerificationWizardProps> = ({
  domain,
  companyId: _companyId,
  verificationId: _verificationId,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<WizardStep>('method');
  const [method, setMethod] = useState<VerificationMethod>('file');
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const generateToken = () => {
    return 'verify-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleMethodSelect = (selectedMethod: VerificationMethod) => {
    setMethod(selectedMethod);
    setVerificationToken(generateToken());
    setStep('instructions');
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    try {
      // Simulated verification - in production, call the API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('complete');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Domain Verification</h2>
          <VerificationTimer deadline={new Date(Date.now() + 72 * 60 * 60 * 1000)} />
        </div>
        <div className="flex items-center space-x-2">
          {['method', 'instructions', 'verify', 'complete'].map((s, index) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['method', 'instructions', 'verify', 'complete'].indexOf(step) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {['method', 'instructions', 'verify', 'complete'].indexOf(step) > index ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['method', 'instructions', 'verify', 'complete'].indexOf(step) > index
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Method</span>
          <span>Instructions</span>
          <span>Verify</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Select Method */}
        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Select a verification method for <strong>{domain}</strong>:
            </p>
            <div className="grid gap-4">
              <button
                onClick={() => handleMethodSelect('file')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">File Upload (Recommended)</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a verification file to your website's root directory
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('dns_txt')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">DNS TXT Record</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add a TXT record to your domain's DNS settings
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('dns_cname')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">DNS CNAME Record</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add a CNAME record to your domain's DNS settings
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Instructions */}
        {step === 'instructions' && (
          <div className="space-y-4">
            <DnsInstructions
              method={method}
              domain={domain}
              token={verificationToken}
            />
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('method')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep('verify')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                I've Completed This
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify */}
        {step === 'verify' && (
          <div className="space-y-4 text-center">
            <VerificationStatus
              domain={domain}
              isVerifying={isVerifying}
              onVerify={handleVerify}
            />
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('instructions')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Domain Verified!</h3>
            <p className="text-gray-600 mb-6">
              Your domain <strong>{domain}</strong> has been successfully verified.
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
