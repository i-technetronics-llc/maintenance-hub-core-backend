import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { portalRequestsApi, ServiceRequest } from '../../services/portalApi';
import { RequestStatusTracker, RatingWidget } from '../../components/portal';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = async () => {
    if (!id) return;
    try {
      const data = await portalRequestsApi.getById(id);
      setRequest(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load request');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const updated = await portalRequestsApi.addComment(id, newComment.trim());
      setRequest(updated);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRateService = async (rating: number, feedback: string) => {
    if (!id) return;
    const updated = await portalRequestsApi.rate(id, rating, feedback);
    setRequest(updated);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'urgent':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Request Not Found</h3>
        <p className="text-gray-500 mb-4">{error || 'The request you are looking for does not exist.'}</p>
        <Link to="/portal/requests" className="text-blue-600 hover:text-blue-700 font-medium">
          Back to My Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/portal/requests"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Requests
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              #{request.requestNumber}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{request.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submitted on {formatDate(request.submittedAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
                <p className="text-sm text-gray-900 mt-1 capitalize">
                  {request.category?.replace(/_/g, ' ') || 'General'}
                </p>
              </div>
              {request.location && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-gray-900 mt-1">{request.location.locationName}</p>
                </div>
              )}
              {request.asset && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asset</p>
                  <p className="text-sm text-gray-900 mt-1">{request.asset.name}</p>
                </div>
              )}
              {request.workOrderId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Work Order</p>
                  <p className="text-sm text-blue-600 mt-1">Assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments</h3>

            {/* Comment List */}
            <div className="space-y-4 mb-6">
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex ${comment.authorType === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-xl px-4 py-3 ${
                        comment.authorType === 'customer'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${comment.authorType === 'customer' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {comment.authorName}
                        </span>
                        <span className={`text-xs ${comment.authorType === 'customer' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(comment.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>

            {/* Add Comment Form */}
            {request.status !== 'completed' && request.status !== 'cancelled' && (
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmittingComment ? 'Sending...' : 'Send'}
                </button>
              </form>
            )}
          </div>

          {/* Rating Section (show only for completed requests) */}
          {request.status === 'completed' && (
            <RatingWidget
              rating={request.rating}
              feedback={request.feedback}
              readonly={!!request.rating}
              onSubmit={handleRateService}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <RequestStatusTracker
            currentStatus={request.status}
            statusHistory={request.statusHistory}
          />

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {request.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">{attachment.fileType}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions about your request, our support team is here to help.
            </p>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
