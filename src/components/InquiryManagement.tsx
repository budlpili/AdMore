import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faTrash, faClock, faPhone, faEnvelope, faCheckCircle, faHourglassHalf, faExclamationCircle, faSearch, faStar, faShieldAlt, faExclamationTriangle, faUser, faBuilding, faFileInvoice, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  productInfo?: string;
  status?: 'pending' | 'answered' | 'closed';
}

interface InquiryManagementProps {
  chatMessages: ChatMessage[];
  onChatMessagesChange: (messages: ChatMessage[]) => void;
}

const InquiryManagement: React.FC<InquiryManagementProps> = ({
  chatMessages,
  onChatMessagesChange
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

  // 샘플 데이터가 없을 경우 기본 데이터 추가
  React.useEffect(() => {
    if (chatMessages.length === 0) {
      const sampleMessages: ChatMessage[] = [
        {
          id: '1',
          user: '김철수',
          message: '유튜브 구독자 수가 제대로 증가하지 않는 것 같아요. 확인해주세요.',
          timestamp: '2025-01-15 14:30',
          type: 'user',
          status: 'pending',
          productInfo: '유튜브 마케팅 - 구독자 증가'
        },
        {
          id: '2',
          user: '이영희',
          message: '결제가 완료되었는데 서비스가 시작되지 않았어요.',
          timestamp: '2025-01-15 15:20',
          type: 'user',
          status: 'pending',
          productInfo: '인스타그램 팔로워 증가'
        },
        {
          id: '3',
          user: '박민수',
          message: '서비스 이용 중 문제가 발생했습니다. 도움이 필요해요.',
          timestamp: '2025-01-15 16:10',
          type: 'user',
          status: 'answered',
          productInfo: '틱톡 뷰 증가'
        },
        {
          id: '4',
          user: '관리자',
          message: '안녕하세요. 문제를 확인해보겠습니다. 잠시만 기다려주세요.',
          timestamp: '2025-01-15 16:15',
          type: 'admin',
          status: 'answered',
          productInfo: '틱톡 뷰 증가'
        }
      ];
      onChatMessagesChange(sampleMessages);
    }
  }, [chatMessages.length, onChatMessagesChange]);

  // 선택된 유저가 변경되거나 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current && selectedMessage) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages, selectedMessage]);

  const deleteChatMessage = (messageId: string) => {
    const updatedMessages = chatMessages.filter(message => message.id !== messageId);
    onChatMessagesChange(updatedMessages);
  };

  const handleReplyClick = (message: ChatMessage) => {
    setReplyingToMessage(message);
    setReplyContent('');
    setShowReplyModal(true);
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !replyingToMessage) return;
    const newReply: ChatMessage = {
      id: `reply_${Date.now()}`,
      user: '관리자',
      message: replyContent,
      timestamp: new Date().toLocaleString('ko-KR'),
      type: 'admin',
      productInfo: replyingToMessage.productInfo,
      status: 'answered'
    };
    const updatedMessages = chatMessages.map(msg => 
      msg.id === replyingToMessage.id ? { ...msg, status: 'answered' as const } : msg
    );
    onChatMessagesChange([...updatedMessages, newReply]);
    setShowReplyModal(false);
    setReplyContent('');
    setReplyingToMessage(null);
  };

  const handleCancelReply = () => {
    setShowReplyModal(false);
    setReplyContent('');
    setReplyingToMessage(null);
  };

  const handleCloseChat = (message: ChatMessage) => {
    setClosingMessage(message);
    setShowCloseConfirmModal(true);
  };

  const confirmCloseChat = () => {
    if (!closingMessage) return;
    
    // 해당 유저의 모든 메시지 상태를 'closed'로 변경
    const updatedMessages = chatMessages.map(msg => 
      msg.user === closingMessage.user ? { ...msg, status: 'closed' as const } : msg
    );
    onChatMessagesChange(updatedMessages);
    
    setShowCloseConfirmModal(false);
    setClosingMessage(null);
  };

  const cancelCloseChat = () => {
    setShowCloseConfirmModal(false);
    setClosingMessage(null);
  };

  const handleStatusChange = (messageId: string, newStatus: 'pending' | 'answered' | 'closed') => {
    const updatedMessages = chatMessages.map(message => 
      message.id === messageId ? { ...message, status: newStatus as 'pending' | 'answered' | 'closed' } : message
    );
    onChatMessagesChange(updatedMessages);
  };

  const handleMessageInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        // Ctrl+Enter: 전송
        e.preventDefault();
        handleSendMessage();
      }
      // Enter만: 줄바꿈 (기본 동작)
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) {
      return;
    }
    
    if (!selectedMessage) {
      return;
    }
    
    const newMessage: ChatMessage = {
      id: `message_${Date.now()}`,
      user: '관리자',
      message: messageInput,
      timestamp: new Date().toLocaleString('ko-KR'),
      type: 'admin',
      status: 'answered',
      productInfo: selectedMessage.productInfo
    };
    
    // 선택된 유저의 메시지 상태를 'answered'로 업데이트
    const updatedMessages = chatMessages.map(msg => 
      msg.user === selectedMessage.user && msg.status === 'pending' 
        ? { ...msg, status: 'answered' as const } 
        : msg
    );
    
    onChatMessagesChange([...updatedMessages, newMessage]);
    setMessageInput('');
    
    // 메시지 전송 후 자동 스크롤
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const filteredMessages = chatMessages.filter(message => {
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      message.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = chatMessages.filter(msg => msg.status === 'pending').length;
  const answeredCount = chatMessages.filter(msg => msg.status === 'answered').length;
  const closedCount = chatMessages.filter(msg => msg.status === 'closed').length;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-500" />;
      case 'answered':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'closed':
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-gray-500" />;
      default:
        return <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return '답변대기';
      case 'answered':
        return '답변완료';
      case 'closed':
        return '채팅종료';
      default:
        return '답변대기';
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] w-full bg-gray-50 border border-gray-200 rounded-lg">
      {/* 왼쪽 패널 - 메시지 목록 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col rounded-l-lg">
        {/* 헤더 */}
        {/* <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">1:1문의</h3>
          <p className="text-sm text-gray-500 mt-1">고객 문의사항을 확인하고 답변할 수 있습니다.</p>
        </div> */}

        {/* 필터 탭 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({chatMessages.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              답변대기 ({pendingCount})
            </button>
            {/* <button
              onClick={() => setStatusFilter('answered')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                statusFilter === 'answered' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              답변완료 ({answeredCount})
            </button> */}
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                statusFilter === 'closed' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              답변완료 ({closedCount})
            </button>
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{user.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{user}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(latestMessage.status)}
                              <span className="text-xs text-gray-600">{getStatusText(latestMessage.status)}</span>
                              {pendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                  {pendingCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{latestMessage.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate ml-10">
                        {latestMessage.message}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        
      </div>

      {/* 중앙 패널 */}
      <div className="flex-1 bg-white border-r border-gray-200 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200">
          {/* <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-1" />
              <div className="text-left">
                <p className="text-sm font-medium text-red-800 mb-1">
                  [중요] ADMore를 사칭하여 개인/결제 정보를 요구하는 피싱 메시지에 주의하세요!
                </p>
              </div>
            </div>
          </div> */}
          
          {/* 선택된 유저 정보 */}
          {selectedMessage && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{selectedMessage.user.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedMessage.user}</h3>
                <p className="text-sm text-gray-600">문의 상태: {getStatusText(selectedMessage.status)}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => handleCloseChat(selectedMessage)}
                  disabled={selectedMessage.status === 'closed'}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedMessage.status === 'closed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {selectedMessage.status === 'closed' ? '채팅종료됨' : '채팅종료'}
                </button>
              </div>
            </div>
          )}
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
            <div className="space-y-4">
              {/* 선택된 유저와의 대화 필터링 */}
              {filteredMessages
                .filter(msg => 
                  msg.user === selectedMessage.user || 
                  (msg.user === '관리자' && msg.productInfo === selectedMessage.productInfo)
                )
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.type === 'admin' ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === 'admin' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm leading-relaxed">{message.message}</div>
                        <div className={`text-xs mt-2 ${
                          message.type === 'admin' ? 'text-orange-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </div>
                      </div>
                      {message.productInfo && (
                        <div className="mt-2 text-xs text-gray-500">
                          관련 상품: {message.productInfo}
                        </div>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${
                      message.type === 'admin' ? 'order-1 bg-orange-500' : 'order-2 bg-gray-300'
                    }`}>
                      <span className={`text-xs font-bold ${
                        message.type === 'admin' ? 'text-white' : 'text-gray-600'
                      }`}>
                        {message.type === 'admin' ? 'A' : message.user.charAt(0)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        {/* 하단 메시지 입력 */}
        <div className="border-t border-gray-200 p-4">
          {!selectedMessage ? (
            <div className="flex items-center justify-center h-20 text-gray-500">
              <p>유저를 선택하여 메시지를 보내세요</p>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleMessageInputKeyDown}
                  rows={1}
                  placeholder={`${selectedMessage.user}에게 메시지를 입력하세요. (Enter: 줄바꿈 / Ctrl+Enter: 전송)`}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg resize-none
                      focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-800 border border-gray-300 rounded-lg">
                    파일첨부
                  </button>
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    messageInput.trim() 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>전송</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 오른쪽 패널 - 전문가 정보 */}
      <div className="w-80 bg-white flex flex-col rounded-r-lg">
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
                <span className="text-sm font-medium text-green-600"></span>
              </div>
            </div>
          </div>

          {/* 거래 정보 - 채팅대상 회원의 거래 정보 */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">거래 정보</h4>
            <div className="space-y-3">
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
            </div>
          </div>
          {/* 운영 정보 */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-3 mb-3">
              <FontAwesomeIcon icon={faClock} className="text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">운영시간: 09:00~18:00 (주말/공휴일 휴무)</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <FontAwesomeIcon icon={faPhone} className="text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">고객센터: 1544-0000</span>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faEnvelope} className="text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">이메일: help@admore.com</span>
            </div>
          </div> */}
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
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">채팅 종료</h3>
            </div>
            <p className="text-gray-700 mb-6">
              <strong>{closingMessage.user}</strong>님과의 채팅을 종료하시겠습니까?
              <br />
              <span className="text-sm text-gray-500">
                종료 후에는 더 이상 메시지를 주고받을 수 없습니다.
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
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                채팅 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquiryManagement; 