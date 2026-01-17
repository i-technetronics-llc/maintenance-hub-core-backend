import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  portalRequestsApi,
  portalReferenceApi,
  ServiceCategory,
  LocationOption,
  AssetOption,
} from '../../services/portalApi';

interface RequestFormProps {
  onSuccess?: () => void;
}

export function RequestForm({ onSuccess }: RequestFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    locationId: '',
    assetId: '',
  });

  // Load reference data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, locationsData] = await Promise.all([
          portalReferenceApi.getCategories(),
          portalReferenceApi.getLocations(),
        ]);
        setCategories(categoriesData);
        setLocations(locationsData);
      } catch (err) {
        console.error('Failed to load reference data:', err);
      }
    };
    loadData();
  }, []);

  // Load assets when location changes
  useEffect(() => {
    const loadAssets = async () => {
      if (formData.locationId) {
        try {
          const assetsData = await portalReferenceApi.getAssets(formData.locationId);
          setAssets(assetsData);
        } catch (err) {
          console.error('Failed to load assets:', err);
        }
      } else {
        setAssets([]);
      }
    };
    loadAssets();
  }, [formData.locationId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'locationId' && { assetId: '' }), // Reset asset when location changes
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await portalRequestsApi.submit({
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
        priority: formData.priority,
        locationId: formData.locationId || undefined,
        assetId: formData.assetId || undefined,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/portal/requests');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || !formData.description)) {
      setError('Please fill in the title and description');
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', description: 'Can wait a few days', color: 'green' },
    { value: 'medium', label: 'Medium', description: 'Should be addressed soon', color: 'yellow' },
    { value: 'high', label: 'High', description: 'Needs prompt attention', color: 'orange' },
    { value: 'urgent', label: 'Urgent', description: 'Critical - needs immediate help', color: 'red' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Progress Steps */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  currentStep >= step
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-400/50 text-white'
                }`}
              >
                {currentStep > step ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                    currentStep > step ? 'bg-white' : 'bg-blue-400/50'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-blue-100">
          <span>Details</span>
          <span>Category</span>
          <span>Review</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Brief summary of your issue (e.g., 'Broken AC in Room 205')"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Please provide detailed information about the issue. Include when it started, any symptoms, and any relevant details that might help our team."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, priority: option.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.priority === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-3 h-3 rounded-full mr-2 ${
                          option.color === 'green'
                            ? 'bg-green-500'
                            : option.color === 'yellow'
                            ? 'bg-yellow-500'
                            : option.color === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Category & Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select a location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.address && `- ${loc.address}`}
                  </option>
                ))}
              </select>
            </div>

            {formData.locationId && assets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Asset (Optional)
                </label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select an asset...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} {asset.assetNumber && `(${asset.assetNumber})`}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  If this issue relates to a specific equipment or asset, please select it.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Request</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                  <p className="text-gray-900 font-medium mt-1">{formData.title}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          formData.priority === 'low'
                            ? 'bg-green-100 text-green-800'
                            : formData.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : formData.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                    <p className="text-gray-700 mt-1">
                      {categories.find((c) => c.value === formData.category)?.label || 'Not specified'}
                    </p>
                  </div>
                </div>

                {formData.locationId && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <p className="text-gray-700 mt-1">
                      {locations.find((l) => l.id === formData.locationId)?.name || 'N/A'}
                    </p>
                  </div>
                )}

                {formData.assetId && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asset</label>
                    <p className="text-gray-700 mt-1">
                      {assets.find((a) => a.id === formData.assetId)?.name || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once submitted, you will receive a confirmation email. Our team will review your request and get back to you shortly.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={currentStep === 1 ? () => navigate('/portal/dashboard') : prevStep}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-2.5 rounded-lg font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
