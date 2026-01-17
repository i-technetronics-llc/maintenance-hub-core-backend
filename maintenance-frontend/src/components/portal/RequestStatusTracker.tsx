import React from 'react';

interface StatusStep {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface RequestStatusTrackerProps {
  currentStatus: 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy: string;
    notes: string;
  }[];
}

const statusSteps: StatusStep[] = [
  {
    status: 'submitted',
    label: 'Submitted',
    description: 'Your request has been submitted',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: 'acknowledged',
    label: 'Acknowledged',
    description: 'We have received your request',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    status: 'in_progress',
    label: 'In Progress',
    description: 'A technician is working on it',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    status: 'completed',
    label: 'Completed',
    description: 'Your request has been resolved',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const statusOrder = ['submitted', 'acknowledged', 'in_progress', 'completed'];

export function RequestStatusTracker({ currentStatus, statusHistory }: RequestStatusTrackerProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-800">Request Cancelled</h3>
            <p className="text-sm text-red-600">This service request has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getHistoryForStatus = (status: string) => {
    return statusHistory?.find((h) => h.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Status</h3>

      <div className="relative">
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const historyEntry = getHistoryForStatus(step.status);

          return (
            <div key={step.status} className="relative pb-8 last:pb-0">
              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${
                    stepStatus === 'completed' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="flex items-start">
                {/* Status Circle */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                    stepStatus === 'completed'
                      ? 'bg-blue-500 text-white'
                      : stepStatus === 'current'
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-semibold ${
                        stepStatus === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {historyEntry && (
                      <span className="text-xs text-gray-500">
                        {formatDate(historyEntry.changedAt)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      stepStatus === 'upcoming' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {step.description}
                  </p>
                  {historyEntry?.notes && stepStatus !== 'upcoming' && (
                    <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                      {historyEntry.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
