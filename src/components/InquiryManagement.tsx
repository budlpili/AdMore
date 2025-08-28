import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faTrash, faClock, faPhone, faEnvelope, faCheckCircle, faHourglassHalf, faExclamationCircle, faSearch, faStar, faShieldAlt, faExclamationTriangle, faUser, faBuilding, faFileInvoice, faChartLine, faCreditCard, faXmark, faDownload, faChevronLeft, faChevronRight, faChevronDown, faPaperclip, faPaperPlane, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { usersAPI, chatAPI } from '../services/api';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  productInfo?: string;
  inquiryType?: 'product' | 'payment_cancellation';
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
  userName?: string; // 유저 이름 필드 추가
}

interface InquiryManagementProps {
  chatMessages: ChatMessage[];
  onChatMessagesChange: (messages: ChatMessage[]) => void;
  users?: Array<{ id: string; email: string; name: string; role: string; status: string }>;
  sendMessage?: (messageData: {
    message: string;
    type: 'user' | 'admin';
    inquiryType?: 'product' | 'payment_cancellation';
    productInfo?: string;
    paymentInfo?: any;
    targetUserEmail?: string;
    file?: string | null;
    fileName?: string;
    fileType?: string;
  }) => void;
}

const InquiryManagement: React.FC<InquiryManagementProps> = ({
  chatMessages,
  onChatMessagesChange,
  users = [],
  sendMessage
}) => {
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [closingMessage, setClosingMessage] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userNames, setUserNames] = useState<{[email: string]: string}>({});
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedUsersForDelete, setSelectedUsersForDelete] = useState<Set<string>>(new Set());
  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedUsersForExport, setSelectedUsersForExport] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFiles, setExportedFiles] = useState<Array<{name: string; size: number; created: string; type: string}>>([]);
  const [showFileList, setShowFileList] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{email: string; lastMessageTime: string; isOnline: boolean}>>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // 화면 크기에 따른 오른쪽 패널 자동 제어
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg 사이즈 미만
        setIsRightPanelCollapsed(true);
      }
      // lg 사이즈 이상에서는 자동으로 열지 않음 - 사용자가 수동으로 제어
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 선택된 메시지가 변경될 때 유저 이름 가져오기
  useEffect(() => {
    console.log('InquiryManagement: selectedMessage 변경됨', selectedMessage?.user);
    if (selectedMessage && selectedMessage.user !== '관리자') {
      getUserName(selectedMessage.user);
    }
  }, [selectedMessage, users]);

  // 컴포넌트 마운트 시 저장된 파일 목록 자동 로드
  useEffect(() => {
    console.log('🔄 InquiryManagement 컴포넌트 마운트, 저장된 파일 목록 자동 로드 시작...');
    console.log('📊 컴포넌트 마운트 시점 exportedFiles 상태:', exportedFiles);
    console.log('📊 컴포넌트 마운트 시점 showFileList 상태:', showFileList);
    
    // 약간의 지연 후 로드 (컴포넌트 완전 마운트 후)
    setTimeout(() => {
      console.log('⏰ 지연된 저장된 파일 목록 로드 시작...');
      loadExportedFiles();
    }, 1000);
  }, []);

  // 저장된 파일 목록 가져오기
  const loadExportedFiles = async () => {
    try {
      console.log('🔄 저장된 파일 목록 로드 시작...');
      console.log('📡 API 호출: chatAPI.getExports()');
      console.log('📡 chatAPI 객체 확인:', chatAPI);
      console.log('📡 chatAPI.getExports 함수 확인:', typeof chatAPI.getExports);
      
      // API 호출 전 상태 확인
      console.log('📊 API 호출 전 exportedFiles 상태:', exportedFiles);
      console.log('📊 API 호출 전 exportedFiles 길이:', exportedFiles.length);
      
      const result = await chatAPI.getExports();
      console.log('📁 API 응답 결과:', result);
      console.log('📁 API 응답 타입:', typeof result);
      console.log('📁 API 응답 키들:', result ? Object.keys(result) : 'null/undefined');
      console.log('📁 API 응답 전체 구조:', JSON.stringify(result, null, 2));
      
      if (result && result.files) {
        console.log('✅ 파일 목록 로드 성공:', result.files.length, '개 파일');
        console.log('📁 파일 목록 상세:', result.files);
        setExportedFiles(result.files);
        console.log('📊 setExportedFiles 호출 후 상태 업데이트 예정');
      } else if (result && Array.isArray(result)) {
        console.log('⚠️ API 응답이 배열 형태:', result);
        console.log('📁 배열 길이:', result.length);
        setExportedFiles(result);
        console.log('📊 배열 형태로 setExportedFiles 호출 후 상태 업데이트 예정');
      } else {
        console.log('⚠️ 파일 목록이 비어있거나 잘못된 형식:', result);
        console.log('📁 result.files 존재 여부:', result && result.files ? '존재' : '존재하지 않음');
        console.log('📁 result가 배열인지:', Array.isArray(result));
        setExportedFiles([]);
        console.log('📊 빈 배열로 setExportedFiles 호출 후 상태 업데이트 예정');
      }
      
      // API 호출 후 상태 확인
      setTimeout(() => {
        console.log('📊 API 호출 후 exportedFiles 상태:', exportedFiles);
        console.log('📊 API 호출 후 exportedFiles 길이:', exportedFiles.length);
      }, 100);
      
    } catch (error) {
      console.error('❌ 파일 목록 로드 오류:', error);
      console.error('오류 상세 정보:', {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : '스택 트레이스 없음',
        name: error instanceof Error ? error.name : '알 수 없는 오류 타입'
      });
      
      // 사용자에게 오류 알림
      alert('저장된 파일 목록을 불러오는 중 오류가 발생했습니다.\n\n오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      
      // 빈 배열로 설정
      setExportedFiles([]);
    }
  };

  // 파일 다운로드 함수
  const handleDownloadFile = async (filename: string) => {
    try {
      console.log(`파일 다운로드 시작: ${filename}`);
      await chatAPI.downloadFile(filename);
      console.log(`파일 다운로드 완료: ${filename}`);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert(`파일 다운로드 중 오류가 발생했습니다.\n\n파일명: ${filename}\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 사용자별 메시지 그룹화
  const userMessages = chatMessages.reduce((acc, message) => {
    if (message.user !== '관리자') {
      if (!acc[message.user]) {
        acc[message.user] = [];
      }
      acc[message.user].push(message);
    }
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  // 각 사용자의 최신 메시지로 대표 메시지 생성
  const representativeMessages = Object.entries(userMessages).map(([user, messages]) => {
    // 타임스탬프를 기준으로 정확하게 정렬하여 최신 메시지 가져오기
    const sortedMessages = messages.sort((a, b) => {
      const dateA = new Date(a.timestamp.replace(' ', 'T'));
      const dateB = new Date(b.timestamp.replace(' ', 'T'));
      return dateB.getTime() - dateA.getTime();
    });
    const latestMessage = sortedMessages[0];
    
    // 해당 사용자의 최신 메시지가 완료 메시지인지 확인
    const isLatestMessageCompletion = 
      latestMessage.message === '유저가 채팅종료를 하였습니다.' || 
      latestMessage.message === '관리자가 답변을 완료하였습니다.';
    
    // 상태 계산 - 실제 데이터 기반으로 정확하게 계산
    let status: 'pending' | 'answered' | 'closed' = 'pending';
    
    // 유저가 채팅을 완료했거나 관리자가 답변을 완료했으면 완료
    if (isLatestMessageCompletion) {
      status = 'closed';
    } else {
      // 관리자 메시지가 있으면 답변 중
      const adminMessages = messages.filter(msg => msg.type === 'admin');
      if (adminMessages.length > 0) {
        status = 'answered';
      } else {
        // 관리자 메시지가 없으면 대기 중
        status = 'pending';
      }
    }
    
    // 디버깅을 위한 로그
    console.log(`사용자 ${user} 상태 계산:`, {
      latestMessage: latestMessage.message,
      isLatestMessageCompletion,
      adminMessageCount: messages.filter(msg => msg.type === 'admin').length,
      calculatedStatus: status,
      allMessages: messages.map(msg => ({ message: msg.message, type: msg.type }))
    });
    
    return {
      ...latestMessage,
      user,
      // 해당 사용자의 모든 메시지 개수
      messageCount: messages.length,
      // 해당 사용자의 관리자 응답 개수
      adminResponseCount: messages.filter(msg => msg.type === 'admin').length,
      // 완료 상태
      isCompleted: isLatestMessageCompletion,
      // 상태
      status
    };
  });

  // 필터링된 대표 메시지 계산
  const filteredMessages = representativeMessages
    .filter(message => {
      // 검색어 필터링
      const matchesSearch = searchTerm === '' || 
        message.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 상태 필터링
      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 최신 메시지 순으로 정렬 (내림차순)
      const dateA = new Date(a.timestamp.replace(' ', 'T'));
      const dateB = new Date(b.timestamp.replace(' ', 'T'));
      return dateB.getTime() - dateA.getTime();
    });

  // 통계 계산
  const totalUserCount = representativeMessages.length;
  const pendingCount = representativeMessages.filter(msg => msg.status === 'pending').length;
  const inProgressCount = representativeMessages.filter(msg => msg.status === 'answered').length;
  const completedCount = representativeMessages.filter(msg => msg.status === 'closed').length;
  
  // 디버깅을 위한 로그
  console.log('=== 채팅 상태 통계 ===');
  console.log('전체 유저 수:', totalUserCount);
  console.log('대기 중:', pendingCount);
  console.log('답변 중:', inProgressCount);
  console.log('완료:', completedCount);
  console.log('합계:', pendingCount + inProgressCount + completedCount);
  console.log('representativeMessages:', representativeMessages.map(msg => ({
    user: msg.user,
    status: msg.status,
    message: msg.message
  })));

  // 채팅 컨테이너 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, selectedMessage]);

  const deleteChatMessage = (messageId: string) => {
    const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
    onChatMessagesChange(updatedMessages);
  };

  const handleReplyClick = (message: ChatMessage) => {
    setReplyingToMessage(message);
    setShowReplyModal(true);
  };

  const handleSubmitReply = () => {
    if (replyingToMessage && replyContent.trim()) {
      const newReply: ChatMessage = {
        id: Date.now().toString(),
        user: '관리자',
        message: replyContent,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: 'admin',
        status: 'answered',
        inquiryType: replyingToMessage.inquiryType,
        productInfo: replyingToMessage.productInfo,
        paymentInfo: replyingToMessage.paymentInfo
      };

      const updatedMessages = [...chatMessages, newReply];
      onChatMessagesChange(updatedMessages);
      
      setReplyContent('');
      setShowReplyModal(false);
      setReplyingToMessage(null);
    }
  };

  const handleCancelReply = () => {
    setReplyContent('');
    setShowReplyModal(false);
    setReplyingToMessage(null);
  };

  const handleCloseChat = (message: ChatMessage) => {
    setClosingMessage(message);
    setShowCloseConfirmModal(true);
  };

  const confirmCloseChat = () => {
    if (closingMessage) {
      try {
        // 답변완료 메시지 생성 (한국시간 사용)
        const now = new Date();
        const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9 (한국시간)
        
        const completionMessage: ChatMessage = {
          id: Date.now().toString(),
          user: closingMessage.user,
          message: '관리자가 답변을 완료하였습니다.',
          timestamp: koreanTime.toISOString().slice(0, 16).replace('T', ' '),
          type: 'admin',
          status: 'closed'
        };
        
        // 유저에게 답변완료 메시지 전송
        if (sendMessage) {
          sendMessage({
            message: '관리자가 답변을 완료하였습니다.',
            type: 'admin',
            targetUserEmail: closingMessage.user
          });
        }
        
        // 답변완료 메시지를 chatMessages에 추가 (위에 새로 표시되지 않도록)
        // 기존 메시지들은 그대로 두고 답변완료 메시지만 추가
        const updatedMessages = [...chatMessages, completionMessage];
        onChatMessagesChange(updatedMessages);
        
        // selectedMessage도 업데이트
        const updatedSelectedMessage = { ...closingMessage, status: 'closed' as const };
        setSelectedMessage(updatedSelectedMessage);
        
        // 성공 메시지 표시
        alert('채팅이 성공적으로 완료되었습니다.');
        
        setShowCloseConfirmModal(false);
        setClosingMessage(null);
      } catch (error) {
        console.error('채팅 완료 처리 중 오류 발생:', error);
        alert('채팅 완료 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const cancelCloseChat = () => {
    setShowCloseConfirmModal(false);
    setClosingMessage(null);
  };

  const handleStatusChange = (messageId: string, newStatus: 'pending' | 'answered' | 'closed') => {
    const updatedMessages = chatMessages.map(msg => 
      msg.id === messageId ? { ...msg, status: newStatus } : msg
    );
    onChatMessagesChange(updatedMessages);
  };

  const handleMessageInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
      
      // Ctrl+Enter 후 입력창 즉시 초기화
      setTimeout(() => {
        setMessageInput('');
        const textareaElement = e.target as HTMLTextAreaElement;
        if (textareaElement) {
          textareaElement.value = '';
        }
      }, 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('파일 선택됨:', file.name, file.type, file.size);
      setSelectedFile(file);
      
      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith('image/')) {
        console.log('이미지 파일 감지, 미리보기 생성 시작');
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          console.log('이미지 미리보기 생성됨, 길이:', result.length);
          console.log('미리보기 시작 부분:', result.substring(0, 50));
          setFilePreview(result);
        };
        reader.onerror = (error) => {
          console.error('파일 읽기 오류:', error);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('이미지가 아닌 파일, 미리보기 없음');
        setFilePreview(null);
      }
    } else {
      console.log('파일이 선택되지 않음');
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if (!selectedMessage) {
      alert('메시지를 보낼 사용자를 선택해주세요.');
      return;
    }
    
    if ((!messageInput.trim() && !selectedFile) || isSending) return;

    const messageToSend = messageInput.trim();
    
    setIsSending(true);

    // 텍스트 메시지가 있는 경우 WebSocket을 통해 전송
    if (messageToSend && sendMessage) {
      sendMessage({
        message: messageToSend,
        type: 'admin',
        inquiryType: selectedMessage.inquiryType,
        productInfo: selectedMessage.productInfo,
        paymentInfo: selectedMessage.paymentInfo,
        targetUserEmail: selectedMessage.user
      });
    }

    // 파일이 있는 경우 파일 메시지도 WebSocket을 통해 전송
    if (selectedFile && sendMessage) {
      console.log('파일 전송 시도:', selectedFile.name, selectedFile.type);
      console.log('파일 미리보기 데이터:', filePreview ? '있음' : '없음');
      console.log('파일 미리보기 길이:', filePreview ? filePreview.length : 0);
      console.log('파일 미리보기 시작 부분:', filePreview ? filePreview.substring(0, 100) : '없음');
      
      // WebSocket을 통해 파일 메시지 전송
      const fileMessageData = {
        message: '', // 파일명을 메시지에 포함하지 않음
        type: 'admin' as const,
        inquiryType: selectedMessage.inquiryType,
        productInfo: selectedMessage.productInfo,
        paymentInfo: selectedMessage.paymentInfo,
        targetUserEmail: selectedMessage.user,
        file: filePreview,
        fileName: selectedFile.name,
        fileType: selectedFile.type
      };
      
      console.log('전송할 파일 메시지 데이터:', fileMessageData);
      sendMessage(fileMessageData);
      
      // 파일 상태 초기화
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // 입력창 즉시 비우기 (메시지 전송 후 바로 실행)
    setMessageInput('');
    
    // DOM에서도 입력창 값 초기화 (추가 보장)
    const textareaElements = document.querySelectorAll('textarea[placeholder*="메시지를 입력하세요"]');
    textareaElements.forEach((element) => {
      (element as HTMLTextAreaElement).value = '';
    });

    // 전송 상태 리셋
    setTimeout(() => {
      setIsSending(false);
    }, 1000);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-500 text-xs" />;
      case 'answered':
        return <FontAwesomeIcon icon={faClock} className="text-blue-500 text-xs" />;
      case 'closed':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xs" />;
      default:
        return <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-500 text-xs" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return '답변대기';
      case 'answered':
        return '답변중';
      case 'closed':
        return '채팅완료';
      default:
        return '답변대기';
    }
  };

  // 사용자별 상세 상태 텍스트 반환 함수
  const getDetailedStatusText = (userEmail: string, status?: string) => {
    if (isUserChatCompleted(userEmail)) {
      return '유저완료';
    }
    if (isAdminResponseCompleted(userEmail)) {
      return '관리자완료';
    }
    
    switch (status) {
      case 'pending':
        return '답변대기';
      case 'answered':
        return '답변중';
      case 'closed':
        return '채팅완료';
      default:
        return '답변대기';
    }
  };

  // 채팅이 완료되었는지 확인하는 함수
  const isChatCompleted = useCallback((userEmail: string) => {
    // 해당 유저의 메시지만 확인
    const userMessages = chatMessages.filter(msg => msg.user === userEmail);
    
    if (userMessages.length === 0) return false;
    
    // 최신 메시지 확인 (마지막 메시지)
    const latestMessage = userMessages[userMessages.length - 1];
    
    // 최신 메시지가 완료 메시지인지 확인
    const isLatestMessageCompletion = 
      latestMessage.message === '유저가 채팅종료를 하였습니다.' || 
      latestMessage.message === '관리자가 답변을 완료하였습니다.';
    
    // 채팅 종료 메시지가 있으면 완료된 것으로 간주
    const hasCompletionMessage = userMessages.some(msg => 
      msg.message === '유저가 채팅종료를 하였습니다.' || 
      msg.message === '관리자가 답변을 완료하였습니다.'
    );
    
    // 새로운 세션인지 확인 (타임스탬프가 포함된 세션 ID)
    const isNewSession = userEmail.includes('_session_');
    
    // 새로운 세션이어도 채팅 종료 메시지가 있으면 완료된 것으로 간주
    return isLatestMessageCompletion || hasCompletionMessage;
  }, [chatMessages]);

  // 유저가 채팅을 완료했는지 확인하는 함수
  const isUserChatCompleted = useCallback((userEmail: string) => {
    const userMessages = chatMessages.filter(msg => msg.user === userEmail);
    return userMessages.some(msg => msg.message === '유저가 채팅종료를 하였습니다.');
  }, [chatMessages]);

  // 관리자가 답변을 완료했는지 확인하는 함수
  const isAdminResponseCompleted = useCallback((userEmail: string) => {
    const userMessages = chatMessages.filter(msg => msg.user === userEmail);
    return userMessages.some(msg => msg.message === '관리자가 답변을 완료하였습니다.');
  }, [chatMessages]);

  // 이메일에서 이니셜 추출 함수
  const getInitials = (email: string) => {
    if (!email || typeof email !== 'string') return '?';
    
    // 세션 ID가 포함된 이메일인 경우 원래 이메일 추출
    const originalEmail = email.includes('_') ? email.split('_')[0] : email;
    
    if (!originalEmail.includes('@')) return originalEmail.charAt(0).toUpperCase();
    const localPart = originalEmail.split('@')[0];
    return localPart.charAt(0).toUpperCase();
  };

  // 유저 표시 이름 가져오기 함수
  const getUserDisplayName = (message: ChatMessage) => {
    // 유저 이름이 있으면 이름을, 없으면 이메일을 반환
    if (message.userName) {
      return message.userName;
    }
    return message.user;
  };

  // 유저 이름 가져오기 함수
  const getUserName = useCallback((email: string) => {
    // 세션 ID가 포함된 이메일인 경우 원래 이메일 추출
    const originalEmail = email.includes('_') ? email.split('_')[0] : email;
    
    if (userNames[originalEmail]) return userNames[originalEmail];
    
    // users 배열에서 해당 이메일의 유저 찾기
    const user = users.find(u => u.email === originalEmail);
    if (user && user.name) {
      setUserNames(prev => ({ ...prev, [originalEmail]: user.name }));
      return user.name;
    }
    
    // 사용자 이름이 없으면 깔끔한 이메일 주소만 반환
    return originalEmail;
  }, [userNames, users]);

  // 선택된 유저의 표시 이름 가져오기 함수
  const getSelectedUserDisplayName = useCallback(() => {
    if (!selectedMessage) return '';
    
    return getUserName(selectedMessage.user);
  }, [selectedMessage, getUserName]);

  // 날짜를 한국어로 포맷팅하는 함수 (한국시간 사용)
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      // 한국시간으로 변환 (UTC+9)
      const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      
      const year = koreanTime.getFullYear();
      const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
      const day = String(koreanTime.getDate()).padStart(2, '0');
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[koreanTime.getDay()];
      
      return `${year}년 ${month}월 ${day}일 (${weekday})`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }, []);

  // 날짜가 같은지 확인하는 함수 (한국시간 기준)
  const isSameDate = (date1: string, date2: string) => {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      // 한국시간으로 변환
      const koreanD1 = new Date(d1.getTime() + (9 * 60 * 60 * 1000));
      const koreanD2 = new Date(d2.getTime() + (9 * 60 * 60 * 1000));
      
      return koreanD1.toDateString() === koreanD2.toDateString();
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  // 날짜와 시간을 함께 포맷팅하는 함수 (한국시간 사용)
  const formatDateAndTime = (timestamp: string) => {
    try {
      // timestamp가 YYYY-MM-DD HH:MM 형식인 경우
      if (timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        return timestamp;
      }
      
      // ISO 형식인 경우
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        // 한국시간으로 변환 (UTC+9)
        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const year = koreanTime.getFullYear();
        const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
        const day = String(koreanTime.getDate()).padStart(2, '0');
        const hours = String(koreanTime.getHours()).padStart(2, '0');
        const minutes = String(koreanTime.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      }
      
      return timestamp;
    } catch (error) {
      console.error('Date formatting error:', error);
      return timestamp;
    }
  };

  // 삭제 모드 토글 함수
  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setIsExportMode(false);
    setSelectedUsersForDelete(new Set());
    setSelectedUsersForExport(new Set());
  };

  // 저장 모드 토글 함수
  const toggleExportMode = () => {
    setIsExportMode(!isExportMode);
    setIsDeleteMode(false);
    setSelectedUsersForExport(new Set());
    setSelectedUsersForDelete(new Set());
  };

  // 유저 삭제 선택 토글 함수
  const toggleUserForDelete = (userEmail: string) => {
    const newSelected = new Set(selectedUsersForDelete);
    if (newSelected.has(userEmail)) {
      newSelected.delete(userEmail);
    } else {
      newSelected.add(userEmail);
    }
    setSelectedUsersForDelete(newSelected);
  };

  // 유저 저장 선택 토글 함수
  const toggleUserForExport = (userEmail: string) => {
    const newSelected = new Set(selectedUsersForExport);
    if (newSelected.has(userEmail)) {
      newSelected.delete(userEmail);
    } else {
      newSelected.add(userEmail);
    }
    setSelectedUsersForExport(newSelected);
  };

  // 선택된 유저들 삭제 함수
  const handleDeleteSelectedUsers = async () => {
    if (selectedUsersForDelete.size === 0) {
      alert('삭제할 유저를 선택해주세요.');
      return;
    }

    const userNames = Array.from(selectedUsersForDelete).map(email => getUserName(email));
    const confirmMessage = `다음 유저들의 모든 채팅 기록을 삭제하시겠습니까?\n\n${userNames.join('\n')}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // chatAPI를 통해 각 유저의 메시지 삭제
      const deletePromises = Array.from(selectedUsersForDelete).map(async (userEmail) => {
        try {
          const result = await chatAPI.deleteUserMessages(userEmail);
          console.log(`Deleted messages for ${userEmail}:`, result);
          return result;
        } catch (error) {
          console.error(`Error deleting messages for ${userEmail}:`, error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown',
            userEmail: userEmail
          });
          throw error;
        }
      });

      await Promise.all(deletePromises);

      // 로컬 상태에서 선택된 유저들의 메시지들 제거
      const updatedMessages = chatMessages.filter(msg => !selectedUsersForDelete.has(msg.user));
      onChatMessagesChange(updatedMessages);

      // 선택된 유저가 삭제된 경우 선택 해제
      if (selectedMessage && selectedUsersForDelete.has(selectedMessage.user)) {
        setSelectedMessage(null);
      }

      // 삭제 모드 종료 및 선택 초기화
      setIsDeleteMode(false);
      setSelectedUsersForDelete(new Set());

      const deletedUserNames = Array.from(selectedUsersForDelete).map(email => getUserName(email));
      console.log(`Successfully deleted chat messages for users: ${deletedUserNames.join(', ')}`);
      
      // 성공 메시지 표시
      alert(`다음 유저들의 채팅 기록이 성공적으로 삭제되었습니다:\n\n${deletedUserNames.join('\n')}`);
    } catch (error) {
      console.error('Error deleting user chats:', error);
      console.error('Main error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown'
      });
      alert('채팅 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 채팅 메시지를 파일로 저장하는 함수
  const handleExportMessages = async () => {
    if (!window.confirm('현재 채팅 메시지를 파일로 저장하시겠습니까?')) {
      return;
    }

    setIsExporting(true);
    try {
      const result = await chatAPI.exportMessages();
      // 파일 목록 새로고침
      await loadExportedFiles();
      setShowFileList(true);

      alert('채팅 메시지가 성공적으로 파일로 저장되었습니다.');
      console.log('Export result:', result);
    } catch (error) {
      console.error('Export error:', error);
      alert('파일 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // 선택된 유저들의 채팅 메시지를 파일로 저장하는 함수
  const handleExportSelectedUsers = async () => {
    if (selectedUsersForExport.size === 0) {
      alert('저장할 유저를 선택해주세요.');
      return;
    }

    const userNames = Array.from(selectedUsersForExport).map(email => getUserName(email));
    const confirmMessage = `다음 유저들의 채팅 메시지를 파일로 저장하시겠습니까?\n\n${userNames.join('\n')}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsExporting(true);
    try {
      console.log('🔄 선택된 유저들 채팅 메시지 저장 시작:', Array.from(selectedUsersForExport));
      
      const exportPromises = Array.from(selectedUsersForExport).map(async (userEmail) => {
        try {
          const result = await chatAPI.exportUserMessages(userEmail);
          console.log(`✅ ${userEmail} 채팅 메시지 저장 성공:`, result);
          return { success: true, userEmail, result };
        } catch (error) {
          console.error(`❌ ${userEmail} 채팅 메시지 저장 실패:`, error);
          return { success: false, userEmail, error };
        }
      });

      const exportResults = await Promise.all(exportPromises);
      const successfulExports = exportResults.filter(result => result.success);
      const failedExports = exportResults.filter(result => !result.success);

      if (successfulExports.length > 0) {
        const successfulUserNames = successfulExports.map(result => getUserName(result.userEmail));
        alert(`다음 유저들의 채팅 메시지가 성공적으로 파일로 저장되었습니다:\n\n${successfulUserNames.join('\n')}`);
      }
      
      if (failedExports.length > 0) {
        const failedUserNames = failedExports.map(result => getUserName(result.userEmail));
        alert(`일부 유저의 채팅 메시지 저장에 실패했습니다:\n\n${failedUserNames.join('\n')}\n\n성공한 저장만 완료되었습니다.`);
      }

      // 저장 모드 종료 및 선택 초기화
      setIsExportMode(false);
      setSelectedUsersForExport(new Set());

      // 파일 목록 새로고침
      await loadExportedFiles();
      setShowFileList(true);

      console.log('🎉 선택된 유저들 채팅 메시지 저장 완료:', {
        성공: successfulExports.length,
        실패: failedExports.length,
        총: selectedUsersForExport.size
      });
    } catch (error) {
      console.error('❌ 선택된 유저들 채팅 메시지 저장 중 오류:', error);
      console.error('오류 상세 정보:', {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : '스택 트레이스 없음',
        name: error instanceof Error ? error.name : '알 수 없는 오류 타입'
      });
      alert('파일 저장 중 오류가 발생했습니다. 다시 시도해주세요.\n\n오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsExporting(false);
    }
  };

  // 특정 유저의 채팅 메시지를 파일로 저장하는 함수
  const handleExportUserMessages = async (userEmail: string) => {
    const userName = getUserName(userEmail);
    if (!window.confirm(`'${userName}'님의 채팅 메시지를 파일로 저장하시겠습니까?`)) {
      return;
    }

    setIsExporting(true);
    try {
      console.log('🔄 사용자 채팅 메시지 저장 시작:', userEmail);
      const result = await chatAPI.exportUserMessages(userEmail);
      console.log('✅ 사용자 채팅 메시지 저장 성공:', result);
      
      // 저장된 파일 목록 새로고침
      await loadExportedFiles();
      
      // 저장된 파일 섹션 표시
      setShowFileList(true);
      
      alert(`${userName}님의 채팅 메시지가 성공적으로 파일로 저장되었습니다.`);
    } catch (error) {
      console.error('❌ 사용자 채팅 메시지 저장 오류:', error);
      console.error('오류 상세 정보:', {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : '스택 트레이스 없음',
        name: error instanceof Error ? error.name : '알 수 없는 오류 타입'
      });
      alert('파일 저장 중 오류가 발생했습니다.\n\n오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* 왼쪽 패널 - 메시지 목록 */}
      <div className="hidden md:flex md:w-80 bg-white border-r border-gray-200 flex-col rounded-l-lg">
        {/* 필터 탭 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({totalUserCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                대기 ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('answered')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'answered' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                답변중 ({inProgressCount})
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === 'closed' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                완료 ({completedCount})
              </button>
            </div>
            
          </div>

          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="유저를 검색해보세요."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* 유저 목록 - 채팅 대상 유저 목록 */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FontAwesomeIcon icon={faHeadset} className="text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">유저가 없어요</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* 고유한 유저 목록 생성 */}
              {Array.from(new Set(filteredMessages.map(msg => msg.user)))
                .filter(user => user !== '관리자') // 관리자 제외
                .map((user, index) => {
                  const userMessages = filteredMessages.filter(msg => msg.user === user);
                  const latestMessage = userMessages[userMessages.length - 1];
                  // const pendingCount = userMessages.filter(msg => msg.status === 'pending').length;
                  const isCompleted = isChatCompleted(user);
                  
                  return (
                    <div 
                      key={user || `user-${index}`}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.user === user ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                      } ${isCompleted ? 'opacity-60 bg-gray-100' : ''}`}
                      onClick={() => {
                        console.log('사용자 클릭으로 채팅창 열기:', {
                          user,
                          latestMessage,
                          latestMessageUser: latestMessage?.user,
                          latestMessageMessage: latestMessage?.message
                        });
                        setSelectedMessage(latestMessage);
                      }}
                    >
                      <div className="flex items-start gap-2 mb-0">

                        <div className="flex flex-col items-center justify-between">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{getInitials(user)}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-4">
                            {isDeleteMode && (
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={selectedUsersForDelete.has(user)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleUserForDelete(user);
                                  }}
                                  className="w-4 h-4 text-red-500 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-1"
                                />
                                <span className="text-xs text-red-600 font-medium">삭제</span>
                                {selectedUsersForDelete.has(user) && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                            {isExportMode && (
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={selectedUsersForExport.has(user)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleUserForExport(user);
                                  }}
                                  className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                                />
                                <span className="text-xs text-blue-600 font-medium">저장</span>
                                {selectedUsersForExport.has(user) && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                            {!isDeleteMode && !isExportMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportUserMessages(user);
                                }}
                                disabled={isExporting}
                                className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                                title="채팅 기록 저장"
                              >
                                {/* <FontAwesomeIcon icon={faDownload} className="text-xs" /> */}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col mb-1">
                              <div className="font-medium text-sm text-gray-900">{getUserName(user)}</div>
                              {getUserName(user) !== user && (
                                <div className="text-xs text-gray-400">{user.includes('_') ? user.split('_')[0] : user}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isCompleted ? (
                                <>
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xs" />
                                  <span className="text-xs text-green-600">채팅완료</span>
                                  
                                </>
                              ) : (
                                <>
                                  {getStatusIcon(latestMessage.status)}
                                  <span className="text-xs text-gray-600">{getDetailedStatusText(user, latestMessage.status)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1 overflow-hidden" title={latestMessage.message}>
                            <div className="w-[240px] truncate whitespace-nowrap overflow-hidden">
                              {latestMessage.message}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-1">
                            <div className="text-xs text-gray-400 ml-auto">
                              {formatDateAndTime(latestMessage.timestamp)}
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t border-gray-200 p-4">
          {!isDeleteMode && !isExportMode ? (
            <>
              <button
                onClick={toggleDeleteMode}
                className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-600 hover:underline transition-colors"
              >
                삭제하기
              </button>
              <button
                onClick={toggleExportMode}
                className="px-3 py-1 text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors"
              >
                저장하기
              </button>
              
              <button
                onClick={async () => {
                  console.log('🖱️ "저장된 파일" 버튼 클릭됨');
                  console.log('📊 현재 showFileList 상태:', showFileList);
                  console.log('📊 현재 exportedFiles 상태:', exportedFiles);
                  console.log('📊 exportedFiles 길이:', exportedFiles.length);
                  
                  // 파일 목록 새로고침
                  await loadExportedFiles();
                  
                  // 토글 상태 변경
                  const newShowFileList = !showFileList;
                  console.log('🔄 showFileList 상태 변경:', showFileList, '→', newShowFileList);
                  setShowFileList(newShowFileList);
                  
                  console.log('✅ "저장된 파일" 버튼 클릭 처리 완료');
                }}
                className="px-3 py-1 text-sm font-medium text-purple-500 hover:text-purple-600 hover:underline transition-colors"
              >
                저장된 파일
              </button>
            </>
          ) : isDeleteMode ? (
            <>
              <button
                onClick={handleDeleteSelectedUsers}
                disabled={selectedUsersForDelete.size === 0}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    삭제 중...
                  </>
                ) : (
                  `선택 삭제 (${selectedUsersForDelete.size})`
                )}
              </button>
              <button
                onClick={toggleDeleteMode}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </>
          ) : isExportMode ? (
            <>
              <button
                onClick={handleExportSelectedUsers}
                disabled={selectedUsersForExport.size === 0}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    저장 중...
                  </>
                ) : (
                  `선택 저장 (${selectedUsersForExport.size})`
                )}
              </button>
              <button
                onClick={toggleExportMode}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </>
                      ) : null}
        </div>

         {/* 저장된 파일 목록 */}
        {showFileList && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700">저장된 파일 목록</h4>
                <button
                  onClick={loadExportedFiles}
                  disabled={isExporting}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                  title="새로고침"
                >
                  <FontAwesomeIcon icon={faRefresh} className="text-sm" />
                </button>
              </div>
              <button
                onClick={() => setShowFileList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
            {exportedFiles.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faFileInvoice} className="text-2xl text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">저장된 파일이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {exportedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <div>크기: {(file.size / 1024).toFixed(1)}KB</div>
                        <div>생성: {new Date(file.created).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(file.name)}
                      className="ml-3 px-3 py-2 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                      title="다운로드"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-xs mr-1" />
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 중앙 패널 */}
      <div className="flex-1 bg-white border-r border-gray-200 flex flex-col relative">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">

          {/* 모바일 유저 선택 드롭다운 */}
          <div className="user-dropdown md:hidden relative w-full">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-3 bg-gray-100 
                hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {selectedMessage ? getSelectedUserDisplayName() : '유저 선택'}
              </span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`text-xs text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {/* 드롭다운 메뉴 */}
            {isUserDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg 
                    shadow-lg z-10 min-h-[300px] max-h-[600px] overflow-y-auto">
                {/* 필터 탭 */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex flex-wrap gap-1 mb-3">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'all' 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      전체 ({totalUserCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'pending' 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      대기 ({pendingCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('answered')}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'answered' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      답변중 ({inProgressCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('closed')}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        statusFilter === 'closed' 
                          ? 'bg-gray-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      완료 ({completedCount})
                    </button>
                  </div>
                  
                  {/* 검색 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="유저를 검색해보세요."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded text-xs
                        focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute right-2 top-2 text-gray-400 text-xs" />
                  </div>
                </div>
                
                {/* 유저 목록 */}
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredMessages.length === 0 ? (
                    <div className="p-4 text-center">
                      <FontAwesomeIcon icon={faHeadset} className="text-2xl text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500">유저가 없어요</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {Array.from(new Set(filteredMessages.map(msg => msg.user)))
                        .filter(user => user !== '관리자')
                        .map((user) => {
                          const userMessages = filteredMessages.filter(msg => msg.user === user);
                          const latestMessage = userMessages[userMessages.length - 1];
                          // const pendingCount = userMessages.filter(msg => msg.status === 'pending').length;
                          
                          return (
                            <div 
                              key={`export-${user}`}
                              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedMessage?.user === user ? 'bg-orange-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedMessage(latestMessage);
                                setIsUserDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{getInitials(user)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-col min-w-0">
                                      <div className="font-medium text-xs text-gray-900 truncate">{getUserName(user)}</div>
                                      {getUserName(user) !== user && (
                                        <div className="text-xs text-gray-400 truncate">{user}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {getStatusIcon(latestMessage.status)}
                                      <span className="text-xs text-gray-600">{getStatusText(latestMessage.status)}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1 overflow-hidden" title={latestMessage.message}>
                                    <div className="truncate whitespace-nowrap overflow-hidden">
                                      {latestMessage.message}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {formatDateAndTime(latestMessage.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="flex-1">
            {/* 선택된 유저 정보 */}
            {selectedMessage && (
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full hidden md:flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{getInitials(selectedMessage.user)}</span>
                </div>
                <div className="hidden md:block">
                  <h3 className="font-semibold text-gray-700 text-sm">{getSelectedUserDisplayName()}</h3>
                  {getSelectedUserDisplayName() !== selectedMessage.user && (
                    <p className="text-xs text-gray-500">{selectedMessage.user}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <div className="relative inline-block group">
                    <button
                      onClick={() => handleCloseChat(selectedMessage)}
                      disabled={selectedMessage.status === 'closed' || isChatCompleted(selectedMessage.user)}
                      className={`sm:px-3 sm:py-3 px-1 py-1 sm:text-sm text-[12px] rounded-lg w-[36px] sm:w-[80px] ${
                        selectedMessage.status === 'closed' || isChatCompleted(selectedMessage.user)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {selectedMessage.status === 'closed' || isChatCompleted(selectedMessage.user) ? '답변종료' : '답변완료'}
                    </button>
                    {selectedMessage.status !== 'closed' && !isChatCompleted(selectedMessage.user) && (
                      <div className="absolute bottom-[40px] right-0 mb-2 px-2 py-1 bg-gray-800 
                        text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity 
                          duration-0 pointer-events-none whitespace-nowrap z-1000">
                        답변완료를 누르시면 채팅이 종료됩니다.
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 오른쪽 패널 토글 버튼 */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="ml-1 p-2 text-gray-500 border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center
              hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title={isRightPanelCollapsed ? "오른쪽 패널 펼치기" : "오른쪽 패널 접기"}
          >
            <FontAwesomeIcon 
              icon={isRightPanelCollapsed ? faChevronLeft : faChevronRight} 
              className="text-xs w-3 h-3 text-gray-400 hover:text-gray-700" 
            />
          </button>
        </div>

        {/* 채팅 메시지 영역 */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {!selectedMessage ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FontAwesomeIcon icon={faHeadset} className="text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">왼쪽에서 유저를 선택해주세요</p>
              </div>
            </div>
          ) : (
            <>
              {/* 안내글 상단 고정 (결제취소 요청인 경우만) */}
              {selectedMessage.inquiryType === 'payment_cancellation' && (
                <div className="mb-4">
                  <div className="bg-orange-100 text-orange-800 rounded-lg px-4 py-3 text-sm font-semibold">
                    결제취소 요청을 확인했습니다. 취소사유를 입력해주시면 처리해드리겠습니다.
                  </div>
                </div>
              )}
              
              {/* 실제 채팅 메시지 */}
              <div className="space-y-4">
                {chatMessages
                  .filter(msg => {
                    // selectedMessage.user가 유효한 경우에만 필터링
                    if (!selectedMessage || !selectedMessage.user) {
                      console.log('메시지 필터링: selectedMessage가 없음', {
                        selectedMessage,
                        msgUser: msg.user,
                        msgMessage: msg.message
                      });
                      return false; // 선택된 사용자가 없으면 메시지 표시 안함
                    }
                    
                    // 선택된 사용자의 메시지만 표시 (관리자 메시지 중복 제거)
                    const isRelevantMessage = msg.user === selectedMessage.user;
                    console.log('메시지 필터링:', {
                      selectedUser: selectedMessage.user,
                      msgUser: msg.user,
                      msgMessage: msg.message,
                      isRelevant: isRelevantMessage
                    });
                    return isRelevantMessage;
                  })
                  .sort((a, b) => {
                    // timestamp가 YYYY-MM-DD HH:MM 형식인 경우와 ISO 형식인 경우를 모두 처리
                    const dateA = new Date(a.timestamp.replace(' ', 'T'));
                    const dateB = new Date(b.timestamp.replace(' ', 'T'));
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((message, idx, messages) => {
                    // message.id가 undefined일 수 있으므로 안전한 키 생성
                    const safeKey = message.id || `msg-${idx}-${message.timestamp}-${message.user}`;
                    
                    // 날짜 구분선 렌더링
                    const showDateDivider = () => {
                      if (idx === 0) {
                        // 첫 번째 메시지인 경우 해당 날짜 표시
                        return (
                          <div key={`date-${safeKey}-${idx}`} className="flex justify-center mb-4">
                            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                        );
                      }
                      
                      // 이전 메시지와 날짜가 다른 경우 날짜 구분선 표시
                      const currentMsgDate = message.timestamp;
                      const prevMsgDate = messages[idx - 1]?.timestamp;
                      
                      if (prevMsgDate && !isSameDate(currentMsgDate, prevMsgDate)) {
                        return (
                          <div key={`date-${safeKey}-${idx}`} className="flex justify-center mb-4">
                            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                              {formatDate(currentMsgDate)}
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    };

                    const dateDivider = showDateDivider();

                    return (
                      <React.Fragment key={safeKey}>
                        {dateDivider}
                        <div className={`flex flex-col ${
                          (message.message === '유저가 채팅종료를 하였습니다.' || message.message === '관리자가 답변을 완료하였습니다.') 
                            ? 'items-center' 
                            : (message.type === 'admin' ? 'items-end' : 'items-start')
                        }`}>
                          {message.type === 'user' && message.message !== '유저가 채팅종료를 하였습니다.' && (
                            <div className="relative flex flex-row items-center mb-1 ml-0">
                              {/* <div className="absolute top-0.5 left-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-300 mr-2">
                                <span className="text-xs font-bold text-gray-600">
                                  {getInitials(message.user)}
                                </span>
                              </div> */}
                              <span className="ml-0 text-xs font-bold text-gray-700">
                                {getUserName(message.user)}
                              </span>
                            </div>
                          )}
                          <div className={`${
                            (message.message === '유저가 채팅종료를 하였습니다.' || message.message === '관리자가 답변을 완료하였습니다.') 
                              ? 'w-full' 
                              : 'max-w-[60%]'
                          } ${
                            (message.message === '유저가 채팅종료를 하였습니다.' || message.message === '관리자가 답변을 완료하였습니다.') 
                              ? 'mx-auto' 
                              : (message.type === 'admin' ? 'ml-auto' : 'ml-0')
                          }`}>
                            {/* "유저가 채팅종료를 하였습니다." 또는 "관리자가 답변을 완료하였습니다." 메시지 특별 스타일링 */}
                            {(message.message === '유저가 채팅종료를 하였습니다.' || message.message === '관리자가 답변을 완료하였습니다.') ? (
                              <div className="flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center px-4 pt-3 pb-1 rounded-full w-full">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {message.message === '유저가 채팅종료를 하였습니다.' 
                                      ? '유저가 채팅종료를 하였습니다' 
                                      : '관리자가 답변을 완료하였습니다'}
                                  </span>
                                </div>
                                {/* 채팅 종료/답변완료 메시지의 시간 표시 */}
                                <div className="text-xs text-gray-500 text-center mt-1 w-full">
                                  {(() => {
                                    try {
                                      // timestamp가 YYYY-MM-DD HH:MM 형식인 경우
                                      if (message.timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
                                        const [datePart, timePart] = message.timestamp.split(' ');
                                        return timePart;
                                      }
                                      
                                      // ISO 형식인 경우
                                      const date = new Date(message.timestamp);
                                      if (!isNaN(date.getTime())) {
                                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                      }
                                      
                                      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    } catch (error) {
                                      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className={`rounded-lg px-3 py-2 ${
                                  message.type === 'admin' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-gray-200 text-gray-900'
                                }`}>
                                  {/* 파일이 있는 경우 파일 표시 */}
                                  {message.file && message.fileType && message.fileType.startsWith('image/') ? (
                                    <div className="mb-2">
                                      <img 
                                        src={message.file} 
                                        alt="첨부된 이미지" 
                                        className="max-w-full h-auto rounded-lg"
                                        style={{ maxHeight: '200px' }}
                                      />
                                    </div>
                                  ) : message.file && message.fileName ? (
                                    <div className="mb-2 p-2 bg-gray-100 rounded border">
                                      <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faFileInvoice} className="text-gray-500" />
                                        <span className="text-sm">첨부파일</span>
                                      </div>
                                    </div>
                                  ) : null}
                                  
                                  {message.message && (
                                    <div className="text-sm leading-relaxed whitespace-normal break-words">
                                      {message.message.split('\n').map((line, index) => (
                                        <div key={index} style={{ display: 'block', wordBreak: 'break-word' }}>
                                          {line}
                                          {index < (message.message?.split('\n').length || 0) - 1 && <br />}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* "유저가 채팅종료를 하였습니다." 또는 "관리자가 답변을 완료하였습니다." 메시지는 타임스탬프 표시하지 않음 */}
                                {message.message !== '유저가 채팅종료를 하였습니다.' && message.message !== '관리자가 답변을 완료하였습니다.' && (
                                  <div className={`text-xs text-gray-500 mt-1 ${
                                    message.type === 'admin' ? 'text-right' : 'text-left'
                                  }`}>
                                    {(() => {
                                      try {
                                        // timestamp가 YYYY-MM-DD HH:MM 형식인 경우
                                        if (message.timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
                                          const [datePart, timePart] = message.timestamp.split(' ');
                                          return timePart;
                                        }
                                        
                                        // ISO 형식인 경우
                                        const date = new Date(message.timestamp);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }
                                        
                                        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                      } catch (error) {
                                        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                      }
                                    })()}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
              

              </div>
            </>
          )}
        </div>

        {/* 하단 메시지 입력 */}
        <div className="border-t border-gray-200 p-4 bg-white">
          {!selectedMessage ? (
            <div className="flex items-center justify-center h-20 text-gray-500">
              <p>유저를 선택하여 메시지를 보내세요</p>
            </div>
          ) : selectedMessage.status === 'closed' ? (
            <div className="flex items-center justify-center h-24 text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-gray-400 mb-2" />
                <p className="text-sm font-medium">채팅이 종료되었습니다</p>
                <p className="text-xs text-gray-400 mt-1">더 이상 메시지를 주고받을 수 없습니다</p>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="inquiry-message-input-container relative min-h-[36px] !h-auto bg-white rounded-lg"
                style={{ height: 'auto', minHeight: '36px' }}
              >
                {/* 파일 미리보기 */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {filePreview ? (
                          <img src={filePreview} alt="미리보기" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <FontAwesomeIcon icon={faFileInvoice} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={handleFileRemove}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  </div>
                )}
                {/* 채팅 완료 시 입력창 비활성화 오버레이 */}
                {selectedMessage && isChatCompleted(selectedMessage.user) && (
                  <div className="absolute inset-0 bg-gray-50 bg-opacity-100 flex flex-col items-center justify-center 
                      rounded-lg z-10 min-h-[50px]">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-gray-400 mb-3" />
                    <p className="text-gray-600 text-sm font-medium">채팅이 종료되었습니다</p>
                    <span className="text-gray-400 text-xs font-medium">더 이상 메시지를 주고받을 수 없습니다</span>
                  </div>
                )}
                
                <div className={`relative pr-20 flex items-center transition-all duration-200 ${
                  !selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))
                    ? 'opacity-60'
                    : ''
                }`}>
                  {!selectedMessage && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-50 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        <span>메시지를 보낼 사용자를 선택해주세요</span>
                      </div>
                    </div>
                  )}
                  {selectedMessage && isChatCompleted(selectedMessage.user) && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-50 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        <span>채팅이 종료되었습니다</span>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleMessageInputKeyDown}
                    rows={1}
                    placeholder={!selectedMessage ? "메시지를 보낼 사용자를 선택해주세요" : 
                      (selectedMessage && isChatCompleted(selectedMessage.user) ? "채팅이 종료되었습니다" : 
                      `메시지를 입력하세요. (Enter: 줄바꿈 / Ctrl+Enter: 전송)`)}
                    className={`w-full pl-4 pr-4 py-2 bg-transparent border resize-none
                      focus:outline-none focus:ring-2 text-xs placeholder-gray-400 h-[48px] rounded-lg overflow-hidden transition-all duration-200 ${
                        !selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))
                          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-gray-200 h-[80px]'
                          : 'border-gray-300 focus:ring-orange-500'
                      }`}
                    disabled={!selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))}
                  />
                  <div className="flex items-center justify-end absolute bottom-[6px] right-[6px] gap-2">
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))}
                      className={`transition-colors flex items-center gap-2 p-2 rounded-lg ${
                        !selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FontAwesomeIcon 
                        icon={faPaperclip} 
                        className={`text-base transition-colors ${
                          !selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))
                            ? 'text-gray-300'
                            : 'text-gray-400 hover:text-gray-700'
                        }`} 
                      />
                      {/* 파일첨부 */}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      disabled={!selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))}
                    />
                  </div>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!selectedMessage || (!messageInput.trim() && !selectedFile) || isSending || (selectedMessage && isChatCompleted(selectedMessage.user))}
                    className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                      !selectedMessage || (selectedMessage && isChatCompleted(selectedMessage.user))
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : (messageInput.trim() || selectedFile) && !isSending
                          ? 'text-white bg-orange-500 hover:bg-orange-600 shadow-sm' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FontAwesomeIcon 
                      icon={faPaperPlane} 
                      className={`text-base transition-colors ${
                        selectedMessage && isChatCompleted(selectedMessage.user)
                          ? 'text-gray-400'
                          : ''
                      }`} 
                    />
                    {/* <span>{isSending ? '전송중...' : '전송'}</span> */}
                  </button>
                </div>
              </div>
            </div>
              
            </>
          )}
        </div>
      </div>

            {/* 모바일/태블릿에서 오른쪽 패널 오버레이 */}
      <div className={`lg:hidden fixed inset-0 bg-black bg-opacity-10 z-30 transition-opacity duration-300 ${
        isRightPanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`} onClick={() => setIsRightPanelCollapsed(true)} />
      
      {/* 오른쪽 패널 - 전문가 정보 */}
      <div className={`bg-white flex flex-col rounded-r-lg transition-all duration-300 ${
        isRightPanelCollapsed 
          ? 'w-0 overflow-hidden' 
          : 'w-80'
      } absolute lg:relative right-0 top-0 h-full z-50 lg:z-auto lg:right-auto lg:top-auto lg:h-auto lg:top-0 lg:h-full`}>
        <div className="h-full overflow-y-auto p-6">
          {/* 전문가 프로필 */}
          <div className="flex items-center justify-start text-center mb-6 gap-2">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <div className="flex flex-col items-start justify-left">
              <div className="inline-block bg-orange-100 text-orange-800 px-2 py-[2px] rounded-full text-[10px] font-medium mb-1">
                관리자
              </div>
              <p className="text-[11px] text-gray-600">주식회사 일마레</p>
              <h3 className="text-sm font-semibold text-gray-900">애드모어</h3>
            </div>
          </div>

          {/* 연락 정보 */}
          <div className="mb-6">
            <div className="flex flex-row justify-between items-center gap-2">
              <div className="w-1/2 h-[72px] flex flex-col justify-between items-center bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">연락 가능 시간</div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm text-gray-600 font-medium">10:00~18:00</span>
                  <span className="text-xs text-gray-400"> (주말/공휴일 휴무)</span>
                </div>
              </div>
              <div className="w-1/2 h-[72px] flex flex-col justify-between items-center bg-gray-50 rounded-lg p-2">
                <span className="text-xs text-gray-600">평균 응답 시간</span>
                <span className="text-sm font-medium text-green-600">30분 이내</span>
              </div>
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">거래 정보</h4>
            {selectedMessage && selectedMessage.inquiryType === 'payment_cancellation' && selectedMessage.paymentInfo ? (
              // 결제취소 요청 정보
              <div className="hidden border border-gray-200 rounded-lg p-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faCreditCard} className="text-red-500" />
                    <span className="text-sm font-medium text-red-600">결제취소 요청</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">결제번호:</span>
                      <span className="text-xs font-medium">{selectedMessage.paymentInfo.paymentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">상품명:</span>
                      <span className="text-xs font-medium">{selectedMessage.paymentInfo.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">결제금액:</span>
                      <span className="text-xs font-bold text-red-600">{selectedMessage.paymentInfo.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">결제일:</span>
                      <span className="text-xs font-medium">{selectedMessage.paymentInfo.paymentDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 상품 정보
              <div className="hidden border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full h-40 bg-red-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src="/images/product_02.png" alt="youtube" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">유튜브 마케팅</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      유튜브 구독자, 조회수, 쇼츠 시청시간, 수익창출
                    </p>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-xs text-gray-600">주문번호: 20250729-0001</span>
                      <span className="text-xs text-gray-600">주문일시: 2025-07-29 10:00</span>
                      <span className="text-xs text-gray-600">주문상태: 주문완료</span>
                      <span className="text-xs text-gray-600">수량: 7일</span>
                      <span className="text-sm font-bold text-orange-600">가격정보: 5,000원</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-gray-400">준비중입니다.</span>
              </div>
            </div>
          </div>
          
        </div> 
      </div>

      {/* 답변 모달 */}
      {showReplyModal && replyingToMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">답변 작성</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{replyingToMessage.message}</p>
                {replyingToMessage.productInfo && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">관련 상품:</span> {replyingToMessage.productInfo}
                    </p>
                  </div>
                )}
              </div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="답변 내용을 입력하세요."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={handleCancelReply} 
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitReply} 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                답변 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅종료 확인 모달 */}
      {showCloseConfirmModal && closingMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">답변 완료</h3>
            </div>
            <p className="text-gray-700 mb-6">
              <strong>{closingMessage.user}</strong>님의 문의에 대한 답변이 완료되었습니까?
              <br />
              <span className="text-sm text-gray-500">
                완료 처리 후에는 더 이상 메시지를 주고받을 수 없습니다.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelCloseChat} 
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={confirmCloseChat} 
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                답변 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryManagement; 