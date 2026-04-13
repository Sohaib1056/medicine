import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, Shield, CheckCircle, FileText, ArrowLeft } from 'lucide-react';

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation logic here
    if (!phoneOrEmail || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Navigate to home or dashboard
    navigate('/');
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
        <div className="w-full max-w-[440px]">
          {/* Sign In Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,166,81,0.12)] p-10">
            {/* Logo Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#00A651] rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl font-bold">M</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-[#1A1A1A] text-center mb-2">
              Welcome Back!
            </h1>
            <p className="text-[13px] text-[#666666] text-center mb-6">
              Sign in to your MediCare account
            </p>

            {/* Google Sign In Button */}
            <button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-[#E0E0E0] rounded-lg hover:bg-gray-50 transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-[#1A1A1A] font-medium">Continue with Google</span>
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
              {/* Phone/Email Field */}
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A1A] mb-2">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                    <Phone size={18} />
                  </div>
                  <input
                    type="text"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="03XX-XXXXXXX or email@example.com"
                    className={`w-full h-11 pl-10 pr-4 border ${
                      error ? 'border-[#E53935]' : 'border-[#E0E0E0]'
                    } rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/10 transition-all`}
                  />
                </div>
              </div>

              {/* Password Field */}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full h-11 pl-10 pr-10 border ${
                      error ? 'border-[#E53935]' : 'border-[#E0E0E0]'
                    } rounded-lg focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/10 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#00A651] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && (
                  <p className="text-[#E53935] text-xs mt-1">{error}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#00A651] border-[#E0E0E0] rounded focus:ring-[#00A651]"
                  />
                  <span className="text-xs text-[#666666]">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#00A651] hover:text-[#008f47] font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full h-12 bg-[#00A651] text-white font-bold text-[15px] rounded-lg hover:bg-[#009644] transition-colors shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-6">
              <span className="text-[13px] text-[#666666]">Don't have an account? </span>
              <Link
                to="/signup"
                className="text-[13px] text-[#00A651] hover:text-[#008f47] font-bold transition-colors"
              >
                Create Account →
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
            By signing in, you agree to our{' '}
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

export default SignIn;
