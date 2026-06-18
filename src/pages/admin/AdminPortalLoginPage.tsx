import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, requestAdminLoginOtp, verifyAdminLoginOtp } from '../../api/auth';
import { hasCorporateAccess, isPlatformAdminUser, useAuth } from '../../context/AuthContext';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import './AdminPortalLoginPage.css';

const illustration = 'https://manas360.com/You%20renot%20alone-Beach.jpeg';

export default function AdminPortalLoginPage() {
  const { isAuthenticated, user, logout, syncSessionAfterOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { identifier?: string; password?: string } | null;

  const [identifier, setIdentifier] = useState(locationState?.identifier ?? '');
  const [password, setPassword] = useState(locationState?.password ?? '');
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isOtpStep = Boolean(challengeToken);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (isPlatformAdminUser(user)) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (hasCorporateAccess(user)) {
      navigate('/corporate/dashboard', { replace: true });
      return;
    }
    void logout();
    setError('Admin portal accepts admin accounts only. You have been signed out.');
  }, [isAuthenticated, user, navigate, logout]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || (!isOtpStep && !password.trim()) || (isOtpStep && otp.trim().length !== 4)) return;
    setLoading(true);
    setError(null);
    try {
      if (!isOtpStep) {
        const challenge = await requestAdminLoginOtp({ identifier: identifier.trim(), password });
        setChallengeToken(challenge.challengeToken);
        setMaskedEmail(challenge.email);
        setDevOtp(challenge.devOtp ?? null);
        setOtp('');
        return;
      }

      const result = await verifyAdminLoginOtp({ challengeToken, otp: otp.trim() });
      const loggedInUser = await syncSessionAfterOtp(result.user);
      if (!isPlatformAdminUser(loggedInUser)) {
        await logout();
        setError('Access denied. This URL is only for platform admin users.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Admin login failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetOtpStep = () => {
    setChallengeToken('');
    setMaskedEmail(null);
    setDevOtp(null);
    setOtp('');
    setError(null);
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <section className="login-illustration" style={{ backgroundImage: `url("${illustration}")` }}>
          <div className="login-illustration__overlay">
            <Link to="/" className="back-link back-link--image">
              <ArrowLeftIcon className="back-link__icon" />
              Home
            </Link>
            <div className="login-hero-copy">
              <span className="login-eyebrow">MANAS360 Operations</span>
              <h1>Secure command center for care delivery.</h1>
              <p>Review provider activity, corporate accounts, and platform workflows from one focused admin workspace.</p>
            </div>
            <div className="trust-strip" aria-label="Admin security notices">
              <span><ShieldCheckIcon /> Role verified</span>
              <span><LockClosedIcon /> Encrypted access</span>
            </div>
          </div>
        </section>
        <div className="login-content">
          <Link to="/" className="back-link back-link--mobile">
            <ArrowLeftIcon className="back-link__icon" />
            Back to Home
          </Link>
          <div className="login-card-heading">
            <span className="login-badge">Admin only</span>
            <h2 className="title">{isOtpStep ? 'Verify your email' : 'Welcome back'}</h2>
            <p className="subtitle">
              {isOtpStep
                ? `Enter the 4-digit OTP sent to ${maskedEmail || 'your admin email'}.`
                : 'Sign in with your platform administrator credentials.'}
            </p>
          </div>
          <form onSubmit={onSubmit} className="login-form">
            {!isOtpStep && (
              <>
                <label className="input-label">
                  <span className="label-text">Admin Email</span>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field"
                    placeholder="admin@yourcompany.com"
                    type="email"
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="input-label">
                  <span className="label-text">Password</span>
                  <div className="password-wrapper">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </label>
              </>
            )}
            {isOtpStep && (
              <label className="input-label">
                <span className="label-text">Email OTP</span>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-field otp-field"
                  placeholder="0000"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  required
                />
              </label>
            )}
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (isOtpStep ? 'Verifying...' : 'Sending OTP...') : (isOtpStep ? 'Verify & Enter Admin Portal' : 'Send Email OTP')}
            </button>
            {isOtpStep && (
              <button type="button" className="secondary-action" onClick={resetOtpStep} disabled={loading}>
                Use a different email or password
              </button>
            )}
          </form>
          {devOtp && <p className="dev-otp-note">Dev OTP: {devOtp}</p>}
          {error && <p className="error-msg">{error}</p>}
          <p className="security-note">
            Access is monitored and limited to approved MANAS360 platform administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
