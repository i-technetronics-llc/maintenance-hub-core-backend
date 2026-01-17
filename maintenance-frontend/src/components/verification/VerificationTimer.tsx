import { useState, useEffect } from 'react';

interface VerificationTimerProps {
  deadline: Date;
  onExpire?: () => void;
}

export const VerificationTimer: React.FC<VerificationTimerProps> = ({ deadline, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = deadline.getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (timeLeft.expired) {
    return (
      <div className="flex items-center text-red-600 text-sm font-medium">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Deadline Expired
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 24;
  const isCritical = timeLeft.hours < 6;

  return (
    <div className={`flex items-center text-sm font-medium ${
      isCritical ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
    }`}>
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
      </span>
      <span className="ml-1 text-xs opacity-75">remaining</span>
    </div>
  );
};
