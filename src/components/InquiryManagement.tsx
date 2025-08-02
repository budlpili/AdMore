import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faTrash, faClock, faPhone, faEnvelope, faCheckCircle, faHourglassHalf, faExclamationCircle, faSearch, faStar, faShieldAlt, faExclamationTriangle, faUser, faBuilding, faFileInvoice, faChartLine, faCreditCard, faXmark, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
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
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // 선택된 메시지가 변경될 때 유저 이름 가져오기
  useEffect(() => {
    if (selectedMessage && selectedMessage.user !== '관리자') {
      getUserName(selectedMessage.user);
    }
  }, [selectedMessage, users]);

  // 저장된 파일 목록 가져오기
  const loadExportedFiles = async () => {
    try {
      const result = await chatAPI.getExports();
      setExportedFiles(result.files || []);
    } catch (error) {
      console.error('파일 목록 로드 오류:', error);
    }
  };

  // 파일 다운로드 함수
  const handleDownloadFile = (filename: string) => {
    try {
      chatAPI.downloadFile(filename);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
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
    const latestMessage = messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    return {
      ...latestMessage,
      user,
      // 해당 사용자의 모든 메시지 개수
      messageCount: messages.length,
      // 해당 사용자의 관리자 응답 개수
      adminResponseCount: messages.filter(msg => msg.type === 'admin').length
    };
  });

  // 필터링된 대표 메시지 계산
  const filteredMessages = representativeMessages.filter(message => {
    const matchesSearch = searchTerm === '' || 
      message.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 통계 계산
  const totalUserCount = Object.keys(userMessages).length;
  const pendingCount = representativeMessages.filter(msg => msg.adminResponseCount === 0).length;
  const inProgressCount = representativeMessages.filter(msg => msg.adminResponseCount > 0).length;
  const completedCount = 0; // 현재는 완료 상태를 추적하지 않음

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
      const updatedMessages = chatMessages.map(msg => 
        msg.user === closingMessage.user ? { ...msg, status: 'closed' as const } : msg
      );
      onChatMessagesChange(updatedMessages);
      
      // selectedMessage도 업데이트
      const updatedSelectedMessage = { ...closingMessage, status: 'closed' as const };
      setSelectedMessage(updatedSelectedMessage);
      
      setShowCloseConfirmModal(false);
      setClosingMessage(null);
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
    if ((!messageInput.trim() && !selectedFile) || !selectedMessage || isSending) return;

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

    // 입력창 비우기
    setMessageInput('');

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
        return '답변완료';
      default:
        return '답변대기';
    }
  };

  // 이메일에서 이니셜 추출 함수
  const getInitials = (email: string) => {
    if (!email || typeof email !== 'string') return '?';
    if (!email.includes('@')) return email.charAt(0).toUpperCase();
    const localPart = email.split('@')[0];
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
  const getUserName = (email: string) => {
    if (userNames[email]) return userNames[email];
    
    // users 배열에서 해당 이메일의 유저 찾기
    const user = users.find(u => u.email === email);
    if (user && user.name) {
      setUserNames(prev => ({ ...prev, [email]: user.name }));
      return user.name;
    }
    
    return email;
  };

  // 선택된 유저의 표시 이름 가져오기 함수
  const getSelectedUserDisplayName = () => {
    if (!selectedMessage) return '';
    
    return getUserName(selectedMessage.user);
  };

  // 날짜 형식 통일 함수 (KST로 변환)
  const formatTimestamp = (timestamp: string) => {
    try {
      // 백엔드에서 KST로 저장된 시간을 올바르게 파싱
      const date = new Date(timestamp + ':00');
      
      if (!isNaN(date.getTime())) {
        // 24시간 형식으로 시간만 표시 (HH:MM)
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      return timestamp;
    } catch (error) {
      console.error('Timestamp formatting error:', error);
      return timestamp;
    }
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

  // 날짜와 시간을 함께 포맷팅하는 함수
  const formatDateAndTime = (timestamp: string) => {
    try {
      // timestamp가 YYYY-MM-DD HH:MM 형식인 경우
      if (timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        return timestamp;
      }
      
      // ISO 형식인 경우
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
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
      // 백엔드 API를 통해 각 유저의 메시지 삭제
      const deletePromises = Array.from(selectedUsersForDelete).map(async (userEmail) => {
        const response = await fetch(`http://localhost:5001/api/chat/messages/user/${encodeURIComponent(userEmail)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete messages for ${userEmail}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Deleted messages for ${userEmail}:`, result);
        return result;
      });

      await Promise.all(deletePromises);

      // 로컬 상태에서 선택된 유저들의 메시지들 제거
      const updatedMessages = chatMessages.filter(msg => !selectedUsersForDelete.has(msg.user));
      onChatMessagesChange(updatedMessages);

      // 만약 삭제된 유저 중에 현재 선택된 유저가 있다면 선택 해제
      if (selectedMessage && selectedUsersForDelete.has(selectedMessage.user)) {
        setSelectedMessage(null);
      }

      // 삭제 모드 종료 및 선택 초기화
      setIsDeleteMode(false);
      setSelectedUsersForDelete(new Set());

      console.log(`Successfully deleted chat messages for users: ${Array.from(selectedUsersForDelete).join(', ')}`);
    } catch (error) {
      console.error('Error deleting user chats:', error);
      alert('채팅 삭제 중 오류가 발생했습니다.');
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
      const exportPromises = Array.from(selectedUsersForExport).map(async (userEmail) => {
        const result = await chatAPI.exportUserMessages(userEmail);
        console.log(`Exported messages for ${userEmail}:`, result);
        return result;
      });

      await Promise.all(exportPromises);

      // 저장 모드 종료 및 선택 초기화
      setIsExportMode(false);
      setSelectedUsersForExport(new Set());

      // 파일 목록 새로고침
      await loadExportedFiles();
      setShowFileList(true);

      alert('선택된 유저들의 채팅 메시지가 성공적으로 파일로 저장되었습니다.');
    } catch (error) {
      console.error('Export error:', error);
      alert('파일 저장 중 오류가 발생했습니다.');
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
      const result = await chatAPI.exportUserMessages(userEmail);
      alert(`${userName}님의 채팅 메시지가 성공적으로 파일로 저장되었습니다.`);
      console.log('Export user result:', result);
    } catch (error) {
      console.error('Export user error:', error);
      alert('파일 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] w-full bg-gray-50 border border-gray-200 rounded-lg">
      {/* 왼쪽 패널 - 메시지 목록 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col rounded-l-lg">
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
                .map((user) => {
                  const userMessages = filteredMessages.filter(msg => msg.user === user);
                  const latestMessage = userMessages[userMessages.length - 1];
                  const pendingCount = userMessages.filter(msg => msg.status === 'pending').length;
                  
                  return (
                    <div 
                      key={user}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.user === user ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedMessage(latestMessage)}
                    >
                      <div className="flex items-start gap-2 mb-0">

                        <div className="flex flex-col items-center justify-between min-h-[80px]">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{getInitials(user)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isDeleteMode && (
                              <input
                                type="checkbox"
                                checked={selectedUsersForDelete.has(user)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleUserForDelete(user);
                                }}
                                className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-1"
                              />
                            )}
                            {isExportMode && (
                              <input
                                type="checkbox"
                                checked={selectedUsersForExport.has(user)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleUserForExport(user);
                                }}
                                className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                              />
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
                                <div className="text-xs text-gray-400">{user}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(latestMessage.status)}
                              <span className="text-xs text-gray-600">{getStatusText(latestMessage.status)}</span>
                              {pendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  {pendingCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 truncate mt-1">
                            {latestMessage.message}
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
                 onClick={() => {
                   loadExportedFiles();
                   setShowFileList(!showFileList);
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
                 className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                 선택 삭제 ({selectedUsersForDelete.size})
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
                 className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
               >
                 선택 저장 ({selectedUsersForExport.size})
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
             <h4 className="text-xs font-medium text-gray-700 mb-2">저장된 파일 목록</h4>
             {exportedFiles.length === 0 ? (
               <p className="text-sm text-gray-500">저장된 파일이 없습니다.</p>
             ) : (
               <div className="space-y-2 max-h-40 overflow-y-auto">
                 {exportedFiles.map((file, index) => (
                   <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-gray-900">{file.name}</span>
                       </div>
                       <div className="text-xs text-gray-500 mt-1">
                         크기: {(file.size / 1024).toFixed(1)}KB | 
                         생성: {new Date(file.created).toLocaleString('ko-KR', {
                           year: 'numeric',
                           month: '2-digit',
                           day: '2-digit',
                           hour: '2-digit',
                           minute: '2-digit'
                         })}
                       </div>
                     </div>
                     <button
                       onClick={() => handleDownloadFile(file.name)}
                       className="w-8 h-8 ml-2 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                       title="다운로드"
                     >
                       <FontAwesomeIcon icon={faDownload} className="text-xs" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
         )}
       </div>

      {/* 중앙 패널 */}
      <div className="flex-1 bg-white border-r border-gray-200 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            {/* 선택된 유저 정보 */}
            {selectedMessage && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{getInitials(selectedMessage.user)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">{getSelectedUserDisplayName()}</h3>
                  {getSelectedUserDisplayName() !== selectedMessage.user && (
                    <p className="text-xs text-gray-500">{selectedMessage.user}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => handleCloseChat(selectedMessage)}
                    disabled={selectedMessage.status === 'closed'}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      selectedMessage.status === 'closed'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {selectedMessage.status === 'closed' ? '답변완료됨' : '답변완료'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 오른쪽 패널 토글 버튼 */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="ml-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isRightPanelCollapsed ? "오른쪽 패널 펼치기" : "오른쪽 패널 접기"}
          >
            <FontAwesomeIcon 
              icon={isRightPanelCollapsed ? faChevronLeft : faChevronRight} 
              className="text-sm" 
            />
          </button>
        </div>

        {/* 채팅 메시지 영역 */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
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
                    // 선택된 사용자의 메시지이거나, 관리자 메시지
                    const isRelevantMessage = msg.user === selectedMessage.user || msg.user === '관리자';
                    console.log('메시지 필터링:', msg.id, msg.user, msg.message, isRelevantMessage);
                    return isRelevantMessage;
                  })
                  .sort((a, b) => {
                    // timestamp가 YYYY-MM-DD HH:MM 형식인 경우와 ISO 형식인 경우를 모두 처리
                    const dateA = new Date(a.timestamp.replace(' ', 'T'));
                    const dateB = new Date(b.timestamp.replace(' ', 'T'));
                    return dateA.getTime() - dateB.getTime();
                  })
                  .map((message, idx, messages) => {
                    // 날짜 구분선 렌더링
                    const showDateDivider = () => {
                      if (idx === 0) {
                        // 첫 번째 메시지인 경우 해당 날짜 표시
                        return (
                          <div key={`date-${message.id}-${idx}`} className="flex justify-center mb-4">
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
                          <div key={`date-${message.id}-${idx}`} className="flex justify-center mb-4">
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
                      <React.Fragment key={`${message.id}-${idx}`}>
                        {dateDivider}
                        <div className={`flex flex-col ${message.type === 'admin' ? 'items-end' : 'items-start'}`}>
                          {message.type === 'user' && (
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
                          <div className={`max-w-[70%] ${message.type === 'admin' ? 'ml-auto' : 'ml-0'}`}>
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
                                <div className="text-sm leading-relaxed whitespace-normal">
                                  {message.message.split('\n').map((line, index) => (
                                    <div key={index} style={{ display: 'block', wordBreak: 'normal' }}>
                                      {line}
                                      {index < (message.message?.split('\n').length || 0) - 1 && <br />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
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
                        </div>
                      </React.Fragment>
                    );
                  })}
              
                {/* 답변완료 상태일 때 채팅 내용 맨 마지막에 안내 메시지 표시 */}
                {selectedMessage.status === 'closed' && (
                  <div className="flex justify-center pt-4 relative">
                    <div className="px-4 py-3 text-center bg-gray-100 rounded-full w-full">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">채팅이 종료되었습니다</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 하단 메시지 입력 */}
        <div className="border-t border-gray-200 p-4">
          {!selectedMessage ? (
            <div className="flex items-center justify-center h-20 text-gray-500">
              <p>유저를 선택하여 메시지를 보내세요</p>
            </div>
          ) : selectedMessage.status === 'closed' ? (
            <div className="flex items-center justify-center h-20 text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-gray-400 mb-2" />
                <p className="text-sm font-medium">채팅이 종료되었습니다</p>
                <p className="text-xs text-gray-400 mt-1">더 이상 메시지를 주고받을 수 없습니다</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleMessageInputKeyDown}
                  rows={1}
                  placeholder={`메시지를 입력하세요. (Enter: 줄바꿈 / Ctrl+Enter: 전송)`}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg resize-none
                    focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                
                {/* 파일 미리보기 */}
                {selectedFile && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
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
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-800 
                      border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    파일첨부
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && !selectedFile) || isSending}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    (messageInput.trim() || selectedFile) && !isSending
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>{isSending ? '전송중...' : '전송'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 오른쪽 패널 - 전문가 정보 */}
      <div className={`bg-white flex flex-col rounded-r-lg transition-all duration-300 ${
        isRightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-80'
      }`}>
        <div className="flex-1 overflow-y-auto p-6">
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
              <div className="border border-gray-200 rounded-lg p-3">
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
              <div className="border border-gray-200 rounded-lg p-3">
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