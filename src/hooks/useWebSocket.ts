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

  // WebSocket 연결
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket 연결됨');
      setIsConnected(true);
      
      // 사용자 또는 관리자 로그인
      if (isAdmin) {
        socket.emit('admin_login');
      } else if (userEmail) {
        socket.emit('user_login', userEmail);
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket 연결 해제됨');
      setIsConnected(false);
    });

    socket.on('new_message', (message: ChatMessage) => {
      console.log('새 메시지 수신:', message);
      setMessages(prev => [...prev, message]);
      onNewMessage?.(message);
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
  }) => {
    if (!socketRef.current?.connected || !userEmail) {
      console.error('WebSocket이 연결되지 않았거나 사용자 이메일이 없습니다.');
      return;
    }

    const data = {
      userEmail,
      ...messageData
    };

    socketRef.current.emit('send_message', data);
  }, [userEmail]);

  // 메시지 상태 업데이트
  const updateMessageStatus = useCallback((status: 'pending' | 'answered' | 'closed') => {
    if (!socketRef.current?.connected || !userEmail) {
      console.error('WebSocket이 연결되지 않았거나 사용자 이메일이 없습니다.');
      return;
    }

    socketRef.current.emit('update_message_status', { userEmail, status });
  }, [userEmail]);

  // 기존 메시지 로드
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    }
  }, []);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    const socket = connect();
    loadMessages();

    return () => {
      disconnect();
    };
  }, [connect, loadMessages, disconnect]);

  return {
    isConnected,
    messages,
    sendMessage,
    updateMessageStatus,
    loadMessages,
    disconnect
  };
}; 