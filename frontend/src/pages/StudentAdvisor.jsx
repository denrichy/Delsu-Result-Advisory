import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';

export default function StudentAdvisor() {
  const { session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [matric, setMatric] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your academic advisor. Ask me anything about your results, GPA, or courses."
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
        const profileRes = await fetch(`http://127.0.0.1:8000/auth/student-profile/${session.user.id}`);
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !matric) return;

    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    // Build conversation_history from all previous messages (excluding the hardcoded greeting)
    const history = messages
      .slice(1) // skip the initial hardcoded greeting
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('http://127.0.0.1:8000/agent/chat', {
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
    <>
      <Navbar />
      <div className="min-h-screen bg-pure-canvas px-[24px] py-[64px]">
        <div className="max-w-[600px] mx-auto">

          {/* Header */}
          <div className="mb-[32px]">
            <p className="text-step-xs text-ash uppercase tracking-widest mb-[8px]">
              STUDENT PORTAL
            </p>
            <h1 className="text-step-3xl text-midnight-ink">Ask the Advisor</h1>
          </div>

          {profileLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <p className="text-step-sm-2 text-graphite">Loading...</p>
            </div>
          ) : !matric ? (
            <div className="py-[32px] text-center border border-fog rounded-[16px]">
              <p className="text-step-sm-2 text-ash">
                Could not load your student profile. Please try again later.
              </p>
            </div>
          ) : (
            <>
              {/* Message List */}
              <div className="border border-fog rounded-[16px] p-[24px] mb-[16px] min-h-[500px] max-h-[600px] overflow-y-auto flex flex-col gap-[16px]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="bg-mist rounded-[12px] px-[16px] py-[10px] max-w-[80%]">
                        <p className="text-step-sm-2 text-midnight-ink">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%]">
                        <p className="text-step-sm-2 text-graphite whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <p className="text-step-sm-2 text-ash italic">typing...</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-[8px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder="Ask about your GPA, courses, or results..."
                  className="flex-1 bg-mist rounded-full px-[16px] py-[10px] text-step-sm-2 text-midnight-ink placeholder:text-ash border-none focus:outline-none focus:ring-2 focus:ring-midnight-ink disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="bg-midnight-ink text-pure-canvas text-step-sm rounded-full py-[10px] px-[24px] hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Send
                </button>
              </div>

              {/* Back link */}
              <div className="mt-[32px]">
                <Link
                  to="/app/student"
                  className="text-step-sm-2 text-graphite hover:text-midnight-ink underline underline-offset-4 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
