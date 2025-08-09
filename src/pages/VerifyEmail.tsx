import React, { useEffect, useState } from 'react';

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState<string>('이메일 인증을 확인하는 중입니다...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('토큰이 없습니다. 링크를 다시 확인해주세요.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage('이메일 인증이 완료되었습니다. 로그인해주세요.');
          setTimeout(() => { window.location.href = '/login'; }, 1500);
        } else {
          setStatus('error');
          setMessage(data.message || '인증에 실패했습니다. 토큰이 만료되었을 수 있습니다.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
        <img src="/images/icon_admore.png" alt="애드모어" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-lg font-semibold mb-2">이메일 인증</h1>
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>{message}</p>
        {status !== 'success' && (
          <button className="mt-6 text-sm text-blue-600 hover:underline" onClick={() => (window.location.href = '/login')}>로그인으로 이동</button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

