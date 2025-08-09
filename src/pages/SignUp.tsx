import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignUpForm, FormErrors } from '../types/index';
import { authAPI } from '../services/api';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<SignUpForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });

  const [confirmPasswordMatch, setConfirmPasswordMatch] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Calculate password strength
  const getPasswordStrength = () => {
    const metRequirements = Object.values(passwordRequirements).filter(Boolean).length;
    if (metRequirements <= 2) return { level: 'weak', text: '약함', color: 'red' };
    if (metRequirements === 4) return { level: 'medium', text: '가입가능', color: 'orange' };
    if (metRequirements === 5) return { level: 'strong', text: '완벽', color: 'green' };
    return { level: 'weak', text: '약함', color: 'red' };
  };

  const passwordStrength = getPasswordStrength();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Password requirements check
    if (name === 'password') {
      setPasswordRequirements({
        length: value.length >= 8,
        lowercase: /(?=.*[a-z])/.test(value),
        uppercase: /(?=.*[A-Z])/.test(value),
        number: /(?=.*\d)/.test(value),
        special: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)
      });
      
      // Check confirm password match
      if (formData.confirmPassword) {
        setConfirmPasswordMatch(value === formData.confirmPassword);
      }
    }

    // Confirm password match check
    if (name === 'confirmPassword') {
      setConfirmPasswordMatch(value === formData.password);
    }
  };

  const validateForm = (): boolean => {
    console.log('=== 폼 검증 시작 ===');
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
      console.log('이름 누락');
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요.';
      console.log('이름 길이 부족');
    } else {
      console.log('이름 검증 통과');
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
      console.log('이메일 누락');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
      console.log('이메일 형식 오류');
    } else {
      console.log('이메일 검증 통과');
    }

    // Password validation
    const metRequirements = Object.values(passwordRequirements).filter(Boolean).length;
    console.log('비밀번호 요구사항 충족 개수:', metRequirements);
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
      console.log('비밀번호 누락');
    } else if (metRequirements < 4) {
      newErrors.password = '비밀번호는 5개 중 4개 이상의 조건을 만족해야 합니다.';
      console.log('비밀번호 요구사항 부족');
    } else {
      console.log('비밀번호 검증 통과');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
      console.log('비밀번호 확인 누락');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      console.log('비밀번호 불일치');
    } else {
      console.log('비밀번호 확인 검증 통과');
    }

    // Terms agreement validation
    if (!formData.agreeTerms) {
      console.log('이용약관 미동의');
      alert('이용약관에 동의해주세요.');
      return false;
    } else {
      console.log('이용약관 동의 확인');
    }

    if (!formData.agreePrivacy) {
      console.log('개인정보처리방침 미동의');
      alert('개인정보처리방침에 동의해주세요.');
      return false;
    } else {
      console.log('개인정보처리방침 동의 확인');
    }

    console.log('최종 검증 결과:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('폼 검증 최종 결과:', isValid ? '통과' : '실패');
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log('=== 회원가입 폼 제출 시작 ===');
    console.log('폼 데이터:', formData);
    console.log('비밀번호 요구사항:', passwordRequirements);
    console.log('비밀번호 강도:', passwordStrength);
    
    if (validateForm()) {
      console.log('폼 검증 통과! 회원가입 로직 실행');
      setIsSubmitting(true);
      
      // 백엔드 API에 맞는 데이터 구조로 변환
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: '' // 전화번호는 선택사항
      };
      
      authAPI.register(userData)
        .then((response: any) => {
          console.log('회원가입 성공:', response);
          alert('회원가입이 완료되었습니다.\n\n입력하신 이메일로 인증 메일을 보냈습니다.\n메일함에서 인증을 완료하신 후 로그인해주세요.');
          navigate('/login');
        })
        .catch((error: any) => {
          console.error('회원가입 실패:', error);
          if (error.response && error.response.data) {
            setErrors({ email: error.response.data.message || '회원가입에 실패했습니다.' });
          } else {
            setErrors({ email: '회원가입에 실패했습니다.' });
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      console.log('폼 검증 실패! 회원가입 중단');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/images/icon_admore.png" alt="애드모어" className="w-12 h-12" />
            </div>
            <p className="text-gray-600 text-base font-semibold">애드모어에 오신 것을 환영합니다</p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                이름(닉네임) *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="이름 또는 닉네임을 입력해주세요"
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
                disabled={isSubmitting}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                비밀번호 *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    errors.password ? 'border-red-500 text-xs' : 'border-gray-300 text-xs'
                  }`}
                  placeholder="비밀번호를 입력해주세요"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">비밀번호 강도</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        passwordStrength.color === 'red' ? 'text-red-600' : 
                        passwordStrength.color === 'orange' ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.text}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({Object.values(passwordRequirements).filter(Boolean).length}/5)
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500 text-xs' : 
                        passwordStrength.color === 'orange' ? 'bg-orange-500 text-xs' : 'bg-green-500 text-xs'
                      }`}
                      style={{ 
                        width: `${(Object.values(passwordRequirements).filter(Boolean).length / 5) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Requirements Status */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${passwordRequirements.length ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      8자 이상
                    </div>
                    <div className={`flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${passwordRequirements.lowercase ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      소문자
                    </div>
                    <div className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${passwordRequirements.uppercase ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      대문자
                    </div>
                    <div className={`flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${passwordRequirements.number ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      숫자
                    </div>
                    <div className={`flex items-center ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${passwordRequirements.special ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      특수문자
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">
                비밀번호 확인 *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    errors.confirmPassword ? 'border-red-500' : confirmPasswordMatch === false ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="비밀번호를 다시 입력해주세요"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              {confirmPasswordMatch === false && formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">비밀번호가 일치하지 않습니다.</p>
              )}
              {confirmPasswordMatch === true && formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600">비밀번호가 일치합니다.</p>
              )}
            </div>

            {/* Agreements */}
            <div className="space-y-2 pb-4">
              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="appearance-none h-4 w-4 border border-gray-300 rounded bg-white 
                        checked:bg-orange-600 checked:border-orange-600 
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 relative"
                    disabled={isSubmitting}
                  />
                  {formData.agreeTerms && (
                    <svg className="absolute top-[0px] left-0 h-4 w-4 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <label htmlFor="agreeTerms" className="ml-2 block text-xs text-gray-700 font-semibold">
                  <button 
                  type="button"
                  onClick={() => window.open('/terms', '_blank')}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  이용약관
                </button>에 동의합니다 *
                </label>
              </div>

              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleChange}
                    className="appearance-none h-4 w-4 border border-gray-300 rounded bg-white checked:bg-orange-600 checked:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 relative"
                    disabled={isSubmitting}
                  />
                  {formData.agreePrivacy && (
                    <svg className="absolute top-[0px] left-0 h-4 w-4 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <label htmlFor="agreePrivacy" className="ml-2 block text-xs text-gray-700 font-semibold">
                  <button 
                  type="button"
                  onClick={() => window.open('/privacy', '_blank')}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  개인정보처리방침
                </button>에 동의합니다 *
                </label>
              </div>

              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    id="agreeMarketing"
                    name="agreeMarketing"
                    checked={formData.agreeMarketing}
                    onChange={handleChange}
                    className="appearance-none h-4 w-4 border border-gray-300 rounded bg-white checked:bg-orange-600 checked:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 relative"
                    disabled={isSubmitting}
                  />
                  {formData.agreeMarketing && (
                    <svg className="absolute top-[0px] left-0 h-4 w-4 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <label htmlFor="agreeMarketing" className="ml-2 block text-xs text-gray-700 font-semibold">
                  마케팅 정보 수신에 동의합니다 (선택)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? '회원가입 중...' : '회원가입'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                로그인하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 