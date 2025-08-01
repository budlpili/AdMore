import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);
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
      setIsSubmitting(true);
      authAPI.login(formData.email, formData.password)
        .then((response: any) => {
          console.log('로그인 응답:', response);
          if (response.token) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', response.user.email);
            localStorage.setItem('token', response.token);
            // 커스텀 이벤트 발생 (Header 컴포넌트에 로그인 상태 변경 알림)
            window.dispatchEvent(new Event('loginStateChanged'));
            alert('로그인 성공!');
            navigate('/');
          } else {
            setErrors({ general: response.message || '로그인에 실패했습니다.' });
          }
        })
        .catch((error: any) => {
          console.error('로그인 오류:', error);
          // 더 자세한 에러 메시지 처리
          if (error.response && error.response.data) {
            setErrors({ general: error.response.data.message || '로그인에 실패했습니다.' });
          } else if (error.message) {
            setErrors({ general: error.message });
          } else {
            setErrors({ general: '이메일 또는 비밀번호가 올바르지 않습니다.' });
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        });
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
      // 비밀번호 찾기 기능은 아직 구현되지 않음
      setShowRecoveryMessage(true);
    }
  };

  // 비밀번호 찾기 모달 닫기
  const closeRecoveryModal = () => {
    setShowPasswordRecovery(false);
    setRecoveryEmail('');
    setRecoveryErrors({});
    setRecoverySuccess(false);
    setShowRecoveryMessage(false);
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
                  type={showPassword ? 'text' : 'password'}
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
            {errors.general && (
              <div className="mt-0 text-xs text-red-600 text-left">
                <p>{errors.general}</p>
                {(errors.general.includes('비활성화된 계정') || errors.general.includes('정지된 계정')) && (
                  <button
                    type="button"
                    onClick={() => {
                      const subject = encodeURIComponent('계정 상태 문의');
                      const body = encodeURIComponent(`안녕하세요,\n\n계정 상태에 대해 문의드립니다.\n\n이메일: ${formData.email}\n\n문의 내용:\n\n감사합니다.`);
                      window.open(`mailto:info@ilmare.com?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="mt-2 inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    관리자에게 문의하기
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
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

            {!recoverySuccess && !showRecoveryMessage ? (
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-300"
                      disabled={isSubmitting}
                    >
                      비밀번호 찾기
                    </button>
                  </div>
                </form>
              </>
            ) : showRecoveryMessage ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">비밀번호 찾기 기능 준비 중</h3>
                <p className="text-sm text-gray-600 mb-4">
                  비밀번호 찾기 기능은 현재 준비 중입니다.<br />
                  관리자에게 문의해주세요.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent('비밀번호 찾기 문의');
                      const body = encodeURIComponent(`안녕하세요,\n\n비밀번호 찾기에 대해 문의드립니다.\n\n이메일: ${recoveryEmail}\n\n문의 내용:\n\n감사합니다.`);
                      window.open(`mailto:info@ilmare.com?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    관리자에게 문의하기
                  </button>
                  <button
                    onClick={closeRecoveryModal}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
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