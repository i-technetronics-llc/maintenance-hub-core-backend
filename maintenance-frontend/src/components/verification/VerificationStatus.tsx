interface VerificationStatusProps {
  domain: string;
  isVerifying: boolean;
  onVerify: () => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  domain,
  isVerifying,
  onVerify,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-50 rounded-xl">
        <div className="mb-4">
          {isVerifying ? (
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isVerifying ? 'Verifying Domain...' : 'Ready to Verify'}
        </h3>

        <p className="text-gray-600 mb-4">
          {isVerifying
            ? `Checking verification for ${domain}...`
            : `Click the button below to verify ${domain}`}
        </p>

        {!isVerifying && (
          <button
            onClick={onVerify}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Verify Domain Now
          </button>
        )}
      </div>

      <div className="text-left">
        <h4 className="font-medium text-gray-900 mb-2">Verification Checklist:</h4>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verification method selected
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Instructions reviewed
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isVerifying ? 'Verification in progress...' : 'Waiting for verification'}
          </li>
        </ul>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> DNS changes may take up to 48 hours to propagate.
          If verification fails, please wait and try again later.
        </p>
      </div>
    </div>
  );
};
