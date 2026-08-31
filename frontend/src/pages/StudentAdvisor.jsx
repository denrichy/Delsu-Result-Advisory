import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { ThinkingOrb } from 'thinking-orbs';
import { Menu, Plus, X, Trash2, Sparkles, ArrowUp } from 'lucide-react';

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

/* ─── Sidebar Component ─── */
function ChatSidebar({ isOpen, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, profileInitial }) {
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

      {/* Sidebar Panel */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[70] flex flex-col pt-safe"
        style={{
          width: '300px',
          maxWidth: '82vw',
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

        {/* Chats Tab */}
        <div className="px-[12px] mb-[12px]">
          <div className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[12px]" style={{ background: 'transparent' }}>
            <Menu size={18} style={{ color: '#1F2937' }} />
            <span style={{ fontFamily: fontBody, fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Chats</span>
          </div>
        </div>

        {/* Recents Label */}
        <div className="px-[24px] pt-[8px] pb-[8px]">
          <span style={{ fontFamily: fontBody, fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>
            Recents
          </span>
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
            <div className="flex flex-col gap-[4px]">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-[8px] rounded-[12px] px-[12px] py-[14px] cursor-pointer transition-colors"
                  style={{
                    background: s.id === activeSessionId ? '#E5E7EB' : 'transparent',
                  }}
                  onClick={() => { onSelectSession(s.id); onClose(); }}
                >
                  <div className="flex-1 min-w-0">
                    <p style={{
                      fontFamily: fontBody, fontSize: '15px', fontWeight: 500,
                      color: '#1F2937',
                      margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-[28px] h-[28px] rounded-full transition-all shrink-0"
                    style={{ background: 'rgba(255,122,102,0.1)' }}
                  >
                    <Trash2 size={16} style={{ color: '#FF7A66' }} />
                  </button>
                </div>
              ))}
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
    </>
  );
}

/* ─── Main Advisor Component ─── */
export default function StudentAdvisor() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [matric, setMatric] = useState('');
  const [profileInitial, setProfileInitial] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Chat history state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasStartedChat = messages.length > 0;

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
      const res = await fetch(`${API}/agent/sessions/${matric}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch { /* silent */ }
  }, [matric]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) return;
    const loadMessages = async () => {
      try {
        const res = await fetch(`${API}/agent/sessions/${activeSessionId}/messages`);
        const data = await res.json();
        setMessages((data.messages || []).map(m => ({ role: m.role, content: m.content })));
      } catch { setMessages([]); }
    };
    loadMessages();
  }, [activeSessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Actions ───

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
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
      // Create session if this is the first message
      if (!currentSessionId) {
        const title = trimmed.length > 40 ? trimmed.substring(0, 40) + '…' : trimmed;
        const createRes = await fetch(`${API}/agent/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matric_number: matric, title }),
        });
        const createData = await createRes.json();
        currentSessionId = createData.session.id;
        setActiveSessionId(currentSessionId);
      }

      // Save user message
      await fetch(`${API}/agent/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: trimmed }),
      });

      // Send to AI
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric_number: matric, message: trimmed, conversation_history: history }),
      });

      const data = await res.json();
      const aiContent = res.ok && data.response
        ? data.response
        : 'Sorry, something went wrong. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);

      // Save AI response
      await fetch(`${API}/agent/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: aiContent }),
      });

      // Refresh session list
      fetchSessions();

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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3F3' }}>
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

          {hasStartedChat && (
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all active:scale-95"
              style={{ background: 'rgba(25,68,241,0.08)' }}
            >
              <Plus size={20} style={{ color: '#1944F1' }} />
            </button>
          )}
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
              <div className="flex-1 overflow-y-auto px-[16px] pb-[140px]">
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
                  {sending && (
                    <div className="flex items-start gap-[8px]">
                      <div
                        className="flex items-center justify-center w-[22px] h-[22px] rounded-full shrink-0 mt-[2px]"
                        style={{ background: '#1944F1' }}
                      >
                        <Sparkles size={12} style={{ color: '#FFFFFF' }} />
                      </div>
                      <ThinkingOrb state="breathing" size={64} theme="auto" style={{ width: 48, height: 48 }} />
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
