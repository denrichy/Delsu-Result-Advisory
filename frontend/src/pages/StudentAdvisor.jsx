import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { Menu, Plus, X, Trash2, Sparkles, Ghost, ArrowUp, Mic, MicOff, Pin, Edit2 } from 'lucide-react';

const fontBody = "'Open Sauce One', 'Open Sans', sans-serif";
const fontDisplay = "'Peace Sans', 'Nunito', sans-serif";

const API = import.meta.env.VITE_API_BASE;

/* ─── Relative Time Helper ─── */
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const secs = Math.floor((now - then) / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}


/* ─── Custom Long Press Hook ─── */
const useLongPress = (callback = () => {}, ms = 500) => {
  const timerRef = useRef(false);

  const start = useCallback((e) => {
    e.persist();
    timerRef.current = setTimeout(() => {
      callback(e);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback((e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = false;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

/* ─── Sidebar Component ─── */
function ChatSidebar({ isOpen, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onRenameSession, onTogglePin, profileInitial }) {
  const [contextMenuSession, setContextMenuSession] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleLongPress = useCallback((sessionObj) => {
    setContextMenuSession(sessionObj);
  }, []);

  const SessionItem = ({ s }) => {
    const longPressProps = useLongPress(() => handleLongPress(s), 600);
    return (
      <div
        {...longPressProps}
        className="group flex items-center gap-[8px] rounded-[12px] px-[12px] py-[14px] cursor-pointer transition-colors"
        style={{
          background: s.id === activeSessionId ? '#E5E7EB' : 'transparent',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
        }}
        onClick={() => { onSelectSession(s.id); onClose(); }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-[8px]">
          {s.is_pinned && <Pin size={14} style={{ color: '#1944F1', flexShrink: 0 }} />}
          <p style={{
            fontFamily: fontBody, fontSize: '15px', fontWeight: 500,
            color: '#1F2937',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {s.title}
          </p>
        </div>
      </div>
    );
  };

  const handleRenameSave = () => {
    if (renameValue.trim() && contextMenuSession) {
      onRenameSession(contextMenuSession.id, renameValue.trim());
    }
    setIsRenaming(false);
    setContextMenuSession(null);
  };

  const pinned = sessions.filter(s => s.is_pinned);
  const unpinned = sessions.filter(s => !s.is_pinned);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Sidebar Panel - Full Width on Mobile */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[70] flex flex-col pt-safe w-full md:w-[350px] md:max-w-[400px]"
        style={{
          background: '#F5F5F5',
          boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[16px]">
          <span style={{ fontFamily: fontDisplay, fontSize: '24px', fontWeight: 900, color: '#1F2937' }}>
            Compass
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full transition-colors active:scale-95"
            style={{ background: '#E5E7EB' }}
          >
            <X size={18} style={{ color: '#1F2937' }} />
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-[12px] pb-[20px]">
          {sessions.length === 0 ? (
            <div className="px-[12px] py-[24px]">
              <p style={{ fontFamily: fontBody, fontSize: '14px', color: '#6B7280' }}>
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[16px]">
              {pinned.length > 0 && (
                <div className="flex flex-col gap-[4px]">
                  <p style={{ padding: '0 12px', margin: '4px 0', fontFamily: fontBody, fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                    Pinned
                  </p>
                  {pinned.map((s) => <SessionItem key={s.id} s={s} />)}
                </div>
              )}
              {unpinned.length > 0 && (
                <div className="flex flex-col gap-[4px]">
                  {pinned.length > 0 && (
                    <p style={{ padding: '0 12px', margin: '4px 0', fontFamily: fontBody, fontSize: '12px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                      Recent
                    </p>
                  )}
                  {unpinned.map((s) => <SessionItem key={s.id} s={s} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions (New Chat & Profile) */}
        <div className="px-[20px] py-[20px] flex items-center justify-between" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div 
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1F2937', fontFamily: fontBody, fontWeight: 700, fontSize: '14px' }}
          >
            {profileInitial || 'U'}
          </div>
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex items-center gap-[8px] px-[20px] py-[12px] rounded-full transition-all active:scale-[0.97]"
            style={{
              background: '#1F2937',
              fontFamily: fontBody, fontSize: '15px', fontWeight: 600, color: '#FFFFFF',
            }}
          >
            <Plus size={18} />
            New chat
          </button>
        </div>
      </div>

      {/* Context Menu Overlay */}
      {contextMenuSession && !isRenaming && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-[20px]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setContextMenuSession(null)}
        >
          <div className="w-full max-w-[320px] flex flex-col gap-[16px]" onClick={e => e.stopPropagation()}>
            {/* Preview Card */}
            <div className="bg-white rounded-[24px] p-[20px] shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontFamily: fontBody, fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contextMenuSession.title}
              </p>
              <p style={{ fontFamily: fontBody, fontSize: '14px', color: '#6B7280', margin: 0 }}>
                {timeAgo(contextMenuSession.updated_at)}
              </p>
            </div>
            
            {/* Menu Options */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[20px] overflow-hidden flex flex-col shadow-2xl">
              <button
                className="flex items-center gap-[12px] px-[20px] py-[16px] text-left active:bg-gray-100 transition-colors"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                onClick={() => {
                  onTogglePin(contextMenuSession.id, !contextMenuSession.is_pinned);
                  setContextMenuSession(null);
                }}
              >
                <Pin size={20} style={{ color: '#1F2937' }} />
                <span style={{ fontFamily: fontBody, fontSize: '16px', fontWeight: 500, color: '#1F2937' }}>
                  {contextMenuSession.is_pinned ? 'Unpin' : 'Pin'}
                </span>
              </button>
              
              <button
                className="flex items-center gap-[12px] px-[20px] py-[16px] text-left active:bg-gray-100 transition-colors"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                onClick={() => {
                  setRenameValue(contextMenuSession.title);
                  setIsRenaming(true);
                }}
              >
                <Edit2 size={20} style={{ color: '#1F2937' }} />
                <span style={{ fontFamily: fontBody, fontSize: '16px', fontWeight: 500, color: '#1F2937' }}>
                  Rename
                </span>
              </button>
              
              <button
                className="flex items-center gap-[12px] px-[20px] py-[16px] text-left active:bg-red-50 transition-colors"
                onClick={() => {
                  onDeleteSession(contextMenuSession.id);
                  setContextMenuSession(null);
                }}
              >
                <Trash2 size={20} style={{ color: '#FF3B30' }} />
                <span style={{ fontFamily: fontBody, fontSize: '16px', fontWeight: 500, color: '#FF3B30' }}>
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal (iOS Style) */}
      {isRenaming && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-[20px]"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setIsRenaming(false); setContextMenuSession(null); }}
        >
          <div 
            className="bg-[#F5F5F5] rounded-[20px] w-full max-w-[300px] flex flex-col items-center pt-[20px] overflow-hidden shadow-2xl" 
            onClick={e => e.stopPropagation()}
            style={{ transform: 'translateY(-20px)' }}
          >
            <h3 style={{ fontFamily: fontBody, fontSize: '17px', fontWeight: 600, color: '#000', margin: '0 0 16px 0' }}>
              Rename chat
            </h3>
            
            <div className="w-full px-[16px] pb-[20px]">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-[#E5E5EA] rounded-[10px] px-[12px] py-[8px]"
                style={{ 
                  fontFamily: fontBody, fontSize: '16px', color: '#000', 
                  border: 'none', outline: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSave();
                  if (e.key === 'Escape') { setIsRenaming(false); setContextMenuSession(null); }
                }}
              />
            </div>
            
            <div className="flex w-full" style={{ borderTop: '1px solid #D1D1D6' }}>
              <button
                className="flex-1 py-[14px] active:bg-[#E5E5EA] transition-colors"
                style={{ fontFamily: fontBody, fontSize: '17px', fontWeight: 400, color: '#007AFF', borderRight: '1px solid #D1D1D6' }}
                onClick={() => { setIsRenaming(false); setContextMenuSession(null); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-[14px] active:bg-[#E5E5EA] transition-colors"
                style={{ fontFamily: fontBody, fontSize: '17px', fontWeight: 600, color: '#007AFF' }}
                onClick={handleRenameSave}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main Advisor Component ─── */
export default function StudentAdvisor() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [matric, setMatric] = useState('');
  const [profileInitial, setProfileInitial] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [processingText, setProcessingText] = useState('Thinking...');

  // Chat history state
  const [sessions, setSessions] = useState([]);
  const activeSessionId = sessionId || null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const skipNextFetch = useRef(false);

  const hasStartedChat = messages.length > 0;

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  // Redirect if no session
  useEffect(() => {
    if (!authLoading && !session) navigate('/app/login');
  }, [authLoading, session, navigate]);

  // Fetch student profile
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch(`${API}/auth/student-profile/${session.user.id}`);
        const data = await res.json();
        if (data.found === true) {
          if (data.matric_number) setMatric(data.matric_number);
          if (data.name) setProfileInitial(data.name.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.error('Failed to fetch student profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [session?.user?.id]);

  // Fetch chat sessions once matric is known
  const fetchSessions = useCallback(async () => {
    if (!matric) return;
    try {
      const res = await fetch(`${API}/agent/sessions/${encodeURIComponent(matric)}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch { /* silent */ }
  }, [matric]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Processing text interval
  useEffect(() => {
    if (!sending) return;
    const texts = ['Thinking...', 'Analyzing...', 'Finalizing output...'];
    let i = 0;
    setProcessingText(texts[0]);
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setProcessingText(texts[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [sending]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const loadMessages = async () => {
      try {
        const res = await fetch(`${API}/agent/sessions/${activeSessionId}/messages`);
        const data = await res.json();
        setMessages((data.messages || []).map(m => ({ role: m.role, content: m.content })));
        setIsTemporary(false); // If we load a session, it's not temporary
      } catch { setMessages([]); }
    };
    loadMessages();
  }, [activeSessionId]);

  // ─── Actions ───

  const handleNewChat = () => {
    navigate('/app/student/advisor');
    setIsTemporary(false);
    setMessages([]);
    setInput('');
  };

  const handleTemporaryChat = () => {
    navigate('/app/student/advisor');
    setIsTemporary(true);
    setMessages([]);
    setInput('');
  };

  const handleSelectSession = (id) => {
    navigate(`/app/student/advisor/${id}`);
    setIsTemporary(false);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API}/agent/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch { /* silent */ }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await fetch(`${API}/agent/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    } catch { /* silent */ }
  };

  const handleTogglePin = async (sessionId, isPinned) => {
    try {
      await fetch(`${API}/agent/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: isPinned }),
      });
      // Re-sort locally or just refetch
      setSessions(prev => {
        const updated = prev.map(s => s.id === sessionId ? { ...s, is_pinned: isPinned } : s);
        // Sort: pinned first, then by updated_at desc
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
    } catch { /* silent */ }
  };

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    const trimmed = textToSend.trim();
    if (!trimmed || sending || !matric) return;

    const userMessage = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    let currentSessionId = activeSessionId;

    try {
      if (!isTemporary) {
        // Create session if this is the first message
        if (!currentSessionId) {
          const createRes = await fetch(`${API}/agent/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matric_number: matric, title: 'New Chat' }),
          });
          const createData = await createRes.json();
          currentSessionId = createData.session.id;
          skipNextFetch.current = true;
          navigate(`/app/student/advisor/${currentSessionId}`, { replace: true });
        }

        // Save user message
        await fetch(`${API}/agent/sessions/${currentSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: trimmed }),
        });
      }

      // Send to AI (Streaming)
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/agent/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matric_number: matric, 
          message: trimmed, 
          conversation_history: history,
          session_id: isTemporary ? null : currentSessionId
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch stream');

      // Append empty assistant message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last partial line in the buffer
        
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const dataStr = line.trim().slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                aiContent += parsed.content;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = aiContent;
                  return newMsgs;
                });
              }
            } catch(e) { /* ignore partial json */ }
          }
        }
      }

      if (!isTemporary && currentSessionId) {
        // Refresh session list (which updates the title if it was generated)
        fetchSessions();
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please check your connection and try again.' }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) return null;
  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden" style={{ background: '#F5F3F3' }}>
      <Navbar />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onTogglePin={handleTogglePin}
        profileInitial={profileInitial}
      />

      {/* ── Top Action Bar ── */}
      <div
        className="fixed left-0 right-0 z-40 pt-safe"
        style={{ top: 0 }}
      >
        <div className="flex items-center justify-between h-[56px] px-[16px]" style={{ background: '#F5F3F3' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all active:scale-95"
            style={{ background: 'rgba(13,27,61,0.06)' }}
          >
            <Menu size={20} style={{ color: '#0D1B3D' }} />
          </button>

          <div className="flex items-center gap-[8px]">
            {isTemporary && (
              <span style={{ fontFamily: fontBody, fontSize: '11px', fontWeight: 700, color: '#6B7280', paddingRight: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Incognito
              </span>
            )}
            <button
              onClick={handleTemporaryChat}
              title="Temporary Chat"
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all active:scale-95"
              style={{ background: isTemporary ? 'rgba(25,68,241,0.1)' : 'rgba(13,27,61,0.06)' }}
            >
              <Ghost size={20} style={{ color: isTemporary ? '#1944F1' : '#0D1B3D' }} />
            </button>
            
            {hasStartedChat && (
              <button
                onClick={handleNewChat}
                title="New Chat"
                className="flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all active:scale-95"
                style={{ background: 'rgba(25,68,241,0.08)' }}
              >
                <Plus size={20} style={{ color: '#1944F1' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col pt-safe" style={{ paddingTop: '56px' }}>

        {profileLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <p style={{ fontFamily: fontBody, fontSize: '14px', color: '#6B7280' }}>Loading...</p>
          </div>
        ) : !matric ? (
          <div className="flex-1 flex justify-center items-center px-[20px]">
            <div className="py-[32px] px-[24px] text-center rounded-[20px] w-full max-w-[400px]" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <p style={{ fontFamily: fontBody, fontSize: '14px', color: '#6B7280' }}>
                Could not load your student profile. Please try again later.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Empty State ── */}
            {!hasStartedChat && (
              <div className="flex-1 flex flex-col items-center justify-center px-[24px]">
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-[72px] h-[72px] rounded-[22px] mb-[24px]"
                  style={{ background: 'rgba(25,68,241,0.08)' }}
                >
                  <Sparkles size={32} strokeWidth={1.5} style={{ color: '#1944F1' }} />
                </div>

                <h1 style={{
                  fontFamily: fontDisplay, fontSize: '28px', fontWeight: 900,
                  color: '#0D1B3D', textAlign: 'center', margin: 0, marginBottom: '10px',
                }}>
                  Ask Compass
                </h1>
                <p style={{
                  fontFamily: fontBody, fontSize: '15px', fontWeight: 400,
                  color: '#6B7280', textAlign: 'center', margin: 0, maxWidth: '320px', lineHeight: 1.5,
                }}>
                  Your AI academic advisor. Ask about your GPA, results, course performance, and more.
                </p>
              </div>
            )}

            {/* ── Chat Messages ── */}
            {hasStartedChat && (
              <div className="flex-1 overflow-y-auto px-[16px] pb-[220px]">
                <div className="max-w-[800px] mx-auto flex flex-col gap-[20px] pt-[16px]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.role === 'user' ? (
                        /* User Bubble */
                        <div
                          className="px-[16px] py-[12px] rounded-[18px] rounded-tr-[4px] max-w-[85%]"
                          style={{ background: '#1944F1' }}
                        >
                          <p style={{
                            fontFamily: fontBody, fontSize: '15px', fontWeight: 400,
                            color: '#FFFFFF', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                          }}>
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        /* AI Response — clean typography, no bubble */
                        <div className="max-w-[92%] pl-[4px]">
                          <div className="flex items-center gap-[8px] mb-[6px]">
                            <div
                              className="flex items-center justify-center w-[22px] h-[22px] rounded-full"
                              style={{ background: '#1944F1' }}
                            >
                              <Sparkles size={12} style={{ color: '#FFFFFF' }} />
                            </div>
                            <span style={{ fontFamily: fontBody, fontSize: '12px', fontWeight: 700, color: '#1944F1' }}>
                              Compass
                            </span>
                          </div>
                          <p style={{
                            fontFamily: fontBody, fontSize: '15px', fontWeight: 400,
                            color: '#0D1B3D', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap',
                          }}>
                            {msg.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {sending && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex items-center gap-[12px] py-[8px]">
                      <div className="pulse-dot"></div>
                      <span style={{ fontFamily: fontBody, fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}>
                        {processingText}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-[1px]" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Input Bar ── */}
      {matric && !profileLoading && (
        <div
          className="fixed left-0 right-0 z-30 px-[12px] pb-safe"
          style={{ bottom: '68px' }}
        >
          <div
            className="max-w-[800px] mx-auto rounded-[20px] p-[6px] flex items-end gap-[6px]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask Compass anything..."
              style={{
                flex: 1,
                fontFamily: fontBody, fontSize: '15px', fontWeight: 400,
                color: '#0D1B3D',
                background: 'transparent',
                border: 'none', outline: 'none',
                padding: '10px 14px',
                minHeight: '40px',
              }}
            />
            <button
              onClick={toggleListen}
              disabled={sending}
              className="flex items-center justify-center shrink-0 rounded-[14px] w-[40px] h-[40px] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              }}
              title={isListening ? "Stop listening" : "Start dictation"}
            >
              {isListening ? (
                <MicOff size={20} style={{ color: '#EF4444' }} />
              ) : (
                <Mic size={20} style={{ color: '#6B7280' }} />
              )}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="flex items-center justify-center shrink-0 rounded-[14px] w-[40px] h-[40px] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() ? '#1944F1' : '#E5E7EB',
              }}
            >
              <ArrowUp size={18} style={{ color: input.trim() ? '#FFFFFF' : '#6B7280' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
