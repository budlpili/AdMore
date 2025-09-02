import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, faHeadset, faFileAlt, faShieldAlt, faPlus, faEdit, faTrash, faCheck, faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Pagination from './Pagination';
import { customerServiceAPI } from '../services/api';
import { Notice, ChatMessage } from '../types';
import '../css/ProductManagement.css';

interface CustomerServiceManagementProps {
  chatMessages: ChatMessage[];
  onChatMessagesChange: (messages: ChatMessage[]) => void;
  initialTab?: 'notices' | 'terms' | 'privacy';
}

const CustomerServiceManagement: React.FC<CustomerServiceManagementProps> = ({
  chatMessages,
  onChatMessagesChange,
  initialTab = 'notices'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notices' | 'terms' | 'privacy'>(initialTab);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    important: false
  });
  const [currentNoticePage, setCurrentNoticePage] = useState(1);
  const [noticesPerPage] = useState(10);
  
  // 이용약관 관련 상태
  const [showTermsEditor, setShowTermsEditor] = useState(false);
  const [termsContent, setTermsContent] = useState(`제1조 (목적)
이 약관은 ADMore(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"라 함은 회사가 제공하는 모든 서비스를 의미합니다.
2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.

제4조 (서비스의 제공)
1. 회사는 회원에게 아래와 같은 서비스를 제공합니다.
2. 서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.

제5조 (서비스의 중단)
1. 회사는 시스템 점검, 보수, 교체, 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.
2. 회사는 서비스 중단의 경우 사전에 공지하거나 회원에게 통지합니다.`);

  // 개인정보취급방침 관련 상태
  const [showPrivacyEditor, setShowPrivacyEditor] = useState(false);
  const [privacyContent, setPrivacyContent] = useState(`제1조 (개인정보의 수집 및 이용목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

제2조 (개인정보의 처리 및 보유기간)
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

제3조 (개인정보의 제3자 제공)
회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

제4조 (개인정보의 파기)
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

제5조 (정보주체의 권리·의무 및 행사방법)
정보주체는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.`);

  // HTML 편집 모달 관련 상태
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [currentEditingType, setCurrentEditingType] = useState<'terms' | 'privacy'>('terms');

  // 1:1문의 관련 상태들 제거
  // const [showReplyModal, setShowReplyModal] = useState(false);
  // const [replyContent, setReplyContent] = useState('');
  // const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);

  // 1:1문의 관련 함수들 제거
  // const deleteChatMessage = (messageId: string) => {
  //   const updatedMessages = chatMessages.filter(message => message.id !== messageId);
  //   onChatMessagesChange(updatedMessages);
  // };

  // const handleReplyClick = (message: ChatMessage) => {
  //   setReplyingToMessage(message);
  //   setReplyContent('');
  //   setShowReplyModal(true);
  // };

  // const handleSubmitReply = () => {
  //   if (!replyContent.trim() || !replyingToMessage) return;
  //   const newReply: ChatMessage = {
  //     id: `reply_${Date.now()}`,
  //     user: '관리자',
  //     message: replyContent,
  //     timestamp: new Date().toLocaleString('ko-KR'),
  //     type: 'admin',
  //     productInfo: replyingToMessage.productInfo
  //   };
  //   const updatedMessages = [...chatMessages, newReply];
  //   onChatMessagesChange(updatedMessages);
  //   setShowReplyModal(false);
  //   setReplyContent('');
  //   setReplyingToMessage(null);
  // };

  // const handleCancelReply = () => {
  //   setShowReplyModal(false);
  //   setReplyContent('');
  //   setReplyingToMessage(null);
  // };

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 중복되는 확장들 비활성화
        link: false,
        underline: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Underline,
      Blockquote,
      CodeBlock,
      HorizontalRule,
    ],
    content: termsContent,
    onUpdate: ({ editor }) => {
      setTermsContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none font-sans',
      },
    },
  });

  // 개인정보취급방침용 TipTap editor configuration
  const privacyEditor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 중복되는 확장들 비활성화
        link: false,
        underline: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Underline,
      Blockquote,
      CodeBlock,
      HorizontalRule,
    ],
    content: privacyContent,
    onUpdate: ({ editor }) => {
      setPrivacyContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none font-sans',
      },
    },
  });

  // Update editor content when termsContent changes
  useEffect(() => {
    if (editor && termsContent !== editor.getHTML()) {
      editor.commands.setContent(termsContent);
    }
  }, [termsContent, editor]);

  // Update privacy editor content when privacyContent changes
  useEffect(() => {
    if (privacyEditor && privacyContent !== privacyEditor.getHTML()) {
      privacyEditor.commands.setContent(privacyContent);
    }
  }, [privacyContent, privacyEditor]);

  // initialTab이 변경될 때 activeSubTab 업데이트
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  // 공지사항 목록 로드
  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const response = await customerServiceAPI.getNotices();
      // MongoDB _id를 포함하여 매핑
      const formattedNotices = response.map((notice: any) => ({
        id: notice.id || Math.random(), // 프론트엔드용 ID
        _id: notice._id, // MongoDB 원본 ID 보존
        title: notice.title,
        content: notice.content,
        important: notice.important || false,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        author: notice.author || '관리자',
        status: notice.status
      }));
      setNotices(formattedNotices);
    } catch (error) {
      console.error('Failed to load notices:', error);
      alert('공지사항을 불러오는데 실패했습니다.');
    }
  };

  const saveNotices = async (updatedNotices: Notice[]) => {
    try {
      setNotices(updatedNotices);
      alert('공지사항이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save notices:', error);
      alert('공지사항을 저장하는데 실패했습니다.');
    }
  };

  const handleAddNotice = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      content: '',
      important: false
    });
    setShowNoticeForm(true);
  };

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      important: notice.important
    });
    setShowNoticeForm(true);
  };

  const handleDeleteNotice = async (id: string | number) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        // 해당 공지사항의 MongoDB _id 찾기
        const notice = notices.find(n => n.id === id);
        if (!notice || !notice._id) {
          alert('공지사항을 찾을 수 없습니다.');
          return;
        }
        
        console.log(`공지사항 삭제 시도, MongoDB _id:`, notice._id);
        await customerServiceAPI.deleteNotice(notice._id);
        
        // 삭제된 공지사항을 제외한 새로운 목록 생성
        const updatedNotices = notices.filter(n => n.id !== id);
        setNotices(updatedNotices);
        alert('공지사항이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete notice:', error);
        alert('공지사항을 삭제하는데 실패했습니다.');
      }
    }
  };

  const handleSubmitNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    
    if (editingNotice) {
      // 수정
      try {
        await customerServiceAPI.updateNotice(editingNotice._id || editingNotice.id || 0, noticeForm);
        const updatedNotices = notices.map(notice => 
          (notice._id || notice.id) === (editingNotice._id || editingNotice.id) 
            ? { ...notice, ...noticeForm, updatedAt: now }
            : notice
        );
        setNotices(updatedNotices);
        alert('공지사항이 성공적으로 수정되었습니다.');
      } catch (error) {
        console.error('Failed to update notice:', error);
        alert('공지사항을 수정하는데 실패했습니다.');
      }
    } else {
      // 새로 추가
      try {
        const newNotice = await customerServiceAPI.createNotice({
          ...noticeForm,
          author: '관리자'
        });
        setNotices([...notices, newNotice]);
        alert('공지사항이 성공적으로 등록되었습니다.');
      } catch (error) {
        console.error('Failed to create notice:', error);
        alert('공지사항을 등록하는데 실패했습니다.');
      }
    }

    setShowNoticeForm(false);
    setEditingNotice(null);
    setNoticeForm({ title: '', content: '', important: false });
  };

  const handleCancelNotice = () => {
    setShowNoticeForm(false);
    setEditingNotice(null);
    setNoticeForm({ title: '', content: '', important: false });
  };

  // 이용약관 관련 함수들
  const handleEditTerms = () => {
    setShowTermsEditor(true);
  };

  const handleSaveTerms = async () => {
    try {
      await customerServiceAPI.saveTerms(termsContent);
      setShowTermsEditor(false);
      alert('이용약관이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save terms:', error);
      alert('이용약관을 저장하는데 실패했습니다.');
    }
  };

  const handleCancelTerms = () => {
    setShowTermsEditor(false);
    // 원래 내용으로 복원
    customerServiceAPI.getTerms().then(response => {
      setTermsContent(response.content || '');
    }).catch(error => {
      console.error('Failed to load terms:', error);
      alert('이용약관을 불러오는데 실패했습니다.');
    });
  };

  const handleDeleteTerms = async () => {
    if (window.confirm('정말로 이용약관을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await customerServiceAPI.deleteTerms();
        const defaultTerms = `제1조 (목적)
이 약관은 ADMore(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"라 함은 회사가 제공하는 모든 서비스를 의미합니다.
2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.

제4조 (서비스의 제공)
1. 회사는 회원에게 아래와 같은 서비스를 제공합니다.
2. 서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.

제5조 (서비스의 중단)
1. 회사는 시스템 점검, 보수, 교체, 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.
2. 회사는 서비스 중단의 경우 사전에 공지하거나 회원에게 통지합니다.`;
        
        setTermsContent(defaultTerms);
        alert('이용약관이 기본 내용으로 초기화되었습니다.');
      } catch (error) {
        console.error('Failed to delete terms:', error);
        alert('이용약관을 삭제하는데 실패했습니다.');
      }
    }
  };

  // 개인정보취급방침 관련 함수들
  const handleEditPrivacy = () => {
    setShowPrivacyEditor(true);
  };

  const handleSavePrivacy = async () => {
    try {
      await customerServiceAPI.savePrivacy(privacyContent);
      setShowPrivacyEditor(false);
      alert('개인정보취급방침이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save privacy:', error);
      alert('개인정보취급방침을 저장하는데 실패했습니다.');
    }
  };

  const handleCancelPrivacy = () => {
    setShowPrivacyEditor(false);
    // 원래 내용으로 복원
    customerServiceAPI.getPrivacy().then(response => {
      setPrivacyContent(response.content || '');
    }).catch(error => {
      console.error('Failed to load privacy:', error);
      alert('개인정보취급방침을 불러오는데 실패했습니다.');
    });
  };

  const handleDeletePrivacy = async () => {
    if (window.confirm('정말로 개인정보취급방침을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await customerServiceAPI.deletePrivacy();
        const defaultPrivacy = `제1조 (개인정보의 수집 및 이용목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

제2조 (개인정보의 처리 및 보유기간)
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

제3조 (개인정보의 제3자 제공)
회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

제4조 (개인정보의 파기)
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

제5조 (정보주체의 권리·의무 및 행사방법)
정보주체는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.`;
        
        setPrivacyContent(defaultPrivacy);
        alert('개인정보취급방침이 기본 내용으로 초기화되었습니다.');
      } catch (error) {
        console.error('Failed to delete privacy:', error);
        alert('개인정보취급방침을 삭제하는데 실패했습니다.');
      }
    }
  };

  // HTML 편집 관련 함수들
  const openHtmlEditor = (type: 'terms' | 'privacy' = 'terms') => {
    setCurrentEditingType(type);
    if (type === 'terms') {
      setHtmlCode(editor?.getHTML() || '');
    } else {
      setHtmlCode(privacyEditor?.getHTML() || '');
    }
    setIsHtmlModalOpen(true);
  };

  const applyHtmlCode = async () => {
    if (currentEditingType === 'terms' && editor) {
      try {
        await customerServiceAPI.updateTerms(htmlCode);
        setTermsContent(htmlCode);
      } catch (error) {
        console.error('Failed to apply terms HTML:', error);
        alert('이용약관 HTML을 적용하는데 실패했습니다.');
      }
    } else if (currentEditingType === 'privacy' && privacyEditor) {
      try {
        await customerServiceAPI.updatePrivacy(htmlCode);
        setPrivacyContent(htmlCode);
      } catch (error) {
        console.error('Failed to apply privacy HTML:', error);
        alert('개인정보취급방침 HTML을 적용하는데 실패했습니다.');
      }
    }
    setIsHtmlModalOpen(false);
  };

  const cancelHtmlEdit = () => {
    setIsHtmlModalOpen(false);
    setHtmlCode('');
  };

  // 컴포넌트 마운트 시 저장된 이용약관 로드
  useEffect(() => {
    customerServiceAPI.getTerms().then(response => {
      setTermsContent(response.content || '');
    }).catch(error => {
      console.error('Failed to load terms on mount:', error);
    });
  }, []);

  // 컴포넌트 마운트 시 저장된 개인정보취급방침 로드
  useEffect(() => {
    customerServiceAPI.getPrivacy().then(response => {
      setPrivacyContent(response.content || '');
    }).catch(error => {
      console.error('Failed to load privacy on mount:', error);
    });
  }, []);

  // 페이지네이션 계산
  const indexOfLastNotice = currentNoticePage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = notices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalNoticePages = Math.ceil(notices.length / noticesPerPage);

  // 페이지 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentNoticePage(1);
  }, [notices.length]);

  return (
    <div>
      {/* 서브메뉴 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveSubTab('notices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                activeSubTab === 'notices'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBell} className="text-sm" />
              공지사항
            </button>
            <button
              onClick={() => setActiveSubTab('terms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                activeSubTab === 'terms'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faFileAlt} className="text-sm" />
              이용약관
            </button>
            <button
              onClick={() => setActiveSubTab('privacy')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                activeSubTab === 'privacy'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faShieldAlt} className="text-sm" />
              개인정보취급방침
            </button>
          </nav>
        </div>
      </div>

      {/* 공지사항 서브탭 */}
      {activeSubTab === 'notices' && (
        <div className="pb-12">
          <div className="">
            <div className="flex justify-between items-center  mb-4">
              <h3 className="text-lg font-semibold">공지사항</h3>
              <button 
                onClick={handleAddNotice}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                      flex items-center gap-2 text-sm"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                공지사항 작성
              </button>
            </div>
            
            {/* 공지사항 목록 */}
            <div className="space-y-4">
              {notices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">등록된 공지사항이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="min-w-[100px] max-w-[100px] px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          번호
                        </th>
                        <th className="min-w-[200px] max-w-[200px] px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          제목
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          작성자
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          작성일
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentNotices.map((notice, index) => (
                        <tr key={notice._id || notice.id || Math.random()} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {notices.length - (indexOfFirstNotice + index)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{notice.title}</div>
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {notice.content.length > 100 
                                ? `${notice.content.substring(0, 100)}...` 
                                : notice.content
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {notice.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              timeZone: 'Asia/Seoul'
                            })} 00:00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {notice.important ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                중요
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                일반
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditNotice(notice)}
                                className="text-blue-600 hover:text-blue-900"
                                title="수정"
                              >
                                <FontAwesomeIcon icon={faEdit} className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeleteNotice(notice._id || notice.id || 0)}
                                className="text-red-600 hover:text-red-900"
                                title="삭제"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {notices.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentNoticePage}
                  totalPages={totalNoticePages}
                  onPageChange={setCurrentNoticePage}
                  totalItems={notices.length}
                  itemsPerPage={noticesPerPage}
                  className="justify-between"
                  showInfo={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공지사항 작성/수정 모달 */}
      {showNoticeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingNotice ? '공지사항 수정' : '공지사항 작성'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="important"
                    checked={noticeForm.important}
                    onChange={(e) => setNoticeForm({ ...noticeForm, important: e.target.checked })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="important" className="ml-2 block text-sm text-gray-700">
                    중요 공지사항으로 설정
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCancelNotice}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitNotice}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingNotice ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이용약관 서브탭 */}
      {activeSubTab === 'terms' && (
        <div className="">
          <div className="">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">이용약관</h3>
              {showTermsEditor ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelTerms}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveTerms}
                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleDeleteTerms}
                    className="hidden px-4 py-2 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={handleEditTerms}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                    약관 수정
                  </button>
                  <button
                    onClick={handleDeleteTerms}
                    className="hidden px-4 py-2 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    삭제
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {showTermsEditor ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    {editor && (
                      <>
                        {/* Toolbar */}
                        <div className="border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
                          {/* Text Formatting */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleBold().run()}
                              className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                              title="굵게"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleItalic().run()}
                              className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                              title="기울임"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleUnderline().run()}
                              className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                              title="밑줄"
                            >
                              U
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleStrike().run()}
                              className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                              title="취소선"
                            >
                              <div className="flex flex-col items-center relative">
                                <div className="text-xs">S</div>
                                <div className="text-sm absolute top-[8px] -left-[1px] border-b border-gray-700 w-[10px]"></div>
                              </div>
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Headings */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                              className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                              title="제목 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                              className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                              title="제목 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                              className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                              title="제목 3"
                            >
                              H3
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Lists */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleBulletList().run()}
                              className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                              title="글머리 기호 목록"
                            >
                              •
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleOrderedList().run()}
                              className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                              title="번호 매기기 목록"
                            >
                              1.
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Alignment */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('left').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                              title="왼쪽 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('center').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                              title="가운데 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('right').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                              title="오른쪽 정렬"
                            >
                              <div className="flex flex-col items-end">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
                              title="양쪽 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-3 h-0.5 bg-current"></div>
                              </div>
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Block Elements */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleBlockquote().run()}
                              className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                              title="인용구"
                            >
                              <span className="italic">가</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setHorizontalRule().run()}
                              className="toolbar-btn"
                              title="구분선"
                            >
                              ―
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* History */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().undo().run()}
                              disabled={!editor.can().undo()}
                              className="toolbar-btn"
                              title="실행 취소"
                            >
                              ↶
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().redo().run()}
                              disabled={!editor.can().redo()}
                              className="toolbar-btn"
                              title="다시 실행"
                            >
                              ↷
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* HTML Editor */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => openHtmlEditor('terms')}
                              className="toolbar-btn"
                              title="HTML 편집"
                            >
                              &lt;/&gt;
                            </button>
                          </div>
                        </div>
                        <EditorContent 
                          editor={editor}
                          className="tiptap-editor max-h-[540px] overflow-y-auto"
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div 
                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
                    style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: termsContent }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 개인정보취급방침 서브탭 */}
      {activeSubTab === 'privacy' && (
        <div className="">
          <div className="">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">개인정보취급방침</h3>
              {showPrivacyEditor ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelPrivacy}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSavePrivacy}
                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleDeletePrivacy}
                    className="hidden px-4 py-2 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={handleEditPrivacy}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                    방침 수정
                  </button>
                  <button
                    onClick={handleDeletePrivacy}
                    className="hidden px-4 py-2 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    삭제
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {showPrivacyEditor ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    {privacyEditor && (
                      <>
                        {/* Toolbar */}
                        <div className="border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
                          {/* Text Formatting */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleBold().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('bold') ? 'is-active' : ''}`}
                              title="굵게"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleItalic().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('italic') ? 'is-active' : ''}`}
                              title="기울임"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleUnderline().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('underline') ? 'is-active' : ''}`}
                              title="밑줄"
                            >
                              U
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleStrike().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('strike') ? 'is-active' : ''}`}
                              title="취소선"
                            >
                              <div className="flex flex-col items-center relative">
                                <div className="text-xs">S</div>
                                <div className="text-sm absolute top-[8px] -left-[1px] border-b border-gray-700 w-[10px]"></div>
                              </div>
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Headings */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                              className={`toolbar-btn ${privacyEditor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                              title="제목 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                              className={`toolbar-btn ${privacyEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                              title="제목 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                              className={`toolbar-btn ${privacyEditor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                              title="제목 3"
                            >
                              H3
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Lists */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleBulletList().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('bulletList') ? 'is-active' : ''}`}
                              title="글머리 기호 목록"
                            >
                              •
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleOrderedList().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('orderedList') ? 'is-active' : ''}`}
                              title="번호 매기기 목록"
                            >
                              1.
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Alignment */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().setTextAlign('left').run()}
                              className={`toolbar-btn ${privacyEditor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                              title="왼쪽 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().setTextAlign('center').run()}
                              className={`toolbar-btn ${privacyEditor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                              title="가운데 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().setTextAlign('right').run()}
                              className={`toolbar-btn ${privacyEditor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                              title="오른쪽 정렬"
                            >
                              <div className="flex flex-col items-end">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-2 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-1 h-0.5 bg-current"></div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().setTextAlign('justify').run()}
                              className={`toolbar-btn ${privacyEditor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
                              title="양쪽 정렬"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-3 h-0.5 bg-current mb-0.5"></div>
                                <div className="w-3 h-0.5 bg-current"></div>
                              </div>
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* Block Elements */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().toggleBlockquote().run()}
                              className={`toolbar-btn ${privacyEditor.isActive('blockquote') ? 'is-active' : ''}`}
                              title="인용구"
                            >
                              <span className="italic">가</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().setHorizontalRule().run()}
                              className="toolbar-btn"
                              title="구분선"
                            >
                              ―
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* History */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().undo().run()}
                              disabled={!privacyEditor.can().undo()}
                              className="toolbar-btn"
                              title="실행 취소"
                            >
                              ↶
                            </button>
                            <button
                              type="button"
                              onClick={() => privacyEditor.chain().focus().redo().run()}
                              disabled={!privacyEditor.can().redo()}
                              className="toolbar-btn"
                              title="다시 실행"
                            >
                              ↷
                            </button>
                          </div>

                          <div className="toolbar-divider"></div>

                          {/* HTML Editor */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => openHtmlEditor('privacy')}
                              className="toolbar-btn"
                              title="HTML 편집"
                            >
                              &lt;/&gt;
                            </button>
                          </div>
                        </div>
                        <EditorContent 
                          editor={privacyEditor}
                          className="tiptap-editor max-h-[540px] overflow-y-auto"
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div 
                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
                    style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: privacyContent }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HTML 편집 모달 */}
      {isHtmlModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">HTML 편집</h3>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="HTML 코드를 입력하세요."
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelHtmlEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={applyHtmlCode}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1:1문의 답변 모달 */}
      {/* This modal is no longer used for replying to messages, but kept for potential future use or if the user wants to re-add it. */}
      {/* {showReplyModal && replyingToMessage && (
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
      )} */}
    </div>
  );
};

export default CustomerServiceManagement; 