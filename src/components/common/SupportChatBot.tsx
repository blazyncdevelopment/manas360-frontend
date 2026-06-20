import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../../lib/runtimeEnv';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isQuickReply?: boolean;
};

const SupportChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Welcome to MANAS360! 👋 How are you? What do you need help with?'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/support-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      setIsTyping(false);

      let replyText = data.reply || "I'm sorry, I couldn't understand that. You can chat with us on WhatsApp at https://wa.me/918951927280";

      // Replace plans link to pricing
      replyText = replyText.replace('https://manas360.com/plans', 'https://manas360.com/pricing');

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('[SupportChatBot] Connection error:', err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Oops, something went wrong connecting to our servers. Please try again later."
      }]);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 140 }}>
      {isOpen ? (
        <div style={{
          width: '340px',
          height: '480px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            padding: '16px 20px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Dr. Meera</div>
                <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }}></span>
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', opacity: 0.8 }}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.sender === 'user' ? '#7C3AED' : '#F1F5F9',
                  color: m.sender === 'user' ? 'white' : '#1E293B',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  {m.text.includes('https://') ? (
                    <span dangerouslySetInnerHTML={{ __html: m.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>') }} />
                  ) : m.text}
                </div>
              </div>
            ))}

            {/* Initial Quick Replies if only welcome message is present */}
            {messages.length === 1 && messages[0].sender === 'bot' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  onClick={() => handleQuickReply('I need support in sales')}
                  style={{
                    padding: '8px 14px', background: 'white', border: '1px solid #7C3AED',
                    color: '#7C3AED', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  Sales Support
                </button>
                <button
                  onClick={() => handleQuickReply('I need personal support')}
                  style={{
                    padding: '8px 14px', background: 'white', border: '1px solid #7C3AED',
                    color: '#7C3AED', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  Personal Support
                </button>
              </div>
            )}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#F1F5F9',
                  display: 'flex', gap: '4px', alignItems: 'center'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '14px', borderTop: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#F8FAFC', borderRadius: '999px', padding: '6px 16px', border: '1px solid #E2E8F0' }}>
              <input
                type="text"
                className="chat-input-no-border"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Type your message..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', fontSize: '14px', color: '#1E293B', padding: '6px 0' }}
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim()}
                style={{
                  background: inputValue.trim() ? '#7C3AED' : '#CBD5E1', color: 'white', border: 'none',
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: inputValue.trim() ? 'pointer' : 'default', transition: 'all 0.2s'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chatbot-btn-wrapper">
          <button
            onClick={() => setIsOpen(true)}
            type="button"
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
              color: 'white',
              position: 'relative',
              animation: 'landingChatFloat 3.2s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Chat"
          >
            <span style={{ fontSize: '30px', transform: 'rotate(0deg)', animation: 'landingChatTilt 3s ease-in-out infinite' }}>🤖</span>
            <span style={{
              position: 'absolute', top: '-8px', left: '-7px', width: '18px', height: '18px',
              borderRadius: '999px', background: '#EF4444', color: 'white', fontSize: '11px',
              fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.9)'
            }}>
              3
            </span>
            <span style={{
              position: 'absolute', top: '4px', right: '4px', width: '14px', height: '14px',
              borderRadius: '999px', background: '#22C55E', border: '2px solid rgba(255,255,255,0.95)'
            }}></span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .chat-input-no-border:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .chatbot-btn-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default SupportChatBot;
