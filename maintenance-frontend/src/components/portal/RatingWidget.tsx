import { useState } from 'react';

interface RatingWidgetProps {
  rating?: number;
  feedback?: string;
  readonly?: boolean;
  onSubmit?: (rating: number, feedback: string) => Promise<void>;
}

export function RatingWidget({ rating: initialRating, feedback: initialFeedback, readonly = false, onSubmit }: RatingWidgetProps) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!initialRating);

  const handleSubmit = async () => {
    if (!rating || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-8 h-8 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );

  if (submitted || readonly) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-6">
        <div className="text-center">
          <div className="flex justify-center space-x-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= rating} />
            ))}
          </div>
          <p className="text-lg font-semibold text-blue-800">
            {rating === 5
              ? 'Excellent!'
              : rating === 4
              ? 'Great!'
              : rating === 3
              ? 'Good'
              : rating === 2
              ? 'Fair'
              : 'Poor'}
          </p>
          {feedback && (
            <p className="text-sm text-gray-600 mt-3 italic">"{feedback}"</p>
          )}
          {submitted && !readonly && (
            <p className="text-sm text-green-600 mt-4 flex items-center justify-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Thank you for your feedback!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        Rate Your Experience
      </h4>
      <p className="text-sm text-gray-500 text-center mb-4">
        How was the service? Your feedback helps us improve.
      </p>

      {/* Stars */}
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="transform transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <StarIcon filled={star <= (hoveredRating || rating)} />
          </button>
        ))}
      </div>

      {/* Rating Labels */}
      {rating > 0 && (
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {rating === 5
              ? 'Excellent'
              : rating === 4
              ? 'Great'
              : rating === 3
              ? 'Good'
              : rating === 2
              ? 'Fair'
              : 'Poor'}
          </span>
        </div>
      )}

      {/* Feedback Textarea */}
      <div className="mb-4">
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          placeholder="Tell us about your experience..."
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!rating || isSubmitting}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          rating && !isSubmitting
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          'Submit Rating'
        )}
      </button>
    </div>
  );
}
