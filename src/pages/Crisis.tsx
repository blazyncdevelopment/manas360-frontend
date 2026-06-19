import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../lib/runtimeEnv';

export const CrisisPage: React.FC = () => {
  const [showCounselor, setShowCounselor] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [crisisType, setCrisisType] = useState<'safe' | 'urgent'>('safe');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const sendCrisisAlert = async (type: 'safe' | 'urgent', uName: string, uPhone: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/v1/shared/crisis-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: uName, phone: uPhone, type })
      });
    } catch (e) {
      console.error('Failed to send crisis alert', e);
    }
  };

  const handleSafeClick = () => {
    if (user && user.phone) {
      sendCrisisAlert('safe', user.firstName || (user as any).name || 'User', user.phone);
      setShowCounselor(true);
    } else {
      setCrisisType('safe');
      setShowModal(true);
    }
  };

  const handleUrgentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user && user.phone) {
      sendCrisisAlert('urgent', user.firstName || (user as any).name || 'User', user.phone);
      window.location.href = 'tel:112';
    } else {
      setCrisisType('urgent');
      setShowModal(true);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCrisisAlert(crisisType, name, phone);
    setShowModal(false);
    if (crisisType === 'urgent') {
      window.location.href = 'tel:112';
    } else {
      setShowCounselor(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 50%, #fff8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .crisis-card { animation: fade-in 0.4s ease; }
        .pulse-icon { animation: pulse-soft 2s ease-in-out infinite; }
        .crisis-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .crisis-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="crisis-card" style={{
        width: '100%',
        maxWidth: '520px',
        background: '#fff',
        borderRadius: '28px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid #fce8e8',
        textAlign: 'center',
      }}>

        {/* Icon */}
        <div className="pulse-icon" style={{
          width: '72px', height: '72px',
          background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2rem',
        }}>
          🫶
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '0.5rem',
          lineHeight: 1.3,
        }}>
          You are not alone.
        </h1>

        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '0.4rem',
          fontWeight: 500,
        }}>
          We're here with you right now.
        </p>

        <p style={{
          fontSize: '0.88rem',
          color: '#94a3b8',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}>
          It takes courage to reach out. Trained counselors are available
          24/7 — free, confidential, and without judgment.
        </p>

        {/* Primary CTA */}
        <a
          href="tel:18005990019"
          className="crisis-btn"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            width: '100%', padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', borderRadius: '14px',
            fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>📞</span>
          <span>Call Tele-MANAS: 1800-599-0019</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 'auto' }}>Free · 24/7</span>
        </a>

        {/* Secondary CTAs */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem' }}>
          <a
            href="tel:112"
            className="crisis-btn"
            style={{
              flex: 1, padding: '0.8rem',
              background: '#1e293b', color: '#fff',
              borderRadius: '12px', fontWeight: 600,
              fontSize: '0.88rem', textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            🚨 Emergency 112
          </a>
          <a
            href="sms:iCall?body=HELLO"
            className="crisis-btn"
            style={{
              flex: 1, padding: '0.8rem',
              background: '#f1f5f9', color: '#334155',
              borderRadius: '12px', fontWeight: 600,
              fontSize: '0.88rem', textDecoration: 'none',
              textAlign: 'center',
              border: '1.5px solid #e2e8f0',
            }}
          >
            💬 Text iCall
          </a>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
            Are you safe right now?
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleSafeClick}
              className="crisis-btn"
              style={{
                flex: 1, padding: '0.75rem',
                background: '#f0fdf4', color: '#166534',
                border: '1.5px solid #bbf7d0',
                borderRadius: '12px', fontWeight: 600,
                fontSize: '0.88rem', cursor: 'pointer',
              }}
            >
              ✓ Yes, I'm safe
            </button>
            <a
              href="tel:112"
              onClick={handleUrgentClick}
              className="crisis-btn"
              style={{
                flex: 1, padding: '0.75rem',
                background: '#fef2f2', color: '#991b1b',
                border: '1.5px solid #fecaca',
                borderRadius: '12px', fontWeight: 600,
                fontSize: '0.88rem', textDecoration: 'none',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              🆘 Need help now
            </a>
          </div>
        </div>

        {showCounselor && (
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            fontSize: '0.85rem',
            color: '#166534',
            lineHeight: 1.6,
            marginBottom: '1rem',
            animation: 'fade-in 0.3s ease',
          }}>
            💚 Thank you for telling us. Please stay nearby — a Tele-MANAS
            counselor can talk with you right now at <strong>1800-599-0019</strong>.
            It's free and completely private.
          </div>
        )}

        {/* Go back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none',
            color: '#94a3b8', fontSize: '0.82rem',
            cursor: 'pointer', padding: '0.5rem',
          }}
        >
          ← Go back
        </button>
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6,
      }}>
        iCall: 9152987821 · Vandrevala Foundation: 1860-2662-345 (24/7)
        <br />All helplines are free and confidential.
      </p>

      {/* Modal for capturing info if logged out */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '2rem',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'fade-in 0.2s ease-out'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              We're here for you.
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Please share your name and WhatsApp number so we can check in on you. Support is just a message away.
            </p>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                    border: '1px solid #cbd5e1', fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                    border: '1px solid #cbd5e1', fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: '#f1f5f9', color: '#475569',
                    border: 'none', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: '#dc2626', color: '#fff',
                    border: 'none', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,0.2)'
                  }}
                >
                  {crisisType === 'urgent' ? 'Call 112 Now' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
