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
    
    // 연결 시도 중이면 대기
    if (connectionAttemptedRef.current) {
      console.log('⏳ 이미 연결 시도 중입니다. 대기 중...');
      return;
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
      console.error('연결 시도 URL:', wsUrl);
      console.error('사용자 이메일:', userEmail);
      setIsConnected(false);
      connectionAttemptedRef.current = false;
      
      // 연결 오류 시 5초 후 재시도 (무한 루프 방지)
      setTimeout(() => {
        if (!connectionAttemptedRef.current && !socketRef.current?.connected) {
          console.log('🔄 5초 후 재연결 시도...');
          connect();
        }
      }, 5000);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      connectionAttemptedRef.current = false;
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      // 재연결 오류 시 추가 처리 없음
    });

    socket.on('reconnect_failed', () => {
      setIsConnected(false);
      connectionAttemptedRef.current = false;
    });

    socket.on('new_message', (message: any) => {
      // userEmail 필드를 user로 매핑, id는 문자열로 변환
      const formattedMessage = {
        ...message,
        user: message.userEmail || message.user,
        id: String(message.id),
        file: message.file || null,
        fileName: message.fileName || undefined,
        fileType: message.fileType || undefined
      };
      
      // 관리자가 아닌 경우 현재 사용자의 메시지만 추가
      if (!isAdmin && userEmail) {
        // 이메일 부분만 비교 (세션 ID 제외)
        const currentUserEmail = userEmail.split('_')[0];
        const messageUserEmail = formattedMessage.user.split('_')[0];
        
        if (messageUserEmail === currentUserEmail || formattedMessage.type === 'admin') {
          setMessages(prev => {
            // 중복 메시지 체크
            const isDuplicate = prev.some(msg => msg.id === formattedMessage.id);
            if (isDuplicate) {
              return prev;
            }
            const newMessages = [...prev, formattedMessage];
            // onNewMessage 콜백 호출 (실시간 업데이트를 위해)
            onNewMessage?.(formattedMessage);
            return newMessages;
          });
        }
      } else {
        setMessages(prev => {
          // 중복 메시지 체크
          const isDuplicate = prev.some(msg => msg.id === formattedMessage.id);
          if (isDuplicate) {
            return prev;
          }
          const newMessages = [...prev, formattedMessage];
          // onNewMessage 콜백 호출 (실시간 업데이트를 위해)
          onNewMessage?.(formattedMessage);
          return newMessages;
        });
      }
    });

    socket.on('message_status_updated', (data: { userEmail: string; status: string }) => {
      console.log('메시지 상태 업데이트:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.user === data.userEmail 
            ? { ...msg, status: data.status as 'pending' | 'answered' | 'closed' }
            : msg
        )
      );
      onStatusUpdate?.(data);
    });

    socket.on('user_connected', (userEmail: string) => {
      console.log('사용자 연결됨:', userEmail);
      onUserConnected?.(userEmail);
    });

    socket.on('user_disconnected', (userEmail: string) => {
      console.log('사용자 연결 해제됨:', userEmail);
      onUserDisconnected?.(userEmail);
    });

    socket.on('message_error', (error: { error: string }) => {
      console.error('메시지 오류:', error);
    });

    return socket;
  }, [userEmail, isAdmin, onNewMessage, onStatusUpdate, onUserConnected, onUserDisconnected]);

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
    // 연결 상태 확인
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('❌ WebSocket이 연결되지 않았습니다. 연결을 시도합니다.');
      // 연결 시도 중이 아닐 때만 연결 시도
      if (!connectionAttemptedRef.current) {
        connect();
      }
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

    socketRef.current.emit('send_message', data);
    
    // 메시지 전송 성공 시 로컬 상태 업데이트
    if (onNewMessage && data.userEmail) {
      const localMessage = {
        id: Date.now().toString(),
        user: data.userEmail,
        message: data.message,
        type: data.type,
        timestamp: new Date().toISOString(),
        file: data.file,
        fileName: data.fileName,
        fileType: data.fileType
      };
      onNewMessage(localMessage);
    }
  }, [userEmail, connect, onNewMessage]);

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
    // console.log('useWebSocket useEffect 실행:', { userEmail, isAdmin });
    
    // userEmail이 없으면 연결하지 않음
    if (!userEmail) {
      // console.log('userEmail이 없어서 WebSocket 연결을 건너뜀');
      return;
    }
    
    // guest@example.com인 경우 연결하지 않음
    if (userEmail === 'guest@example.com') {
      // console.log('게스트 사용자이므로 WebSocket 연결을 건너뜀');
      return;
    }
    
    // 이미 연결 시도 중이면 건너뜀
    if (connectionAttemptedRef.current) {
      // console.log('이미 연결 시도 중입니다. 건너뜀');
      return;
    }
    
    // 기존 연결이 있으면 해제
    if (socketRef.current?.connected) {
      // console.log('기존 연결 해제 후 재연결');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // connectionAttemptedRef 설정
    connectionAttemptedRef.current = true;
    
    // 새로운 연결
    connect();
    
    // 관리자인 경우에만 기존 메시지 로드
    if (effectiveIsAdmin) {
      loadMessages();
    }

    return () => {
      // 컴포넌트 언마운트 시에만 연결 해제
      // disconnect();
    };
  }, [userEmail, effectiveIsAdmin]); // userEmail이 변경될 때마다 재연결

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