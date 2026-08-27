import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import { ThinkingOrb } from 'thinking-orbs';

export default function StudentAdvisor() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [matric, setMatric] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasStartedChat = messages.length > 0;

  // Redirect if no session
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/app/student-login');
    }
  }, [authLoading, session, navigate]);

  // Fetch student profile to get matric_number
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const profileRes = await fetch(`${import.meta.env.VITE_API_BASE}/auth/student-profile/${session.user.id}`);
        const profileData = await profileRes.json();
        if (profileData.found === true && profileData.matric_number) {
          setMatric(profileData.matric_number);
        }
      } catch (err) {
        console.error('Failed to fetch student profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    const trimmed = textToSend.trim();
    if (!trimmed || sending || !matric) return;

    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matric_number: matric,
          message: trimmed,
          conversation_history: history
        })
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — please check your connection and try again.' }
      ]);
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
    <div className={`min-h-screen relative flex flex-col transition-colors duration-1000 ${hasStartedChat ? 'bg-pure-canvas' : 'mesh-gradient-bg'}`}>
      <Navbar />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${hasStartedChat ? 'max-w-[800px] w-full mx-auto px-[16px] md:px-[24px] pt-[24px] md:pt-[32px] pb-[160px] md:pb-[140px]' : 'items-center justify-center px-[16px] md:px-[24px]'}`}>
        
        {profileLoading ? (
           <div className="flex justify-center items-center h-[200px]">
             <p className="text-step-sm-2 text-graphite">Loading profile...</p>
           </div>
        ) : !matric ? (
           <div className="py-[32px] text-center border border-fog rounded-[16px] max-w-[600px] w-full">
             <p className="text-step-sm-2 text-ash">
               Could not load your student profile. Please try again later.
             </p>
           </div>
        ) : (
          <>
            {/* HERO STATE */}
            {!hasStartedChat && (
              <div className="text-center max-w-[800px] w-full mb-[32px] md:mb-[64px] animate-fade-in px-[8px]">
                <h1 className="mesh-gradient-text pb-[16px]" style={{fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 700, lineHeight: 1}}>
                  The AI Advisor you can talk to
                </h1>
                <p className="text-step-base-3 md:text-step-xl text-graphite mt-[12px] md:mt-[16px] max-w-[600px] mx-auto leading-relaxed">
                  Real academic records, insights, and guidance to help students and advisors make better academic decisions.
                </p>
              </div>
            )}

            {/* CHAT STATE */}
            {hasStartedChat && (
              <div className="flex flex-col gap-[24px] w-full">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-[12px] mb-[8px]">
                      {msg.role === 'assistant' && (
                        <div className="w-[24px] h-[24px] rounded-full bg-brand-ink flex items-center justify-center text-pure-canvas text-[10px] font-bold">
                          AI
                        </div>
                      )}
                    </div>
                    <div 
                      className={`px-[16px] md:px-[20px] py-[12px] md:py-[14px] rounded-[16px] max-w-[90%] md:max-w-[85%] text-step-base ${
                        msg.role === 'user' 
                          ? 'bg-midnight-ink text-pure-canvas rounded-tr-[4px]' 
                          : 'bg-mist/60 text-midnight-ink border border-fog'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {sending && (
                  <div className="flex items-start gap-[12px]">
                    <div className="w-[24px] h-[24px] rounded-full bg-brand-ink flex items-center justify-center text-pure-canvas text-[10px] font-bold flex-shrink-0 mt-2">
                      AI
                    </div>
                    <div className="pt-[2px]">
                      <ThinkingOrb state="breathing" size={64} theme="auto" style={{ width: 48, height: 48 }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-[20px]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Input Dock */}
      {matric && !profileLoading && (
        <div 
          className="fixed left-0 right-0 z-10 transition-all duration-700 ease-in-out flex justify-center px-[12px] md:px-[24px] pb-safe"
          style={{ bottom: hasStartedChat ? '16px' : '12vh' }}
        >
          <div className="advisor-input-dock bg-pure-canvas/80 backdrop-blur-md border border-slate-shadow rounded-[24px] p-[12px] w-full max-w-[800px] flex flex-col gap-[12px]">
            {!hasStartedChat && (
              <div className="flex justify-between items-center px-[8px]">
                <span className="text-step-sm text-midnight-ink font-semibold">
                  <span className="text-[#ff6b6b]">Meet</span> your academic compass
                </span>
              </div>
            )}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Describe a task or ask a question"
                className="w-full bg-mist rounded-[16px] pl-[20px] pr-[60px] py-[16px] text-step-base text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-1 focus:ring-silver disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="absolute right-[8px] top-[8px] bottom-[8px] bg-midnight-ink text-pure-canvas rounded-[12px] w-[40px] flex items-center justify-center hover:bg-opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
