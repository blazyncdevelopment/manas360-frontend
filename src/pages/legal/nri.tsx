import { useEffect, useState } from 'react';

export interface NriConsentState {
  nri_declared: boolean;
  nri_tos_accepted: boolean;
  nri_tos_accepted_at: string;
  nri_timezone_pool: string;
}

interface NriPatchProps {
  onChange?: (state: NriConsentState) => void;
  blockSubmitButtons?: boolean;
}

const TIMEZONE_ZONES = [
  { id: 'us_east', flag: '🇺🇸', label: 'US East', sub: 'EDT / EST (UTC-4/-5)', pool: 'C' },
  { id: 'us_west', flag: '🇺🇸', label: 'US West', sub: 'PDT / PST (UTC-7/-8)', pool: 'D' },
  { id: 'uk', flag: '🇬🇧', label: 'UK', sub: 'BST / GMT (UTC+1/0)', pool: 'B' },
  { id: 'australia', flag: '🇦🇺', label: 'Australia', sub: 'AEST / AEDT (UTC+10/+11)', pool: 'A' },
  { id: 'singapore', flag: '🇸🇬', label: 'Singapore', sub: 'SGT (UTC+8)', pool: 'B' },
  { id: 'uae', flag: '🇦🇪', label: 'UAE / Gulf', sub: 'GST (UTC+4)', pool: 'B' },
];

export default function NriPatch({ onChange, blockSubmitButtons = true }: NriPatchProps) {
  const [nriDeclared, setNriDeclared] = useState(false);
  const [nriTosAccepted, setNriTosAccepted] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState('');
  const [timezonePool, setTimezonePool] = useState('');

  useEffect(() => {
    if (!onChange) return;
    onChange({
      nri_declared: nriDeclared,
      nri_tos_accepted: nriTosAccepted,
      nri_tos_accepted_at: acceptedAt,
      nri_timezone_pool: timezonePool,
    });
  }, [nriDeclared, nriTosAccepted, acceptedAt, timezonePool, onChange]);

  useEffect(() => {
    if (!blockSubmitButtons) return;
    const submitBtn = document.querySelector<HTMLButtonElement>(
      'button[type="submit"], #submitBtn, .submit-btn'
    );
    if (!submitBtn) return;
    const blocked = nriDeclared && (!nriTosAccepted || !timezonePool);
    submitBtn.disabled = blocked;
    submitBtn.style.opacity = blocked ? '0.4' : '1';
    submitBtn.style.cursor = blocked ? 'not-allowed' : 'pointer';
    submitBtn.title = blocked ? 'Complete NRI details before continuing' : '';
  }, [nriDeclared, nriTosAccepted, timezonePool, blockSubmitButtons]);

  const toggleNri = () => {
    const next = !nriDeclared;
    setNriDeclared(next);
    if (!next) {
      setNriTosAccepted(false);
      setAcceptedAt('');
      setTimezonePool('');
    }
  };

  const handleTosChange = (checked: boolean) => {
    setNriTosAccepted(checked);
    setAcceptedAt(checked ? new Date().toISOString() : '');
  };

  return (
    <div style={{ margin: '16px 0', fontFamily: 'inherit' }}>
      {/* NRI declaration row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          border: `1.5px solid ${nriDeclared ? '#E65100' : '#e2e8f0'}`,
          borderRadius: '10px',
          background: nriDeclared ? '#fff3e0' : '#fafafa',
          cursor: 'pointer',
          transition: 'all .2s',
        }}
        onClick={toggleNri}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNri(); }
        }}
      >
        <input
          type="checkbox"
          checked={nriDeclared}
          onClick={(e) => e.stopPropagation()}
          onChange={toggleNri}
          style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#E65100', cursor: 'pointer', flexShrink: 0 }}
        />
        <div style={{ fontSize: '13px', color: '#1a1a1a', lineHeight: 1.5 }}>
          <strong style={{ color: '#E65100' }}>I am an NRI / residing outside India</strong>
          <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
            If checked, choose your timezone and accept the Indian jurisdiction terms.
          </span>
        </div>
      </div>

      {nriDeclared && (
        <>
          {/* +91 SIM notice */}
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: '#e8f5e9', border: '1.5px solid #4caf50', borderRadius: '10px',
            fontSize: '11px', lineHeight: 1.5, color: '#2e7d32',
          }}>
            <strong>Indian phone number (+91) required.</strong>{' '}
            MANAS360 uses OTP via SMS to +91 numbers only. If you don't have an active Indian SIM, get an Airtel/Jio e-SIM before registering.
          </div>

          {/* Timezone window selector */}
          <div style={{
            marginTop: '12px', padding: '12px 14px',
            border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fafafa',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>
              Your timezone window
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {TIMEZONE_ZONES.map((zone) => {
                const selected = timezonePool === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setTimezonePool(zone.id)}
                    style={{
                      padding: '8px 6px',
                      border: `1.5px solid ${selected ? '#E65100' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: selected ? '#fff3e0' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{zone.flag}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: selected ? '#E65100' : '#374151' }}>{zone.label}</div>
                    <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '1px' }}>{zone.sub}</div>
                    <div style={{
                      marginTop: '4px', fontSize: '9px', fontWeight: 600,
                      color: selected ? '#E65100' : '#9ca3af',
                      padding: '1px 4px', border: `1px solid ${selected ? '#E65100' : '#e2e8f0'}`,
                      borderRadius: '4px', display: 'inline-block',
                    }}>
                      Pool {zone.pool}
                    </div>
                  </button>
                );
              })}
            </div>
            {!timezonePool && (
              <p style={{ marginTop: '6px', fontSize: '10px', color: '#c62828' }}>Please select your timezone to continue.</p>
            )}
          </div>

          {/* Legal acknowledgment card */}
          <div style={{
            marginTop: '12px', padding: '12px 14px',
            border: `1.5px solid ${nriTosAccepted ? '#4caf50' : '#e2e8f0'}`,
            borderRadius: '10px',
            background: nriTosAccepted ? '#f1faf2' : '#fafafa',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>
              Legal acknowledgment
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#6b7280' }}>By using MANAS360:</p>
            <ul style={{ margin: '0 0 10px', paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: 1.8 }}>
              <li>Indian law applies (DPDPA 2023)</li>
              <li>Disputes: Bengaluru courts</li>
              <li>Data stored in India (Mumbai AWS)</li>
              <li>Self-declared NRI status</li>
            </ul>
            <p style={{ margin: '0 0 10px', fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>
              No HIPAA / GDPR / state laws — Indian jurisdiction only.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nriTosAccepted}
                onChange={(e) => handleTosChange(e.target.checked)}
                style={{ width: '16px', height: '16px', marginTop: '1px', accentColor: '#E65100', flexShrink: 0 }}
              />
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>I understand and accept</span>
            </label>
          </div>

          {/* Status indicator */}
          {!nriTosAccepted || !timezonePool ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '8px', fontSize: '11px', fontWeight: 600,
              padding: '6px 12px', borderRadius: '8px',
              color: '#c62828', background: '#ffebee',
            }}>
              {!timezonePool ? 'Select your timezone window to continue' : 'Accept the legal terms to complete registration'}
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '8px', fontSize: '11px', fontWeight: 600,
              padding: '6px 12px', borderRadius: '8px',
              color: '#2e7d32', background: '#e8f5e9',
            }}>
              ✓ NRI details complete — {TIMEZONE_ZONES.find((z) => z.id === timezonePool)?.label} timezone · Indian jurisdiction accepted
            </div>
          )}
        </>
      )}

      <input type="hidden" name="nri_declared" value={String(nriDeclared)} />
      <input type="hidden" name="nri_tos_accepted" value={String(nriTosAccepted)} />
      <input type="hidden" name="nri_tos_accepted_at" value={acceptedAt} />
      <input type="hidden" name="nri_timezone_pool" value={timezonePool} />
    </div>
  );
}
