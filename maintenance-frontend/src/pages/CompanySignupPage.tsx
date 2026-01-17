import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyApi, api } from '../services/api';

interface SignupFormData {
  // Company Info
  name: string;
  organizationTypeCode: string;
  website: string;
  industry: string;
  // Contact Info
  emailPrefix: string;
  emailDomain: string;
  countryCode: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Account Info
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', flag: '\ud83c\uddfa\ud83c\uddf8', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '\ud83c\uddec\ud83c\udde7', dialCode: '+44' },
  { name: 'Canada', code: 'CA', flag: '\ud83c\udde8\ud83c\udde6', dialCode: '+1' },
  { name: 'Australia', code: 'AU', flag: '\ud83c\udde6\ud83c\uddfa', dialCode: '+61' },
  { name: 'Germany', code: 'DE', flag: '\ud83c\udde9\ud83c\uddea', dialCode: '+49' },
  { name: 'France', code: 'FR', flag: '\ud83c\uddeb\ud83c\uddf7', dialCode: '+33' },
  { name: 'Italy', code: 'IT', flag: '\ud83c\uddee\ud83c\uddf9', dialCode: '+39' },
  { name: 'Spain', code: 'ES', flag: '\ud83c\uddea\ud83c\uddf8', dialCode: '+34' },
  { name: 'Netherlands', code: 'NL', flag: '\ud83c\uddf3\ud83c\uddf1', dialCode: '+31' },
  { name: 'Belgium', code: 'BE', flag: '\ud83c\udde7\ud83c\uddea', dialCode: '+32' },
  { name: 'Switzerland', code: 'CH', flag: '\ud83c\udde8\ud83c\udded', dialCode: '+41' },
  { name: 'Austria', code: 'AT', flag: '\ud83c\udde6\ud83c\uddf9', dialCode: '+43' },
  { name: 'Sweden', code: 'SE', flag: '\ud83c\uddf8\ud83c\uddea', dialCode: '+46' },
  { name: 'Norway', code: 'NO', flag: '\ud83c\uddf3\ud83c\uddf4', dialCode: '+47' },
  { name: 'Denmark', code: 'DK', flag: '\ud83c\udde9\ud83c\uddf0', dialCode: '+45' },
  { name: 'Finland', code: 'FI', flag: '\ud83c\uddeb\ud83c\uddee', dialCode: '+358' },
  { name: 'Ireland', code: 'IE', flag: '\ud83c\uddee\ud83c\uddea', dialCode: '+353' },
  { name: 'Portugal', code: 'PT', flag: '\ud83c\uddf5\ud83c\uddf9', dialCode: '+351' },
  { name: 'Poland', code: 'PL', flag: '\ud83c\uddf5\ud83c\uddf1', dialCode: '+48' },
  { name: 'Czech Republic', code: 'CZ', flag: '\ud83c\udde8\ud83c\uddff', dialCode: '+420' },
  { name: 'Japan', code: 'JP', flag: '\ud83c\uddef\ud83c\uddf5', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', flag: '\ud83c\uddf0\ud83c\uddf7', dialCode: '+82' },
  { name: 'China', code: 'CN', flag: '\ud83c\udde8\ud83c\uddf3', dialCode: '+86' },
  { name: 'India', code: 'IN', flag: '\ud83c\uddee\ud83c\uddf3', dialCode: '+91' },
  { name: 'Singapore', code: 'SG', flag: '\ud83c\uddf8\ud83c\uddec', dialCode: '+65' },
  { name: 'Hong Kong', code: 'HK', flag: '\ud83c\udded\ud83c\uddf0', dialCode: '+852' },
  { name: 'Taiwan', code: 'TW', flag: '\ud83c\uddf9\ud83c\uddfc', dialCode: '+886' },
  { name: 'Malaysia', code: 'MY', flag: '\ud83c\uddf2\ud83c\uddfe', dialCode: '+60' },
  { name: 'Thailand', code: 'TH', flag: '\ud83c\uddf9\ud83c\udded', dialCode: '+66' },
  { name: 'Indonesia', code: 'ID', flag: '\ud83c\uddee\ud83c\udde9', dialCode: '+62' },
  { name: 'Philippines', code: 'PH', flag: '\ud83c\uddf5\ud83c\udded', dialCode: '+63' },
  { name: 'Vietnam', code: 'VN', flag: '\ud83c\uddfb\ud83c\uddf3', dialCode: '+84' },
  { name: 'Brazil', code: 'BR', flag: '\ud83c\udde7\ud83c\uddf7', dialCode: '+55' },
  { name: 'Mexico', code: 'MX', flag: '\ud83c\uddf2\ud83c\uddfd', dialCode: '+52' },
  { name: 'Argentina', code: 'AR', flag: '\ud83c\udde6\ud83c\uddf7', dialCode: '+54' },
  { name: 'Chile', code: 'CL', flag: '\ud83c\udde8\ud83c\uddf1', dialCode: '+56' },
  { name: 'Colombia', code: 'CO', flag: '\ud83c\udde8\ud83c\uddf4', dialCode: '+57' },
  { name: 'South Africa', code: 'ZA', flag: '\ud83c\uddff\ud83c\udde6', dialCode: '+27' },
  { name: 'Nigeria', code: 'NG', flag: '\ud83c\uddf3\ud83c\uddec', dialCode: '+234' },
  { name: 'Egypt', code: 'EG', flag: '\ud83c\uddea\ud83c\uddec', dialCode: '+20' },
  { name: 'United Arab Emirates', code: 'AE', flag: '\ud83c\udde6\ud83c\uddea', dialCode: '+971' },
  { name: 'Saudi Arabia', code: 'SA', flag: '\ud83c\uddf8\ud83c\udde6', dialCode: '+966' },
  { name: 'Israel', code: 'IL', flag: '\ud83c\uddee\ud83c\uddf1', dialCode: '+972' },
  { name: 'Turkey', code: 'TR', flag: '\ud83c\uddf9\ud83c\uddf7', dialCode: '+90' },
  { name: 'Russia', code: 'RU', flag: '\ud83c\uddf7\ud83c\uddfa', dialCode: '+7' },
  { name: 'Ukraine', code: 'UA', flag: '\ud83c\uddfa\ud83c\udde6', dialCode: '+380' },
  { name: 'Greece', code: 'GR', flag: '\ud83c\uddec\ud83c\uddf7', dialCode: '+30' },
  { name: 'New Zealand', code: 'NZ', flag: '\ud83c\uddf3\ud83c\uddff', dialCode: '+64' },
];

const INDUSTRIES = [
  'Technology',
  'Manufacturing',
  'Healthcare',
  'Finance',
  'Retail',
  'Construction',
  'Education',
  'Transportation',
  'Energy',
  'Other',
];

export const CompanySignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Domain verification state
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationFileName, setVerificationFileName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'verified' | 'failed'>('pending');
  const [retryCount, setRetryCount] = useState(0);

  // Country dropdowns
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneCountrySearch, setPhoneCountrySearch] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);
  const phoneCountryRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    organizationTypeCode: 'VENDOR',
    website: '',
    industry: '',
    emailPrefix: '',
    emailDomain: '',
    countryCode: 'US',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (phoneCountryRef.current && !phoneCountryRef.current.contains(event.target as Node)) {
        setShowPhoneCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-populate email domain from website
  useEffect(() => {
    if (formData.website) {
      const domain = extractDomain(formData.website);
      if (domain) {
        setFormData(prev => ({ ...prev, emailDomain: domain }));
      }
    }
  }, [formData.website]);

  const extractDomain = (website: string): string => {
    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getFullEmail = () => {
    return formData.emailPrefix && formData.emailDomain
      ? `${formData.emailPrefix}@${formData.emailDomain}`
      : '';
  };

  const getSelectedCountry = (code: string) => COUNTRIES.find(c => c.code === code);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredPhoneCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
    c.dialCode.includes(phoneCountrySearch)
  );

  const selectCountry = (country: Country) => {
    setFormData(prev => ({ ...prev, country: country.name }));
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const selectPhoneCountry = (country: Country) => {
    setFormData(prev => ({ ...prev, countryCode: country.code }));
    setShowPhoneCountryDropdown(false);
    setPhoneCountrySearch('');
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');

    if (currentStep === 1) {
      if (!formData.name || !formData.organizationTypeCode || !formData.website || !formData.industry) {
        setError('Please fill in all company information fields');
        return false;
      }
      if (!extractDomain(formData.website)) {
        setError('Please enter a valid website URL');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.emailPrefix || !formData.emailDomain || !formData.phone ||
          !formData.address || !formData.city || !formData.state || !formData.country || !formData.postalCode) {
        setError('Please fill in all contact information fields');
        return false;
      }
      const fullEmail = getFullEmail();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail)) {
        setError('Please enter a valid work email address');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.firstName || !formData.lastName || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all account information fields');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.termsAccepted) {
        setError('You must accept the terms and conditions');
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Generate verification token before moving to step 4
        const token = generateVerificationToken();
        setVerificationToken(token);
        setVerificationFileName(`maintenance-verify-${token.slice(0, 8)}.txt`);
      }
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const generateVerificationToken = () => {
    return 'verify-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleVerifyDomain = async () => {
    setVerificationStatus('verifying');
    setError('');

    try {
      const domain = extractDomain(formData.website);
      const response = await api.post('/domain-verification/verify', {
        domain,
        token: verificationToken,
        fileName: verificationFileName,
      });

      if (response.data?.verified || response.data?.data?.verified) {
        setVerificationStatus('verified');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: any) {
      setVerificationStatus('failed');
      setRetryCount(prev => prev + 1);
      setError(err.response?.data?.message || 'Domain verification failed. Please ensure the file is accessible.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 4 && verificationStatus !== 'verified') {
      setError('Please verify your domain before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedCountry = getSelectedCountry(formData.countryCode);
      const fullPhone = selectedCountry
        ? `${selectedCountry.dialCode} ${formData.phone}`
        : formData.phone;

      await companyApi.register({
        name: formData.name,
        organizationTypeCode: formData.organizationTypeCode,
        website: formData.website,
        industry: formData.industry,
        workEmail: getFullEmail(),
        phone: fullPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        adminFirstName: formData.firstName,
        adminLastName: formData.lastName,
        adminPassword: formData.password,
        domainVerified: verificationStatus === 'verified',
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const extractedDomain = extractDomain(formData.website);
  const selectedPhoneCountry = getSelectedCountry(formData.countryCode);

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen flex font-['Milliki',_sans-serif]">
        {/* Left Side - Infographics */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 mb-8">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center font-['Milliki',_sans-serif]">Registration Complete!</h1>
            <p className="text-xl text-white/80 text-center max-w-md font-['Milliki',_sans-serif]">
              Welcome to the Maintenance Automation Platform
            </p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="lg:hidden mb-6">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-['Milliki',_sans-serif]">Registration Submitted!</h2>
              <p className="text-gray-600 mb-6 font-['Milliki',_sans-serif]">
                Your company registration has been submitted successfully. Our team will review your application and notify you once it's approved.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 font-['Milliki',_sans-serif]">
                  You will receive an email at
                </p>
                <p className="text-sm font-semibold text-gray-900 font-['Milliki',_sans-serif]">{getFullEmail()}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors font-medium font-['Milliki',_sans-serif]"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-['Milliki',_sans-serif]">
      {/* Left Side - Infographics */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-center font-['Milliki',_sans-serif]">
            Register Your Company
          </h1>
          <p className="text-xl text-white/80 mb-12 text-center max-w-md font-['Milliki',_sans-serif]">
            Join thousands of companies using our CMMS platform
          </p>

          {/* Benefits List */}
          <div className="space-y-6 w-full max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Secure Domain Verification</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Verify ownership of your company domain for enhanced security</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Multi-Tenant Architecture</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Invite your team with role-based access control</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Quick Setup</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">Get started in minutes with our intuitive onboarding</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 font-['Milliki',_sans-serif]">Enterprise Security</h3>
                <p className="text-sm text-white/70 font-['Milliki',_sans-serif]">SOC 2 compliant with encrypted data at rest</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm border border-white/20">
            <p className="text-sm text-white/90 italic mb-4 font-['Milliki',_sans-serif]">
              "This platform transformed how we manage maintenance. Our downtime decreased by 40% in the first quarter."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold font-['Milliki',_sans-serif]">JD</span>
              </div>
              <div>
                <p className="text-sm font-semibold font-['Milliki',_sans-serif]">James Davidson</p>
                <p className="text-xs text-white/70 font-['Milliki',_sans-serif]">Operations Director, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-['Milliki',_sans-serif]">Company Registration</h1>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className="flex items-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors font-['Milliki',_sans-serif] ${
                        stepNum <= step
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-500'
                      }`}
                    >
                      {stepNum < step ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span className="ml-2 text-xs font-medium text-gray-700 hidden sm:block font-['Milliki',_sans-serif]">
                      {stepNum === 1 && 'Company'}
                      {stepNum === 2 && 'Contact'}
                      {stepNum === 3 && 'Account'}
                      {stepNum === 4 && 'Verify'}
                    </span>
                  </div>
                  {stepNum < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        stepNum < step ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-['Milliki',_sans-serif]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Company Information */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 font-['Milliki',_sans-serif]">Company Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Company Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Organization Type *</label>
                    <select
                      name="organizationTypeCode"
                      value={formData.organizationTypeCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                    >
                      <option value="VENDOR">Vendor (Service Provider)</option>
                      <option value="CLIENT">Client (Service Consumer)</option>
                    </select>
                  </div>

                  {formData.organizationTypeCode === 'CLIENT' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-['Milliki',_sans-serif]">
                        <strong>Note:</strong> Client organizations require super-admin approval.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Company Website *</label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                      placeholder="https://example.com"
                    />
                    {extractedDomain && (
                      <p className="mt-1 text-sm text-gray-500 font-['Milliki',_sans-serif]">
                        Domain: <strong>{extractedDomain}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Industry *</label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                    >
                      <option value="">Select an industry</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 font-['Milliki',_sans-serif]">Contact Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Work Email *</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="emailPrefix"
                        value={formData.emailPrefix}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="yourname"
                      />
                      <span className="px-3 py-3 bg-gray-100 border-t border-b border-gray-300 text-gray-500 font-['Milliki',_sans-serif]">@</span>
                      <input
                        type="text"
                        name="emailDomain"
                        value={formData.emailDomain}
                        onChange={handleInputChange}
                        disabled={!!extractedDomain}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 font-['Milliki',_sans-serif]"
                        placeholder="company.com"
                      />
                    </div>
                    {getFullEmail() && (
                      <p className="mt-1 text-sm text-gray-500 font-['Milliki',_sans-serif]">Full email: <strong>{getFullEmail()}</strong></p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Phone Number *</label>
                    <div className="flex">
                      <div className="relative" ref={phoneCountryRef}>
                        <button
                          type="button"
                          onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                          className="flex items-center gap-2 px-3 py-3 border border-gray-300 rounded-l-xl bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 min-w-[110px] font-['Milliki',_sans-serif]"
                        >
                          <span className="text-lg">{selectedPhoneCountry?.flag}</span>
                          <span className="text-sm text-gray-700">{selectedPhoneCountry?.dialCode}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showPhoneCountryDropdown && (
                          <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search..."
                                value={phoneCountrySearch}
                                onChange={(e) => setPhoneCountrySearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-['Milliki',_sans-serif]"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredPhoneCountries.map(country => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => selectPhoneCountry(country)}
                                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-left font-['Milliki',_sans-serif]"
                                >
                                  <span className="text-lg">{country.flag}</span>
                                  <span className="flex-1 text-sm text-gray-900">{country.name}</span>
                                  <span className="text-sm text-gray-500">{country.dialCode}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">State/Province *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div ref={countryRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Country *</label>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 text-left font-['Milliki',_sans-serif]"
                      >
                        {formData.country ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{COUNTRIES.find(c => c.name === formData.country)?.flag}</span>
                            <span className="text-gray-900 text-sm">{formData.country}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Select country</span>
                        )}
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-['Milliki',_sans-serif]"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCountries.map(country => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => selectCountry(country)}
                                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-left font-['Milliki',_sans-serif]"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm text-gray-900">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Account Setup */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 font-['Milliki',_sans-serif]">Admin Account Setup</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Milliki',_sans-serif]">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-['Milliki',_sans-serif]"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="termsAccepted" className="text-sm text-gray-700 font-['Milliki',_sans-serif]">
                      I accept the{' '}
                      <a href="/terms" className="text-indigo-600 hover:underline">Terms and Conditions</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Domain Verification */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 font-['Milliki',_sans-serif]">Domain Verification</h2>

                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-sm text-indigo-800 mb-3 font-['Milliki',_sans-serif]">
                      To verify ownership of <strong>{extractedDomain}</strong>:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700 font-['Milliki',_sans-serif]">
                      <li>Create a file with the content below</li>
                      <li>Upload to: <code className="bg-indigo-100 px-1 rounded">https://{extractedDomain}/{verificationFileName}</code></li>
                      <li>Click "Verify Domain"</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2 font-['Milliki',_sans-serif]">File Name</h3>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-gray-600 bg-white px-3 py-2 border rounded-lg font-mono">{verificationFileName}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(verificationFileName)}
                          className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 font-['Milliki',_sans-serif]"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2 font-['Milliki',_sans-serif]">File Content</h3>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-gray-600 bg-white px-3 py-2 border rounded-lg break-all font-mono">{verificationToken}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(verificationToken)}
                          className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 font-['Milliki',_sans-serif]"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={verificationStatus === 'verifying' || verificationStatus === 'verified'}
                    className={`w-full px-6 py-3 rounded-xl font-medium transition-colors font-['Milliki',_sans-serif] ${
                      verificationStatus === 'verified'
                        ? 'bg-emerald-600 text-white'
                        : verificationStatus === 'verifying'
                        ? 'bg-gray-400 text-white cursor-wait'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {verificationStatus === 'verifying' && (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying...
                      </span>
                    )}
                    {verificationStatus === 'verified' && (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Domain Verified
                      </span>
                    )}
                    {(verificationStatus === 'pending' || verificationStatus === 'failed') && 'Verify Domain'}
                  </button>

                  {verificationStatus === 'failed' && retryCount > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-semibold font-['Milliki',_sans-serif]">Verification failed</p>
                      <ul className="list-disc list-inside mt-2 text-sm text-amber-700 space-y-1 font-['Milliki',_sans-serif]">
                        <li>Ensure file is at the correct location</li>
                        <li>File contains exactly the token above</li>
                        <li>File is publicly accessible</li>
                      </ul>
                    </div>
                  )}

                  {verificationStatus !== 'verified' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-600 font-['Milliki',_sans-serif]">
                        <strong>Skip verification?</strong> You can proceed without verification, but your company will remain in "pending" status.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium font-['Milliki',_sans-serif]"
                  >
                    Back
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium font-['Milliki',_sans-serif]"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed font-['Milliki',_sans-serif]"
                  >
                    {loading ? 'Submitting...' : 'Submit Registration'}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-['Milliki',_sans-serif]">
                Already have an account?{' '}
                <a href="/login" className="text-indigo-600 hover:underline font-medium font-['Milliki',_sans-serif]">Sign in</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
