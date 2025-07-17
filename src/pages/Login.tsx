import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryErrors, setRecoveryErrors] = useState<{ email?: string; general?: string }>({});
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      // 실제 로그인 로직 (localStorage)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((user: any) => user.email === formData.email && user.password === formData.password);
      if (!user) {
        setErrors({ general: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        return;
      }
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', user.email);
      
      // 커스텀 이벤트 발생 (Header 컴포넌트에 로그인 상태 변경 알림)
      window.dispatchEvent(new Event('loginStateChanged'));
      
      alert('로그인 성공!');
      navigate('/');
    }
  };

  // 비밀번호 찾기 폼 검증
  const validateRecoveryForm = () => {
    const newErrors: { email?: string } = {};
    if (!recoveryEmail) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(recoveryEmail)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    setRecoveryErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 비밀번호 찾기 제출
  const handleRecoverySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateRecoveryForm()) {
      // 실제 비밀번호 찾기 로직 (localStorage)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((user: any) => user.email === recoveryEmail);
      
      if (!user) {
        setRecoveryErrors({ general: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' });
        return;
      }

      // 비밀번호 재설정 (실제로는 이메일 발송 로직이 들어가야 함)
      const newPassword = Math.random().toString(36).slice(-8); // 임시 비밀번호 생성
      const updatedUsers = users.map((u: any) => {
        if (u.email === recoveryEmail) {
          return { ...u, password: newPassword };
        }
        return u;
      });
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setRecoverySuccess(true);
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setShowPasswordRecovery(false);
        setRecoveryEmail('');
        setRecoveryErrors({});
        setRecoverySuccess(false);
      }, 3000);
    }
  };

  // 비밀번호 찾기 모달 닫기
  const closeRecoveryModal = () => {
    setShowPasswordRecovery(false);
    setRecoveryEmail('');
    setRecoveryErrors({});
    setRecoverySuccess(false);
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  errors.email ? 'border-red-500 text-xs' : 'border-gray-300 text-xs'
                }`}
                placeholder="example@email.com"
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
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                    errors.password ? 'border-red-500 text-xs' : 'border-gray-300 text-xs'
                  }`}
                  placeholder="비밀번호를 입력해주세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
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
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}

              {/* Password Recovery Link */}
              <div className="mt-2 text-left flex flex-row justify-start gap-2">
                <p className="text-xs text-gray-600">비밀번호를 잊으셨나요?</p>
                <button
                  type="button"
                  onClick={() => setShowPasswordRecovery(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  비밀번호 찾기
                </button>
              </div>

            </div>

            {/* General Error */}
            {errors.general && <p className="mt-0 text-xs text-red-600 text-left">{errors.general}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-300"
            >
              로그인
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      {showPasswordRecovery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">비밀번호 찾기</h2>
              <button
                onClick={closeRecoveryModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!recoverySuccess ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  가입하신 이메일 주소를 입력하시면 임시 비밀번호를 발급해드립니다.
                </p>
                
                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="recovery-email" className="block text-xs font-semibold text-gray-700 mb-1">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      id="recovery-email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                        recoveryErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {recoveryErrors.email && <p className="mt-1 text-xs text-red-600">{recoveryErrors.email}</p>}
                  </div>

                  {recoveryErrors.general && (
                    <p className="text-xs text-red-600">{recoveryErrors.general}</p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={closeRecoveryModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-300"
                    >
                      비밀번호 찾기
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">비밀번호가 재설정되었습니다</h3>
                <p className="text-sm text-gray-600 mb-4">
                  새로운 임시 비밀번호가 발급되었습니다.<br />
                  로그인 후 비밀번호를 변경해주세요.
                </p>
                <button
                  onClick={closeRecoveryModal}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold transition-colors"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login; 