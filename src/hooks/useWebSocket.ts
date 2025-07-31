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
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptedRef = useRef(false);

  // WebSocket 연결
  const connect = useCallback(() => {
    if (socketRef.current?.connected || connectionAttemptedRef.current) {
      console.log('이미 연결되었거나 연결 시도 중입니다.');
      return socketRef.current;
    }

    console.log('WebSocket 연결 시도 중...');
    connectionAttemptedRef.current = true;

    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket 연결됨 - Socket ID:', socket.id);
      setIsConnected(true);
      
      // 사용자 또는 관리자 로그인
      if (isAdmin) {
        console.log('관리자 로그인 이벤트 전송');
        socket.emit('admin_login');
      } else if (userEmail) {
        console.log('사용자 로그인 이벤트 전송:', userEmail);
        socket.emit('user_login', userEmail);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket 연결 오류:', error);
      setIsConnected(false);
      connectionAttemptedRef.current = false;
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket 연결 해제됨:', reason);
      setIsConnected(false);
      connectionAttemptedRef.current = false;
    });

    socket.on('new_message', (message: any) => {
      console.log('새 메시지 수신:', message);
      // userEmail 필드를 user로 매핑, id는 문자열로 변환
      const formattedMessage = {
        ...message,
        user: message.userEmail || message.user,
        id: String(message.id)
      };
      setMessages(prev => [...prev, formattedMessage]);
      onNewMessage?.(formattedMessage);
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
  }) => {
    console.log('sendMessage 호출됨:', {
      socketConnected: socketRef.current?.connected,
      userEmail,
      messageData
    });
    
    if (!socketRef.current?.connected) {
      console.error('WebSocket이 연결되지 않았습니다. 연결을 시도합니다.');
      connect();
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

    console.log('WebSocket으로 메시지 전송:', data);
    socketRef.current.emit('send_message', data);
  }, [userEmail, connect]);

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
      console.log('기존 메시지 로드 중...');
      const response = await fetch('http://localhost:5001/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        console.log('로드된 메시지:', data);
        // userEmail 필드를 user로 매핑, id는 문자열로 변환
        const formattedData = data.map((message: any) => ({
          ...message,
          user: message.userEmail || message.user,
          id: String(message.id)
        }));
        setMessages(formattedData);
      } else {
        console.error('메시지 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  }, []);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('WebSocket 연결 해제 중...');
      socketRef.current.disconnect();
      socketRef.current = null;
      connectionAttemptedRef.current = false;
    }
  }, []);

  useEffect(() => {
    console.log('useWebSocket useEffect 실행:', { userEmail, isAdmin });
    
    // 초기 연결
    if (!socketRef.current) {
      connect();
    }
    
    // 기존 메시지 로드
    loadMessages();

    return () => {
      // 컴포넌트 언마운트 시에만 연결 해제
      // disconnect();
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // userEmail이 변경될 때 로그인 이벤트만 다시 전송
  useEffect(() => {
    if (socketRef.current?.connected && userEmail) {
      console.log('사용자 이메일 변경으로 로그인 이벤트 재전송:', userEmail);
      if (isAdmin) {
        socketRef.current.emit('admin_login');
      } else {
        socketRef.current.emit('user_login', userEmail);
      }
    }
  }, [userEmail, isAdmin]);

  return {
    isConnected,
    messages,
    sendMessage,
    updateMessageStatus,
    loadMessages,
    disconnect
  };
}; 