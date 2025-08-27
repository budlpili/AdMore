import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  inquiryType?: 'product' | 'payment_cancellation';
  productInfo?: string;
  paymentInfo?: {
    paymentNumber: string;
    productName: string;
    amount: string;
    paymentDate: string;
  };
  status?: 'pending' | 'answered' | 'closed';
  file?: string | null;
  fileName?: string;
  fileType?: string;
}

interface UseWebSocketProps {
  userEmail?: string;
  isAdmin?: boolean;
  onNewMessage?: (message: ChatMessage) => void;
  onStatusUpdate?: (data: { userEmail: string; status: string }) => void;
  onUserConnected?: (userEmail: string) => void;
  onUserDisconnected?: (userEmail: string) => void;
}

export const useWebSocket = ({
  userEmail,
  isAdmin = false,
  onNewMessage,
  onStatusUpdate,
  onUserConnected,
  onUserDisconnected
}: UseWebSocketProps) => {
  // userEmail에서 관리자 여부 자동 판단
  const effectiveIsAdmin = isAdmin || (userEmail && userEmail.includes('admin'));
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptedRef = useRef(false);

  // WebSocket 연결
  const connect = useCallback(() => {
    // 이미 연결된 소켓이 있으면 해제
    if (socketRef.current) {
      console.log('🔌 기존 소켓 연결 해제');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 현재 접속한 URL을 기반으로 WebSocket URL 설정
    const currentHost = window.location.hostname;
    const wsUrl = currentHost === 'localhost' || currentHost === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://port-0-admore-me83wyv0a5a64d5a.sel5.cloudtype.app';
    
    console.log('🚀 WebSocket 연결 시도:', wsUrl);
    connectionAttemptedRef.current = true;

    const socket = io(wsUrl, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      timeout: 15000,
      reconnection: false, // 자동 재연결 비활성화
      forceNew: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket 연결 성공! Socket ID:', socket.id);
      setIsConnected(true);
      connectionAttemptedRef.current = false;
      
      // 사용자 또는 관리자 로그인
      if (effectiveIsAdmin) {
        console.log('관리자 로그인 이벤트 전송');
        socket.emit('admin_login');
      } else if (userEmail) {
        console.log('사용자 로그인 이벤트 전송:', userEmail);
        socket.emit('user_login', userEmail);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket 연결 오류:', error.message);
      setIsConnected(false);
      connectionAttemptedRef.current = false;
      
      // 3초 후 재연결 시도
      setTimeout(() => {
        if (!connectionAttemptedRef.current) {
          console.log('🔄 연결 오류 후 재연결 시도...');
          connect();
        }
      }, 3000);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket 연결 해제:', reason);
      setIsConnected(false);
      connectionAttemptedRef.current = false;
      
      // 연결 해제 후 재연결 시도 (의도적인 연결 해제가 아닌 경우)
      if (reason !== 'io client disconnect') {
        setTimeout(() => {
          if (!connectionAttemptedRef.current) {
            console.log('🔄 연결 해제 후 재연결 시도...');
            connect();
          }
        }, 2000);
      }
    });

    // 항상 소켓 반환
    return socket;
  }, [userEmail, effectiveIsAdmin]);

  // 메시지 전송
  const sendMessage = useCallback((messageData: {
    message: string;
    type: 'user' | 'admin';
    inquiryType?: 'product' | 'payment_cancellation';
    productInfo?: string;
    paymentInfo?: {
      paymentNumber: string;
      productName: string;
      amount: string;
      paymentDate: string;
    };
    targetUserEmail?: string; // 관리자 메시지의 대상 사용자 이메일
    file?: string | null;
    fileName?: string;
    fileType?: string;

  }) => {
    // 연결 상태 확인 및 자동 연결 시도
    if (!socketRef.current || !socketRef.current.connected) {
      console.log('🔄 WebSocket이 연결되지 않았습니다. 연결을 시도합니다...');
      
      // 연결 시도 중이 아니면 연결 시도
      if (!connectionAttemptedRef.current) {
        connect();
      }
      
      // 연결 대기 후 재시도 (무한 재귀 방지)
      setTimeout(() => {
        if (socketRef.current?.connected) {
          console.log('✅ 연결 성공! 메시지 전송을 재시도합니다.');
          // 무한 재귀 방지를 위해 직접 emit
          const data = {
            userEmail: isAdmin ? (messageData.targetUserEmail || 'admin') : userEmail,
            ...messageData
          };
          socketRef.current.emit('send_message', data);
          
          // 로컬 상태 업데이트
          if (onNewMessage) {
            const localMessage = {
              id: Date.now().toString(),
              user: isAdmin ? (messageData.targetUserEmail || 'admin') : (userEmail || 'unknown'),
              message: data.message,
              type: data.type,
              timestamp: new Date().toISOString(),
              file: data.file,
              fileName: data.fileName,
              fileType: data.fileType
            };
            console.log('📨 로컬 메시지 추가:', localMessage);
            onNewMessage(localMessage);
          }
        } else {
          console.error('❌ WebSocket 연결 실패로 메시지 전송이 불가능합니다.');
        }
      }, 2000);
      
      return;
    }

    // 관리자 모드가 아닐 때만 userEmail 체크
    if (!isAdmin && !userEmail) {
      console.error('사용자 이메일이 없습니다.');
      return;
    }

    const data = {
      userEmail: isAdmin ? (messageData.targetUserEmail || 'admin') : userEmail,
      ...messageData
    };

    console.log('📤 메시지 전송:', data);
    socketRef.current.emit('send_message', data);
    
    // 메시지 전송 성공 시 로컬 상태 업데이트
    if (onNewMessage) {
      const localMessage = {
        id: Date.now().toString(),
        user: isAdmin ? (messageData.targetUserEmail || 'admin') : (userEmail || 'unknown'),
        message: data.message,
        type: data.type,
        timestamp: new Date().toISOString(),
        file: data.file,
        fileName: data.fileName,
        fileType: data.fileType
      };
      console.log('📨 로컬 메시지 추가:', localMessage);
      onNewMessage(localMessage);
    }
  }, [userEmail, isAdmin, onNewMessage]);

  // 메시지 상태 업데이트
  const updateMessageStatus = useCallback((status: 'pending' | 'answered' | 'closed') => {
    if (!socketRef.current?.connected || (!isAdmin && !userEmail)) {
      console.error('WebSocket이 연결되지 않았거나 사용자 이메일이 없습니다.');
      return;
    }

    socketRef.current.emit('update_message_status', { 
      userEmail: isAdmin ? 'admin' : userEmail, 
      status 
    });
  }, [userEmail, isAdmin]);

  // 기존 메시지 로드
  const loadMessages = useCallback(async () => {
    try {
      // 새로운 세션인 경우 메시지를 로드하지 않음
      if (userEmail && userEmail.includes('_session_')) {
        return;
      }
      
      // console.log('기존 메시지 로드 중...');
      const response = await fetch('http://localhost:5001/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        // console.log('로드된 메시지:', data);
        // userEmail 필드를 user로 매핑, id는 문자열로 변환
        const formattedData = data.map((message: any) => ({
          ...message,
          user: message.userEmail || message.user,
          id: String(message.id)
        }));
        
        // 관리자가 아닌 경우 현재 사용자의 메시지만 필터링
        if (!effectiveIsAdmin && userEmail) {
          const currentUserEmail = userEmail.split('_')[0];
          const userMessages = formattedData.filter((message: any) => {
            const messageUserEmail = message.user.split('_')[0];
            return messageUserEmail === currentUserEmail || message.type === 'admin';
          });
          setMessages(userMessages);
        } else {
          setMessages(formattedData);
        }
      } else {
        console.error('메시지 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  }, [effectiveIsAdmin, userEmail]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      connectionAttemptedRef.current = false;
    }
  }, []);

  useEffect(() => {
    // userEmail이 없으면 연결하지 않음
    if (!userEmail) {
      return;
    }

    // 이미 연결된 소켓이 있으면 건너뜀
    if (socketRef.current?.connected) {
      console.log('✅ 이미 연결된 소켓이 있습니다.');
      return;
    }

    // 연결 시도 중이면 건너뜀
    if (connectionAttemptedRef.current) {
      console.log('⏳ 이미 연결 시도 중입니다. 대기 중...');
      return;
    }

    console.log('🚀 WebSocket 연결 시작 - userEmail:', userEmail);
    connectionAttemptedRef.current = true;

    // 기존 소켓이 있으면 연결 해제
    if (socketRef.current) {
      console.log('🔌 기존 소켓 연결 해제 후 재연결');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = connect();
    
    // socket이 undefined인 경우 처리
    if (!socket) {
      console.error('❌ WebSocket 연결 실패');
      connectionAttemptedRef.current = false;
      return;
    }
    
    // 이벤트 리스너 등록 전에 기존 리스너 제거
    socket.off('new_message');
    socket.off('message_status_updated');
    socket.off('user_connected');
    socket.off('user_disconnected');
    socket.off('message_error');

    // 새 메시지 수신
    socket.on('new_message', (message) => {
      console.log('📨 새 메시지 수신:', message);
      if (onNewMessage) {
        onNewMessage(message);
      }
    });

    // 메시지 상태 업데이트
    socket.on('message_status_updated', (data) => {
      console.log('📊 메시지 상태 업데이트:', data);
      if (onStatusUpdate) {
        onStatusUpdate(data);
      }
    });

    // 사용자 연결
    socket.on('user_connected', (userEmail) => {
      console.log('👤 사용자 연결:', userEmail);
      if (onUserConnected) {
        onUserConnected(userEmail);
      }
    });

    // 사용자 연결 해제
    socket.on('user_disconnected', (userEmail) => {
      console.log('👤 사용자 연결 해제:', userEmail);
      if (onUserDisconnected) {
        onUserDisconnected(userEmail);
      }
    });

    // 메시지 오류
    socket.on('message_error', (error) => {
      console.error('❌ 메시지 오류:', error);
    });

    // cleanup 함수는 컴포넌트 언마운트 시에만 실행
    return () => {
      // 컴포넌트 언마운트 시에만 연결 해제
      console.log('🔌 컴포넌트 언마운트 시 연결 해제');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      connectionAttemptedRef.current = false;
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  return {
    isConnected,
    messages,
    wsMessages: messages, // wsMessages 별칭 추가
    sendMessage,
    updateMessageStatus,
    loadMessages,
    disconnect,
    socket: socketRef.current
  };
}; 