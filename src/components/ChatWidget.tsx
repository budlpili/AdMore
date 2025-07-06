import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faComments, faHeadset, faChevronLeft, faXmark, faPaperclip, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

type Message = {
  from: 'user' | 'admin';
  text?: string;
  file?: string | null;
  fileName?: string;
  fileType?: string;
};

type ChatWidgetProps = {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ isChatOpen, setIsChatOpen }) => {
  const [mode, setMode] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>([
    { from: 'admin', text: '고객님 반갑습니다!\n상담 운영 시간 안내\n· 평일 10:00 ~ 17:00\n· 주말, 공휴일 휴무\n순차적으로 확인하여 답변드리도록 하겠습니다.' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen && mode === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, mode]);

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

  const handleSend = () => {
    if (!input.trim() && !file) return;
    if (input.trim()) {
      setMessages(msgs => [...msgs, { from: 'user', text: input }]);
    }
    if (file) {
      setMessages(msgs => [
        ...msgs,
        {
          from: 'user',
          file: filePreview,
          fileName: file.name,
          fileType: file.type
        }
      ]);
      setFile(null);
      setFilePreview(null);
    }
    setInput('');
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'admin', text: '상담 운영팀이 곧 답변드리겠습니다.' }]);
    }, 1200);
  };

  const handleOpen = () => {
    setIsChatOpen(true);
    setMode('home');
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setMode('home');
  };

  return (
    <>
      {/* 문의하기 플로팅 버튼 (데스크탑만) */}
      <button
        className="hidden md:flex fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 items-center justify-center text-3xl hover:bg-blue-700 transition"
        onClick={handleOpen}
        aria-label="문의하기"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
      >
        <span>💬</span>
      </button>
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
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-base">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            {/* 본문: 안내/문의 or 채팅 */}
            <div className="flex-1 flex flex-col">
              {mode === 'home' ? (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
                    <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-lg px-3 text-sm text-gray-700 w-full mb-4">
                      <div className="rounded-lg p-4 text-sm text-gray-700 w-full">
                        <div className="font-bold mb-1">고객님 반갑습니다 <span className='text-orange-500'>🤩🤩</span></div>
                        <div className="mb-1">상담 운영 시간 안내</div>
                        <div className="mb-1">· 평일 10:00 ~ 17:00</div>
                        <div className="mb-1">· 주말, 공휴일 휴무</div>
                        <div className="mb-1">빠른 시간 내 순차적으로 확인하여 <br /> 답변드리도록 하겠습니다.</div>
                      </div>
                      <button className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold text-sm mb-4 
                      hover:bg-orange-700 transition" onClick={() => setMode('chat')}>문의하기</button>
                    </div>

                    <div className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-lg px-4 py-4 
                    text-sm text-gray-700 w-full mb-4">
                      <div className="flex items-center gap-2 bg-white rounded-lg px-0 w-full">
                        <input type="tel" className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 
                        focus:ring-orange-500 text-sm" placeholder="휴대폰 번호를 입력해 주세요." />
                        <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-md font-semibold text-xs 
                          hover:bg-orange-200 transition">SMS <br /> 등록</button>
                      </div>
                      <div className="text-xs text-gray-400 w-full">* SMS 등록하시면 답변을 SMS로도 받아보실 수 있어요!</div>
                    </div>
                    
                    

                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto max-h-[380px] px-4 py-3 bg-gray-50">
                    {messages.map((msg, idx) => {
                      const now = new Date();
                      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      if (msg.from === 'admin') {
                        return (
                          <div key={idx} className="mb-4 flex items-start">
                            <span className="w-7 h-7 rounded-full mt-0 mr-2 flex items-center justify-center bg-gray-100 border border-gray-200">
                              <FontAwesomeIcon icon={faHeadset} className="text-lg text-gray-500" />
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700 mb-1 ml-1">애드모어 운영팀</span>
                              <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-[13px] text-gray-900 max-w-[70%] break-words whitespace-pre-line">
                                {msg.text}
                              </div>
                              <span className="text-[11px] text-gray-400 mt-1 self-start">{time}</span>
                            </div>
                          </div>
                        );
                      } else {
                        if (msg.file) {
                          if (msg.fileType && msg.fileType.startsWith('image/')) {
                            return (
                              <div key={idx} className="mb-4 flex flex-col items-end">
                                <img src={msg.file} alt={msg.fileName} className="w-32 h-32 object-cover rounded border mb-1" />
                                <span className="text-[11px] text-gray-400 mr-1">{msg.fileName}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div key={idx} className="mb-4 flex flex-col items-end">
                                <a href={msg.file} download={msg.fileName} className="text-xs text-blue-600 underline">{msg.fileName}</a>
                              </div>
                            );
                          }
                        } else {
                          return (
                            <div key={idx} className="mb-4 flex flex-col items-end">
                              <div className="bg-orange-600 text-white rounded-lg px-4 py-2 text-sm max-w-[70%] break-words whitespace-pre-line">
                                {msg.text}
                              </div>
                              <span className="text-[11px] text-gray-400 mt-1 mr-1">{time}</span>
                            </div>
                          );
                        }
                      }
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  {/* 입력창 */}
                  <form className="relative flex items-center border-t px-3 py-3 gap-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
                    
                    <input
                      type="text"
                      className="flex-1 px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="메시지를 입력해 주세요."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="flex items-center justify-center ml-1 text-gray-400 hover:text-orange-500 transition"
                      aria-label="파일 첨부"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FontAwesomeIcon icon={faPaperclip} className="text-xl" />
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </button>
                    <button
                      type="submit"
                      className="ml-1 flex items-center justify-center hover:text-orange-500 text-gray-400 transition"
                      aria-label="전송"
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
    </>
  );
};

export default ChatWidget;