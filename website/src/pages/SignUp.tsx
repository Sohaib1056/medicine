import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, Shield, CheckCircle, FileText, Check, ArrowLeft } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    gender: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    receiveOffers: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailValid, setEmailValid] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#E53935', '#FF6F00', '#FFC107', '#00A651'];

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!emailValid) newErrors.email = 'Please enter a valid email';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Submit form
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8F0] to-[#D0F0E4] flex flex-col">
      {/* Simplified Header */}
      <div className="bg-[#00A651] text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <span>📞 +92-300-1234567</span>
            <span>📍 Karachi, Pakistan</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Track Order</span>
            <span>Help & Support</span>
          </div>
        </div>
      </div>

      {/* White Header with Logo and Back Button */}
      <div className="bg-white py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Back Button */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-[#666666] hover:text-[#00A651] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="w-10 h-10 bg-[#00A651] rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">MediCare</span>
          </Link>

          {/* Empty div for spacing */}
          <div className="w-32"></div>
        </div>
      </div>

      {/* Main Content - Centered Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px]">
          {/* Register Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,166,81,0.12)] p-10">
            {/* Logo Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#00A651] rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl font-bold">M</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-[#1A1A1A] text-center mb-2">
              Create Your Account
            </h1>
            <p className="text-[13px] text-[#666666] text-center mb-6">
              Join 500,000+ Pakistanis who trust MediCare
            </p>

            {/* Google Sign Up Button */}
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-[#E0E0E0] rounded-lg hover:bg-gray-50 transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[#1A1A1A] font-medium">Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0E0E0]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#666666]">OR</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ahmed"
                    className={`w-full h-11 px-4 border ${errors.firstName ? 'border-[#E53935]' : 'border-[#E0E0E0]'} rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                  />
                  {errors.firstName && <p className="text-[#E53935] text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Khan"
                    className={`w-full h-11 px-4 border ${errors.lastName ? 'border-[#E53935]' : 'border-[#E0E0E0]'} rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                  />
                  {errors.lastName && <p className="text-[#E53935] text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Row 2: Email */}
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder="ahmed@example.com"
                    className={`w-full h-11 pl-10 pr-10 border ${errors.email ? 'border-[#E53935]' : emailValid ? 'border-[#00A651]' : 'border-[#E0E0E0]'} rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                  />
                  {emailValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00A651]">
                      <Check size={18} />
                    </div>
                  )}
                </div>
                {errors.email && <p className="text-[#E53935] text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Row 3: Phone Number */}
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                  Phone Number
                </label>
                <div className="relative flex">
                  <div className="flex items-center gap-2 px-3 bg-gray-100 border border-r-0 border-[#E0E0E0] rounded-l-lg">
                    <span>🇵🇰</span>
                    <span className="text-[#666666] text-sm">+92</span>
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="3XX-XXXXXXX"
                    className={`flex-1 h-11 px-4 border ${errors.phone ? 'border-[#E53935]' : 'border-[#E0E0E0]'} rounded-r-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                  />
                </div>
                {errors.phone && <p className="text-[#E53935] text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Row 4: City & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    City
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all bg-white"
                  >
                    <option value="">Select City</option>
                    <option value="karachi">Karachi</option>
                    <option value="lahore">Lahore</option>
                    <option value="islamabad">Islamabad</option>
                    <option value="rawalpindi">Rawalpindi</option>
                    <option value="peshawar">Peshawar</option>
                    <option value="quetta">Quetta</option>
                    <option value="multan">Multan</option>
                    <option value="faisalabad">Faisalabad</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    Gender <span className="text-[#666666] font-normal">(optional)</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className={`w-full h-11 pl-10 pr-10 border ${errors.password ? 'border-[#E53935]' : 'border-[#E0E0E0]'} rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#00A651] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[#E53935] text-xs mt-1">{errors.password}</p>}
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className="h-2 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: index < passwordStrength ? strengthColors[passwordStrength - 1] : '#E0E0E0'
                            }}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strengthColors[passwordStrength - 1] || '#666666' }}>
                        {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Enter password'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className={`w-full h-11 pl-10 pr-10 border ${errors.confirmPassword ? 'border-[#E53935]' : 'border-[#E0E0E0]'} rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-[3px] focus:ring-[#00A651]/15 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#00A651] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[#E53935] text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-[#00A651] border-[#E0E0E0] rounded focus:ring-[#00A651]"
                  />
                  <span className="text-xs text-[#666666]">
                    I agree to the{' '}
                    <Link to="/terms" className="text-[#00A651] hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-[#00A651] hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-[#E53935] text-xs">{errors.agreeTerms}</p>}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receiveOffers}
                    onChange={(e) => setFormData({ ...formData, receiveOffers: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-[#00A651] border-[#E0E0E0] rounded focus:ring-[#00A651]"
                  />
                  <span className="text-xs text-[#666666]">
                    I want to receive health tips and exclusive offers via WhatsApp/SMS
                  </span>
                </label>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full h-12 bg-[#00A651] text-white font-bold text-[15px] rounded-lg hover:bg-[#009644] transition-colors shadow-lg hover:shadow-xl mt-6"
              >
                Create Account
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <span className="text-[13px] text-[#666666]">Already have an account? </span>
              <Link
                to="/signin"
                className="text-[13px] text-[#00A651] hover:text-[#008f47] font-bold transition-colors"
              >
                Sign In →
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-[#E0E0E0] my-6"></div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <Shield size={20} className="text-[#666666]" />
                <span className="text-[11px] text-[#666666]">100% Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle size={20} className="text-[#666666]" />
                <span className="text-[11px] text-[#666666]">Verified Pharmacy</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <FileText size={20} className="text-[#666666]" />
                <span className="text-[11px] text-[#666666]">Licensed by DRAP</span>
              </div>
            </div>
          </div>

          {/* Terms & Privacy */}
          <p className="text-center text-[11px] text-[#666666] mt-6">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-[#00A651] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#00A651] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="py-4 text-center">
        <p className="text-[11px] text-[#666666]">© 2026 MediCare Pakistan</p>
      </div>
    </div>
  );
};

export default SignUp;
