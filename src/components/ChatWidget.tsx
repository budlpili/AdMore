import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faComments, faHeadset, faChevronLeft, faXmark, faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from '../hooks/useWebSocket';

type Message = {
  id?: string;
  from: 'user' | 'admin';
  text?: string;
  file?: string | null;
  fileName?: string;
  fileType?: string;
  timestamp?: string; // 메시지 생성 시간 추가
};

type ChatWidgetProps = {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  userEmail?: string;
  inquiryType?: 'product' | 'payment_cancellation';
  productInfo?: string;
  paymentInfo?: {
    paymentNumber: string;
    productName: string;
    amount: string;
    paymentDate: string;
  };
  hideFloatingButton?: boolean; // 상품 상세 페이지에서 플로팅 버튼 숨김
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  isChatOpen, 
  setIsChatOpen, 
  userEmail = 'guest@example.com',
  inquiryType = 'product',
  productInfo,
  paymentInfo,
  hideFloatingButton = false
}) => {
  // 실제 로그인된 유저의 이메일 가져오기
  const actualUserEmail = localStorage.getItem('userEmail') || userEmail;
  
  // 디버깅: 로컬 스토리지 상태 확인
  console.log('=== 로컬 스토리지 디버깅 ===');
  console.log('actualUserEmail:', actualUserEmail);
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('chat_messages keys:', Object.keys(localStorage).filter(key => key.startsWith('chat_messages_')));
  console.log('current_session keys:', Object.keys(localStorage).filter(key => key.startsWith('current_session_')));
  
  // 강제로 메시지 로드 시도 (useState 선언 후에 실행)
  const forceLoadMessages = () => {
    console.log('강제 메시지 로드 시도, 현재 sessionId:', sessionId);
    
    // 새로운 세션인지 확인 (타임스탬프가 포함된 세션 ID)
    const isNewSession = sessionId.match(/_session_\d+$/);
    console.log('새로운 세션 여부:', isNewSession);
    
    // 새로운 세션인 경우 기존 메시지를 불러오지 않음
    if (isNewSession) {
      console.log('새로운 세션이므로 기존 메시지를 불러오지 않음');
      return null;
    }
    
    // 안정적인 세션 ID 사용
    const stableSessionId = `${actualUserEmail}_session`;
    console.log('안정적인 세션 ID:', stableSessionId);
    
    // 현재 sessionId로 시도
    let savedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
    console.log('현재 sessionId로 로드 결과:', savedMessages);
    
    // 만약 현재 sessionId에 메시지가 없거나 기본 메시지만 있다면, 
    // 이 사용자의 다른 키들에서 실제 대화 내용을 찾아보기
    if (!savedMessages || savedMessages.includes('고객님 반갑습니다')) {
      console.log('기본 메시지만 있거나 없음, 다른 키들에서 찾기 시작');
      
      // 이 사용자의 모든 chat_messages 키들을 찾기
      const allKeys = Object.keys(localStorage);
      const userMessageKeys = allKeys.filter(key => 
        key.startsWith(`chat_messages_${actualUserEmail}`) && 
        key !== `chat_messages_${sessionId}` &&
        key !== `chat_messages_${actualUserEmail}_temp`
      );
      
      console.log('사용자 메시지 키들:', userMessageKeys);
      
      // 각 키를 확인하여 실제 대화 내용이 있는지 확인
      for (const key of userMessageKeys) {
        const messages = localStorage.getItem(key);
        if (messages) {
          try {
            const parsed = JSON.parse(messages);
            // 채팅 종료 메시지가 포함된 대화는 제외하고, 실제 대화 내용이 있는지 확인
            const hasCompletionMessage = parsed.some((msg: any) => 
              msg.text && 
              (msg.text.includes('유저가 채팅종료를 하였습니다') || 
               msg.text.includes('관리자가 답변을 완료하였습니다'))
            );
            
            // 채팅 종료 메시지가 없고, 실제 대화 내용이 있는 경우만 로드
            if (!hasCompletionMessage) {
              const hasRealConversation = parsed.some((msg: any) => 
                msg.text && 
                !msg.text.includes('고객님 반갑습니다') && 
                !msg.text.includes('상담 운영 시간 안내')
              );
              
              if (hasRealConversation && parsed.length > 1) {
                // 채팅 종료 메시지를 제외한 메시지만 필터링
                const filteredMessages = parsed.filter((msg: any) => 
                  !msg.text.includes('유저가 채팅종료를 하였습니다') && 
                  !msg.text.includes('관리자가 답변을 완료하였습니다')
                );
                
                console.log('실제 대화 내용 발견 (채팅 종료 메시지 제외):', key, filteredMessages);
                savedMessages = JSON.stringify(filteredMessages);
                break;
              }
            }
          } catch (error) {
            console.error('키 파싱 오류:', key, error);
          }
        }
      }
    }
    
    console.log('최종 강제 로드 결과:', savedMessages);
    return savedMessages;
  };
  
  console.log('=== 디버깅 끝 ===');
  // 오늘 날짜를 한국어로 포맷팅하는 함수
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[today.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  // 날짜를 한국어로 포맷팅하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  // 날짜가 같은지 확인하는 함수
  const isSameDate = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const [mode, setMode] = useState<'home' | 'chat'>('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isChatCompleted, setIsChatCompleted] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  // 안정적인 sessionId (유저별 고유 ID)
  const [sessionId, setSessionId] = useState<string>(`${actualUserEmail}_session`);
  const [messages, setMessages] = useState<Message[]>([
    { 
      from: 'admin', 
      text: '고객님 반갑습니다!\n\n상담 운영 시간 안내\n· 평일 10:00 ~ 17:00\n· 주말, 공휴일 휴무\n순차적으로 확인하여 답변드리도록 하겠습니다.' 
    }
  ]);

  // 메시지가 변경될 때마다 로컬 스토리지에 저장 (사용자별 키 사용)
  useEffect(() => {
    console.log('=== 메시지 저장 시작 ===');
    console.log('messages:', messages);
    console.log('messages 길이:', messages.length);
    
    if (messages.length > 0) {
      const messageData = JSON.stringify(messages);
      const storageKey = `chat_messages_${sessionId}`;
      console.log('저장할 메시지 데이터:', messageData);
      console.log('저장 키:', storageKey);
      localStorage.setItem(storageKey, messageData);
      console.log('메시지 저장 완료');
      
      // 저장 확인
      const savedData = localStorage.getItem(storageKey);
      console.log('저장 확인:', savedData);
    } else {
      console.log('메시지가 비어있어서 저장하지 않음');
    }
  }, [messages, sessionId]);

  // 로컬 스토리지 정리 함수
  const cleanupLocalStorage = useCallback(() => {
    const allKeys = Object.keys(localStorage);
    const chatMessageKeys = allKeys.filter(key => key.startsWith('chat_messages_'));
    const currentSessionKeys = allKeys.filter(key => key.startsWith('current_session_'));
    
    console.log('=== 로컬 스토리지 정리 시작 ===');
    console.log('총 chat_messages 키 수:', chatMessageKeys.length);
    console.log('총 current_session 키 수:', currentSessionKeys.length);
    
    // 현재 사용자의 키만 유지하고 나머지는 정리
    const currentUserKeys = chatMessageKeys.filter(key => key.includes(actualUserEmail));
    const otherUserKeys = chatMessageKeys.filter(key => !key.includes(actualUserEmail));
    
    console.log('현재 사용자 키 수:', currentUserKeys.length);
    console.log('다른 사용자 키 수:', otherUserKeys.length);
    
    // 다른 사용자의 키들 정리
    otherUserKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('제거된 키:', key);
    });
    
    // current_session도 현재 사용자 것만 유지
    const otherUserSessionKeys = currentSessionKeys.filter(key => !key.includes(actualUserEmail));
    
    otherUserSessionKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('제거된 세션 키:', key);
    });
    
    console.log('=== 로컬 스토리지 정리 완료 ===');
  }, [actualUserEmail]);

  // 컴포넌트 마운트 시 로컬 스토리지 정리
  useEffect(() => {
    if (actualUserEmail && actualUserEmail !== 'guest@example.com') {
      cleanupLocalStorage();
    }
  }, [actualUserEmail, cleanupLocalStorage]);

  // 컴포넌트 마운트 시 기존 메시지 로드 (강제 로드 함수 사용)
  useEffect(() => {
    console.log('=== 컴포넌트 마운트 시 메시지 로드 ===');
    console.log('sessionId:', sessionId);
    console.log('actualUserEmail:', actualUserEmail);
    
    // 새로운 세션인 경우 메시지를 불러오지 않음
    const isNewSession = sessionId.includes('_session_');
    if (isNewSession) {
      console.log('새로운 세션이므로 기존 메시지를 불러오지 않음');
      return;
    }
    
    // 현재 메시지가 이미 환영 메시지만 있는 상태라면 로드하지 않음
    if (messages.length === 1 && 
        messages[0].from === 'admin' && 
        messages[0].text?.includes('고객님 반갑습니다')) {
      console.log('현재 환영 메시지만 있는 상태이므로 기존 메시지를 불러오지 않음');
      return;
    }
    
    // 강제 로드 함수 사용
    const savedMessages = forceLoadMessages();
    console.log('저장된 메시지:', savedMessages);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        console.log('파싱된 메시지:', parsed);
        if (parsed.length > 0) {
          setMessages(parsed);
          console.log('메시지 복원됨:', parsed);
        }
      } catch (error) {
        console.error('저장된 메시지 파싱 오류:', error);
      }
    } else {
      console.log('저장된 메시지 없음');
    }
  }, [sessionId, actualUserEmail, messages]);

  // onNewMessage 콜백을 useCallback으로 안정화
  const handleNewMessage = useCallback((message: any) => {
    console.log('새 메시지 수신:', message);
    console.log('파일 데이터 확인:', {
      file: message.file ? '있음' : '없음',
      fileName: message.fileName,
      fileType: message.fileType,
      fileLength: message.file ? message.file.length : 0,
      fileStart: message.file ? message.file.substring(0, 50) : '없음'
    });
    
    // 홈페이지에서는 "유저가 채팅종료를 하였습니다." 메시지를 필터링
    if (message.message === '유저가 채팅종료를 하였습니다.') {
      console.log('홈페이지에서 채팅종료 메시지 필터링됨:', message.message);
      return;
    }
    
    // 관리자의 답변완료 메시지 처리
    if (message.message === '관리자가 답변을 완료하였습니다.') {
      console.log('관리자 답변완료 메시지 수신:', message.message);
      setIsChatCompleted(true);
      
      // 답변완료 메시지를 채팅에 추가
      const completionMessage: Message = {
        from: 'admin',
        text: '관리자가 답변을 완료하였습니다.\n\n추가 문의사항이 있으시면 언제든 다시 문의해 주세요.\n감사합니다!',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      return;
    }
    
    // 홈페이지 채팅에서는 모든 메시지 표시 (유저가 보낸 메시지도 포함)
    const newMessage: Message = {
      id: message.id,
      from: message.type === 'admin' ? 'admin' : 'user',
      text: message.message,
      file: message.file || null,
      fileName: message.fileName || undefined,
      fileType: message.fileType || undefined,
      timestamp: message.timestamp // 메시지 생성 시간 추가
    };
    
    console.log('새 메시지 추가 시도:', newMessage);
    console.log('파일 정보:', {
      file: newMessage.file ? '있음' : '없음',
      fileName: newMessage.fileName,
      fileType: newMessage.fileType
    });
    
    // 중복 메시지 방지 로직 개선: ID 기반으로 확인
    setMessages(prev => {
      console.log('이전 메시지들:', prev);
      
      // ID가 있으면 ID로 중복 확인, 없으면 내용과 시간으로 확인
      const isDuplicate = message.id 
        ? prev.some(msg => msg.id === message.id)
        : prev.some(msg => 
            msg.text === message.message && 
            msg.from === (message.type === 'admin' ? 'admin' : 'user') &&
            Math.abs(new Date().getTime() - (msg.timestamp ? new Date(msg.timestamp).getTime() : 0)) < 2000 // 2초 이내
          );
      
      if (isDuplicate) {
        console.log('중복 메시지 감지, 추가하지 않음:', message.message);
        return prev;
      }
      
      const newMessages = [...prev, newMessage];
      console.log('새 메시지 추가됨, 총 메시지 수:', newMessages.length);
      return newMessages;
    });
  }, []); // 의존성 배열을 비워서 함수가 재생성되지 않도록 함

  // useWebSocket 훅 사용 (actualUserEmail이 변경될 때만 재연결)
  const {
    isConnected,
    wsMessages,
    sendMessage,
    loadMessages,
    socket
  } = useWebSocket({
    userEmail: actualUserEmail, // 실제 사용자 이메일 사용 (세션 ID가 아님)
    onNewMessage: handleNewMessage
  });

  // sessionId가 변경될 때 WebSocket 재연결을 위한 useEffect
  useEffect(() => {
    console.log('sessionId 변경됨, WebSocket 재연결 필요:', sessionId);
  }, [sessionId]);

  // 새로운 세션 ID 수신 처리
  useEffect(() => {
    if (socket) {
      // 기존 이벤트 리스너 제거
      socket.off('new_session_created');
      socket.off('message_for_session');
      
      socket.on('new_session_created', (data: { sessionId: string }) => {
        console.log('새로운 세션 ID 수신:', data.sessionId);
        setSessionId(data.sessionId);
        // 새로운 세션 ID로 WebSocket 재연결
        console.log('새로운 세션 ID로 WebSocket 재연결 필요');
      });
      
      socket.on('message_for_session', (data: { sessionId: string; message: any }) => {
        console.log('세션별 메시지 수신:', data);
        console.log('현재 sessionId:', sessionId);
        console.log('수신된 sessionId:', data.sessionId);
        if (data.sessionId === sessionId) {
          console.log('현재 세션에 맞는 메시지, 처리 중...');
          handleNewMessage(data.message);
        } else {
          console.log('세션 ID 불일치, 메시지 무시');
        }
      });
    }
  }, [socket, sessionId, handleNewMessage]);

  // 디버깅: 세션 ID와 userEmail 상태 로깅
  console.log('ChatWidget - sessionId:', sessionId);
  console.log('ChatWidget - userEmail:', userEmail);
  console.log('ChatWidget - actualUserEmail:', actualUserEmail);
  console.log('ChatWidget - useWebSocket에 전달되는 userEmail:', actualUserEmail);

  // WebSocket에서 받은 메시지를 로컬 상태와 동기화 (사용자별 키 사용)
  useEffect(() => {
    console.log('wsMessages 변경됨:', wsMessages);
    if (wsMessages && Array.isArray(wsMessages) && wsMessages.length > 0) {
      console.log('WebSocket 메시지 로드됨:', wsMessages.length);
      
      // 현재 세션이 새로운 세션인지 확인 (타임스탬프가 포함된 세션 ID)
      const isNewSession = sessionId.includes('_session_');
      
      if (isNewSession) {
        console.log('새로운 세션이므로 WebSocket 메시지를 덮어쓰지 않음');
        return;
      }
      
      // 채팅 완료 메시지가 포함된 경우 필터링
      const hasCompletionMessage = wsMessages.some((msg: any) => 
        msg.message === '유저가 채팅종료를 하였습니다.' || 
        msg.message === '관리자가 답변을 완료하였습니다.'
      );
      
      if (hasCompletionMessage) {
        console.log('채팅 완료 메시지가 포함되어 있으므로 WebSocket 메시지를 덮어쓰지 않음');
        return;
      }
      
      // 현재 메시지가 이미 환영 메시지만 있는 상태라면 WebSocket 메시지로 덮어쓰지 않음
      const currentMessages = messages;
      if (currentMessages.length === 1 && 
          currentMessages[0].from === 'admin' && 
          currentMessages[0].text?.includes('고객님 반갑습니다')) {
        console.log('현재 환영 메시지만 있는 상태이므로 WebSocket 메시지를 덮어쓰지 않음');
        return;
      }
      
      // 새로운 세션이 시작된 후 WebSocket 메시지가 로드되는 것을 방지
      if (isChatOpen && mode === 'chat') {
        console.log('채팅 모드에서 새로운 세션 메시지 로드 방지');
        return;
      }
      
      // ChatMessage를 Message 형식으로 변환
      const convertedMessages: Message[] = wsMessages.map((msg: any) => ({
        id: msg.id,
        from: msg.type === 'admin' ? 'admin' : 'user',
        text: msg.message,
        timestamp: msg.timestamp
      }));
      setMessages(convertedMessages);
      // 사용자별 키로 localStorage에 저장
      const storageKey = `chat_messages_${sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(convertedMessages));
      console.log('메시지를 localStorage에 저장함, 키:', storageKey);
    }
  }, [wsMessages, sessionId, messages, isChatOpen, mode]);

  // 디버깅을 위한 메시지 상태 로깅
  useEffect(() => {
    console.log('현재 messages 상태:', messages);
  }, [messages]);

  // WebSocket 연결 상태 로깅
  console.log('ChatWidget - WebSocket 연결 상태:', isConnected);
  console.log('ChatWidget - 사용자 이메일:', userEmail);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isChatOpen && mode === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, mode]);

  // isChatOpen이 true로 변경될 때 handleOpen 실행
  useEffect(() => {
    if (isChatOpen) {
      console.log('isChatOpen이 true로 변경됨, handleOpen 실행');
      handleOpen();
    }
  }, [isChatOpen]);

  // 자동 메시지 입력 기능 (결제취소 요청, 상담 문의 등)
  useEffect(() => {
    if (isChatOpen) {
      const autoMessage = localStorage.getItem('chatAutoMessage');
      const chatType = localStorage.getItem('chatType');
      
      if (autoMessage && (chatType === 'payment_cancel' || chatType === 'consultation')) {
        // 채팅 모드로 전환하고 메시지 입력창에 자동으로 텍스트 입력 (자동 전송하지 않음)
        setMode('chat');
        setInput(autoMessage);
        
        // 사용 후 localStorage에서 제거
        localStorage.removeItem('chatAutoMessage');
        localStorage.removeItem('chatType');
        
        console.log('상품 문의 메시지가 입력창에 설정되었습니다 (자동 전송되지 않음):', autoMessage);
      }
    }
  }, [isChatOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => setFilePreview(ev.target?.result as string);
        reader.readAsDataURL(f);
      } else {
        setFilePreview(null);
      }
    }
  };

  const checkLoginStatus = () => {
    console.log('checkLoginStatus - userEmail:', userEmail);
    console.log('checkLoginStatus - actualUserEmail:', actualUserEmail);
    
    if (!actualUserEmail || actualUserEmail === 'guest@example.com') {
      console.log('로그인 필요 - 로그인 모달 표시');
      setShowLoginModal(true);
      return false;
    }
    console.log('로그인 상태 확인됨');
    return true;
  };

  const handleMessageInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      const currentInput = e.currentTarget.value;
      if (currentInput.trim() || file) {
        // 입력값을 즉시 초기화
        setInput('');
        handleSendWithInput(currentInput);
      }
    }
  };

  const handleSendWithInput = (inputValue: string) => {
    if (isSending) return; // 전송 중이면 중복 전송 방지
    
    // 로그인하지 않은 사용자 체크
    if (!checkLoginStatus()) return;
    
    setIsSending(true);
    
    if (inputValue.trim()) {
      console.log('메시지 전송 시도:', {
        message: inputValue,
        userEmail,
        isConnected
      });
      
      // WebSocket을 통해 메시지 전송
      sendMessage({
        message: inputValue,
        type: 'user',
        inquiryType,
        productInfo,
        paymentInfo
      });
    }
    
    if (file) {
      console.log('파일 전송 시도:', file.name, file.type);
      
      // WebSocket을 통해 파일 메시지 전송
      sendMessage({
        message: '', // 파일명을 메시지에 포함하지 않음
        type: 'user',
        inquiryType,
        productInfo,
        paymentInfo,
        file: filePreview,
        fileName: file.name,
        fileType: file.type
      });
      
      setFile(null);
      setFilePreview(null);
    }
    
    // 입력창 초기화
    setInput('');
    
    // 전송 완료 후 상태 초기화
    setTimeout(() => {
      setIsSending(false);
    }, 100);
  };

  const handleSend = () => {
    if (!input.trim() && !file) return;
    handleSendWithInput(input);
    // 입력창 초기화
    setInput('');
  };

  const handleOpen = () => {
    console.log('handleOpen 호출됨');
    console.log('userEmail:', userEmail);
    console.log('actualUserEmail:', actualUserEmail);
    
    // 로그인하지 않은 사용자 체크
    if (!checkLoginStatus()) {
      console.log('로그인 상태 체크 실패');
      return;
    }
    
    console.log('채팅창 열기 시도');
    // 채팅창 열기
    setIsChatOpen(true);
    
    setMode('chat');
    setIsChatCompleted(false);
    setShowDeleteConfirmModal(false);
    
    // 새로운 창을 열 때는 새로운 세션 ID 생성
    const newSessionId = `${actualUserEmail}_session_${Date.now()}`;
    
    // 기존 메시지 완전히 초기화
    const welcomeMessage = {
      from: 'admin' as const,
      text: '고객님 반갑습니다!\n\n상담 운영 시간 안내\n· 평일 10:00 ~ 17:00\n· 주말, 공휴일 휴무\n순차적으로 확인하여 답변드리도록 하겠습니다.'
    };
    
    // 상품 정보가 있는 경우 상품 문의 메시지도 포함
    let initialMessages: Message[] = [welcomeMessage];
    
    // productInfo가 있으면 상품 문의 메시지 추가
    if (productInfo) {
      try {
        const product = JSON.parse(productInfo);
        const productInquiryMessage = {
          from: 'user' as const,
          text: `안녕하세요! 상품에 대해 문의드립니다.\n\n상품명: ${product.name}\n카테고리: ${product.category}\n\n빠른 답변 부탁드립니다.`,
          timestamp: new Date().toISOString()
        };
        initialMessages.push(productInquiryMessage);
        console.log('상품 문의 메시지 추가됨:', productInquiryMessage);
      } catch (error) {
        console.error('상품 정보 파싱 오류:', error);
      }
    }
    
    // 메시지 상태를 즉시 초기화 (sessionId 변경 전에 실행)
    setMessages(initialMessages);
    
    // 새로운 세션의 로컬 스토리지 키도 초기화
    const newStorageKey = `chat_messages_${newSessionId}`;
    localStorage.setItem(newStorageKey, JSON.stringify(initialMessages));
    
    // 기존 세션의 로컬 스토리지 키들 정리
    const keys = Object.keys(localStorage);
    const oldSessionKeys = keys.filter(key => 
      key.startsWith(`chat_messages_${actualUserEmail}_session_`) && 
      key !== newStorageKey
    );
    oldSessionKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('기존 세션 키 삭제:', key);
    });
    
    // sessionId를 마지막에 변경하여 useEffect가 실행되지 않도록 함
    setSessionId(newSessionId);
    localStorage.setItem(`current_session_${actualUserEmail}`, newSessionId);
    console.log('새로운 창 열기 - 새로운 세션 ID 생성:', newSessionId);
    console.log('새로운 창 열기 - 기본 환영 메시지 설정 및 로컬 스토리지 초기화 완료');
  };

  const handleClose = () => {
    // 답변완료 후 X 버튼을 누른 경우 삭제 확인 모달 표시
    if (isChatCompleted) {
      setShowDeleteConfirmModal(true);
      return;
    }
    
    // 일반적인 닫기
    closeChat();
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setMode('home');
    setIsChatCompleted(false);
    setShowDeleteConfirmModal(false);
    
    // sessionId는 유지 (메시지 보존을 위해)
    // 새로운 채팅을 시작할 때만 새로운 sessionId 생성
    
    // 메시지는 로컬 스토리지에 그대로 유지 (관리자가 확인할 수 있도록)
  };

  const handleCompleteChat = () => {
    // 확인 알림창 표시
    const isConfirmed = window.confirm('정말로 상담을 완료하시겠습니까?\n\n완료 후에는 새로운 문의를 시작할 수 있습니다.');
    
    if (isConfirmed) {
      setIsChatCompleted(true);
      
      // 관리자에게 유저가 채팅종료를 하였다는 메시지 전송 (유저에게는 표시하지 않음)
      if (sendMessage && actualUserEmail) {
        sendMessage({
          message: '유저가 채팅종료를 하였습니다.',
          type: 'user',
          targetUserEmail: actualUserEmail
        });
      }
      
      // 유저에게는 완료 메시지만 표시 (관리자 페이지에는 표시되지 않음)
      const completionMessage: Message = {
        from: 'admin',
        text: '상담이 완료되었습니다.\n\n추가 문의사항이 있으시면 언제든 다시 문의해 주세요.\n감사합니다!',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, completionMessage]);
      
      // 채팅 완료 후 로컬 스토리지에서 이전 대화 내용 삭제
      const storageKey = `chat_messages_${sessionId}`;
      localStorage.removeItem(storageKey);
      console.log('채팅 완료 후 이전 대화 내용 삭제:', storageKey);
    }
  };

  // 새로운 채팅 세션 시작
  const startNewChat = () => {
    const newSessionId = `${actualUserEmail}_session_${Date.now()}`;
    setSessionId(newSessionId);
    localStorage.setItem(`current_session_${actualUserEmail}`, newSessionId);
    console.log('새로운 세션 ID 생성:', newSessionId);
    
    // 새로운 세션이므로 메시지 초기화
    setMessages([
      { 
        from: 'admin', 
        text: '고객님 반갑습니다!\n\n상담 운영 시간 안내\n· 평일 10:00 ~ 17:00\n· 주말, 공휴일 휴무\n순차적으로 확인하여 답변드리도록 하겠습니다.' 
      }
    ]);
    
    setIsChatCompleted(false);
    setMode('home');
  };

  return (
    <>
      {/* 문의하기 플로팅 버튼 (데스크탑만, 상품 상세 페이지에서는 숨김) */}
      {(() => {
        console.log('ChatWidget - hideFloatingButton:', hideFloatingButton);
        console.log('ChatWidget - 플로팅 버튼 표시 여부:', !hideFloatingButton);
        return !hideFloatingButton;
      })() && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 items-center justify-center text-3xl hover:bg-blue-700 transition"
          onClick={handleOpen}
          aria-label="문의하기"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        >
          <span>💬</span>
        </button>
      )}
      {/* 문의하기 채팅 위젯 모달 */}
      {isChatOpen && (
        <div className="fixed bottom-12 md:bottom-0 inset-0 z-50 flex items-end justify-end bg-black/10">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl m-6 flex flex-col" style={{ height: '540px' }}>
            {/* 상단바 */}
            <div className="flex items-center justify-between px-6 py-6 border-b">
              <div className="flex items-center">
                {mode === 'chat' && (
                  <button onClick={() => setMode('home')} className="mr-4 text-gray-500 hover:text-gray-700 text-base">
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                )}
                {mode === 'chat' ? (
                  <>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-white">
                      <img src="/images/icon_admore.png" alt="logo" className="w-full h-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-base">애드모어 운영팀</span>
                      <span className="font-semibold text-gray-400 text-xs">빠른 답변을 드리겠습니다.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-gray-100 border border-gray-200">
                      <img src="/images/icon_admore.png" alt="logo" className="w-full h-full" />
                    </div>
                    <span className="font-bold text-gray-900 text-xl">애드모어 운영팀</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 답변완료 버튼 - 채팅 모드에서만 표시 */}
                {mode === 'chat' && !isChatCompleted && (
                  <button 
                    onClick={handleCompleteChat} 
                    className="text-xs bg-blue-600 text-white p-2 w-12 h-12 rounded-full hover:bg-blue-700 
                      transition-colors font-medium mr-4 shadow-md shadow-blue-500/50 border border-blue-600"
                  >
                    채팅<br />완료
                  </button>
                )}
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-base">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>
            {/* 본문: 안내/문의 or 채팅 */}
            <div className="flex-1 flex flex-col">
              {mode === 'home' ? (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
                    <div className="flex flex-col items-center justify-start bg-white border border-gray-100 rounded-lg px-3 text-sm text-gray-700 w-full mb-4">
                      <div className="rounded-lg p-4 text-sm text-gray-700 w-full whitespace-pre-wrap">
                        <div className="font-bold mb-1">고객님 반갑습니다 <span className='text-orange-500'>🤩🤩</span></div>
                        <div className="mb-1">상담 운영 시간 안내</div>
                        <div className="mb-1">· 평일 10:00 ~ 17:00</div>
                        <div className="mb-1">· 주말, 공휴일 휴무</div>
                        <div className="mb-1">빠른 시간 내 순차적으로 확인하여 <br /> 답변드리도록 하겠습니다.</div>
                      </div>
                      <button className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold text-sm mb-4 
                      hover:bg-orange-700 transition" onClick={() => {
                        // 로그인하지 않은 사용자 체크
                        if (!checkLoginStatus()) return;
                        
                        setMode('chat');
                        // 기존 세션 ID 사용 (메시지 보존)
                        console.log('채팅 모드 진입, 기존 세션 ID 사용:', sessionId);
                        // 메시지는 useEffect에서 자동으로 로드됨
                      }}>문의하기</button>
                    </div>

                    {/* <div className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-lg px-4 py-4 
                      text-sm text-gray-700 w-full mb-4">
                      <div className="flex items-center gap-2 bg-white rounded-lg px-0 w-full">
                        <input type="tel" className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 
                        focus:ring-orange-500 text-sm" placeholder="휴대폰 번호를 입력해 주세요." />
                        <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-md font-semibold text-xs 
                          hover:bg-orange-200 transition">SMS <br /> 등록</button>
                      </div>
                      <div className="text-xs text-gray-400 w-full">* SMS 등록하시면 답변을 SMS로도 받아보실 수 있어요!</div>
                    </div> */}

                    
                    

                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto max-h-[380px] px-4 py-3 bg-gray-50">
                    {messages.map((msg, idx) => {
                      // 메시지의 실제 전송 시간을 사용 (백엔드에서 KST로 저장됨)
                      const messageTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
                      const time = messageTime.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      });
                      
                      // 날짜 구분선 렌더링
                      const showDateDivider = () => {
                        if (idx === 0) {
                          // 첫 번째 메시지인 경우 오늘 날짜 표시
                          return (
                            <div key={`date-${idx}`} className="flex justify-center mb-4">
                              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                {getTodayDate()}
                              </div>
                            </div>
                          );
                        }
                        
                        // 이전 메시지와 날짜가 다른 경우 날짜 구분선 표시
                        const currentMsgDate = msg.timestamp || new Date().toISOString();
                        const prevMsgDate = messages[idx - 1]?.timestamp || new Date().toISOString();
                        
                        if (!isSameDate(currentMsgDate, prevMsgDate)) {
                          return (
                            <div key={`date-${idx}`} className="flex justify-center mb-4">
                              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                {formatDate(currentMsgDate)}
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      };

                      const dateDivider = showDateDivider();
                      
                      if (msg.from === 'admin') {
                        return (
                          <React.Fragment key={idx}>
                            {dateDivider}
                            <div className="mb-4 flex items-start">
                              <span className="w-7 h-7 rounded-full mt-0 mr-2 flex items-center justify-center bg-gray-100 border border-gray-200">
                                <FontAwesomeIcon icon={faHeadset} className="text-lg text-gray-500" />
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700 mb-1 ml-1">애드모어 운영팀</span>
                                <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-[13px] text-gray-900 
                                    max-w-[100%]">
                                  {/* 파일이 있는 경우 파일 표시 */}
                                  {(() => {
                                    console.log('관리자 메시지 파일 정보:', {
                                      file: msg.file ? '있음' : '없음',
                                      fileName: msg.fileName,
                                      fileType: msg.fileType,
                                      isImage: msg.fileType && msg.fileType.startsWith('image/'),
                                      fileLength: msg.file ? msg.file.length : 0,
                                      fileStart: msg.file ? msg.file.substring(0, 50) : '없음'
                                    });
                                    
                                    if (msg.file && msg.fileType && msg.fileType.startsWith('image/')) {
                                      return (
                                        <div className="mb-2">
                                          <img 
                                            src={msg.file} 
                                            alt={msg.fileName || '첨부된 이미지'} 
                                            className="max-w-full h-auto rounded-lg"
                                            style={{ maxHeight: '200px' }}
                                            onLoad={() => console.log('이미지 로드 성공:', msg.fileName)}
                                            onError={(e) => console.error('이미지 로드 실패:', msg.fileName, e)}
                                          />
                                        </div>
                                      );
                                    } else if (msg.file && msg.fileName) {
                                      return (
                                        <div className="mb-2 p-2 bg-gray-200 rounded border">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs">📎</span>
                                            <span className="text-xs">첨부파일</span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  {msg.text && (
                                    <div className="text-sm leading-relaxed whitespace-normal">
                                      {msg.text.split('\n').map((line, index) => (
                                        <div key={index} style={{ display: 'block', wordBreak: 'normal' }}>
                                          {line}
                                          {index < (msg.text?.split('\n').length || 0) - 1 && <br />}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                </div>
                                <span className="text-[11px] text-gray-400 mt-1 self-start">{time}</span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      } else {
                        return (
                          <React.Fragment key={idx}>
                            {dateDivider}
                            <div className="mb-4 flex flex-col items-end">
                              <div className="bg-orange-600 text-white rounded-lg px-4 py-2 text-sm max-w-[70%] 
                                  break-words whitespace-pre-line">
                                {/* 파일이 있는 경우 파일 표시 */}
                                {msg.file && msg.fileType && msg.fileType.startsWith('image/') ? (
                                  <div className="mb-2">
                                    <img 
                                      src={msg.file} 
                                      alt="첨부된 이미지" 
                                      className="max-w-full h-auto rounded-lg"
                                      style={{ maxHeight: '200px' }}
                                    />
                                  </div>
                                ) : msg.file && msg.fileName ? (
                                  <div className="mb-2 p-2 bg-orange-500 rounded border">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs">📎</span>
                                      <span className="text-xs">첨부파일</span>
                                    </div>
                                  </div>
                                ) : null}
                                {msg.text && <div className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</div>}
                              </div>
                              <span className="text-[11px] text-gray-400 mt-1 mr-1">{time}</span>
                            </div>
                          </React.Fragment>
                        );
                      }
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  {/* 입력창 */}
                  <form className="relative flex items-center border-t px-3 py-3 gap-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
                    {/* 채팅 완료 시 입력창 비활성화 오버레이 */}
                    {isChatCompleted && (
                      <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center rounded-md gap-2 z-10">
                        <span className="text-gray-500 text-sm font-medium">상담이 완료되었습니다</span>
                        <span className="text-gray-400 text-xs">더 이상 메시지를 주고받을 수 없습니다</span>
                      </div>
                    )}
                    
                    <textarea
                      className="flex-1 px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs resize-none"
                      placeholder={isChatCompleted ? "상담이 완료되었습니다" : "메시지를 입력하세요. (Enter:줄바꿈/Ctrl+Enter:전송)"}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleMessageInputKeyDown}
                      rows={1}
                      autoFocus
                      disabled={isChatCompleted}
                    />
                    <button
                      type="button"
                      className="flex items-center justify-center ml-1 text-gray-400 hover:text-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="파일 첨부"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isChatCompleted}
                    >
                      <FontAwesomeIcon icon={faPaperclip} className="text-xl" />
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isChatCompleted}
                      />
                    </button>
                    <button
                      type="submit"
                      className="ml-1 flex items-center justify-center hover:text-orange-500 text-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="전송"
                      disabled={isChatCompleted}
                    >
                      <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
                    </button>
                  </form>
                </>
              )}
            </div>
            {/* 하단 네비게이션 탭: only show in home mode */}
            {mode === 'home' && (
              <div className="flex border-t divide-x">
                <button
                  className={`flex-1 py-3 flex flex-col items-center text-sm font-semibold text-orange-600`}
                  onClick={() => setMode('home')}
                >
                  <FontAwesomeIcon icon={faHome} className="text-sm mb-1" />
                  <span className="text-xs">홈</span>
                </button>
                <button
                  className={`flex-1 py-3 flex flex-col items-center text-sm font-semibold text-gray-500`}
                  onClick={() => setMode('chat')}
                >
                  <FontAwesomeIcon icon={faComments} className="text-sm mb-1" />
                  <span className="text-xs">대화</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그인 필요 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faComments} className="text-2xl text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                1:1 문의를 이용하시려면<br />
                회원가입이 필요합니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    // 로그인 페이지로 이동
                    window.location.href = '/login';
                  }}
                  className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                >
                  로그인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상담 메시지 삭제 확인 모달 */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faComments} className="text-2xl text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">상담 메시지 삭제</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                상담이 완료되었습니다.<br />
                상담 내용을 모두 삭제하고<br />
                새로운 1:1 문의를 시작하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={closeChat}
                  className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                >
                  삭제하고 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;