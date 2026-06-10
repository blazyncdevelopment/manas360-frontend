import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';



const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const AWS_BUCKET_NAME = import.meta.env.VITE_AWS_BUCKET_NAME || 'blazync-storage';
const HERO_VIDEO_S3_URL = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/Website%20Assets/HERO-BackgroundVideo.mp4`;

/** Optional presigned URL when the bucket object is not public-read */
const HERO_VIDEO_SRC =
  import.meta.env.VITE_HERO_VIDEO_URL?.trim() || HERO_VIDEO_S3_URL;




export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const NAVIGATION_DELAY_MS = 180;
  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
<<<<<<< HEAD
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const videoEnded = sessionStorage.getItem('heroVideoPlayed') === 'true';
  const videoRef = React.useRef<HTMLVideoElement>(null);

=======
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const mq = window.matchMedia('(max-width: 900px)');

    const applyOverflow = () => {
      document.body.style.overflow = mq.matches ? '' : 'hidden';
    };

    applyOverflow();
    mq.addEventListener('change', applyOverflow);

    return () => {
      document.body.style.overflow = prevOverflow;
      mq.removeEventListener('change', applyOverflow);
<<<<<<< HEAD
      sessionStorage.setItem('heroVideoPlayed', 'true');
=======
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
    };
  }, []);

  useEffect(() => {
    // Particles initialization from the provided HTML script
    const container = document.getElementById('particles');
    if (container) {
      const types = ['olive', 'teal'];
      for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = `particle ${types[i % 2]}`;
        const size = Math.random() * 3.5 + 1;
        p.style.cssText = `
          position: absolute;
          border-radius: 50%;
          animation: particleFloat linear infinite;
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          animation-duration: ${Math.random() * 18 + 14}s;
          animation-delay: ${Math.random() * 10}s;
          ${i % 2 === 0 ? 'background: rgba(126,129,0,0.12);' : 'background: rgba(90,126,150,0.1);'}
        `;
        container.appendChild(p);
      }
    }
  }, []);

  // We optimistically render the video and switch to the styled navy fallback on error.



  const goToLanding = () => {
    window.setTimeout(() => {
      navigate('/landing');
    }, NAVIGATION_DELAY_MS);
  };

<<<<<<< HEAD
  const isStatic = videoEnded || !videoAvailable || !videoPlaying;

=======
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
  return (
    <div className="hero-wrapper min-h-screen h-screen flex flex-col relative overflow-hidden">
      <style>{`
        :root { 
          --navy: #032467; 
          --navy-deep: #011845; 
          --navy-mid: #0a3080; 
          --olive: #7e8100; 
          --olive-light: #a4a830; 
          --olive-mist: rgba(126,129,0,0.12); 
          --teal: #5a7e96; 
          --teal-light: #bee0e9; 
          --sprout: #74880b; 
          --sprout-light: #9ab820; 
          --globe: rgba(190,224,233,0.15); 
          --white: #FFFFFF; 
          --dark: #010e2a; 
        } 

        .hero-wrapper {
          font-family: 'DM Sans', sans-serif;
          background: var(--dark);
          color: var(--white);
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        
        .hero-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border: none;
          pointer-events: none;
<<<<<<< HEAD
          opacity: 0;
          z-index: 1;
          transition: opacity 1.5s ease-out;
          will-change: opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .hero-bg-video.playing {
          opacity: 0.6;
        }

        .hero-bg-video.fade-out {
          opacity: 0 !important;
=======
          opacity: 0.6;
          z-index: 1;
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        }

        .hero-bg-gradient {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(160deg, var(--dark) 0%, var(--navy-deep) 20%, var(--navy) 50%, var(--navy-mid) 80%, var(--navy-deep) 100%);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          opacity: 0.3;
<<<<<<< HEAD
          transition: opacity 1s ease-in, background 1s ease-in;
=======
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        }

        .hero-bg--static .hero-bg-gradient {
          opacity: 1;
        }

        .hero-bg-pattern {
          position: absolute;
          inset: 0;
          z-index: 3;
          background-image: 
<<<<<<< HEAD
            linear-gradient(30deg, rgba(255,255,255,0.03) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.03) 87.5%), 
            linear-gradient(150deg, rgba(255,255,255,0.03) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.03) 87.5%), 
            linear-gradient(30deg, rgba(255,255,255,0.03) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.03) 87.5%), 
            linear-gradient(150deg, rgba(255,255,255,0.03) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.03) 87.5%); 
          background-size: 80px 140px;
          background-position: 0 0, 0 0, 40px 70px, 40px 70px;
          opacity: 0.1;
          transition: opacity 1s ease-in;
        }

        .hero-bg--static .hero-bg-pattern {
          opacity: 0;
          pointer-events: none;
=======
            linear-gradient(30deg, var(--olive-mist) 12%, transparent 12.5%, transparent 87%, var(--olive-mist) 87.5%), 
            linear-gradient(150deg, var(--olive-mist) 12%, transparent 12.5%, transparent 87%, var(--olive-mist) 87.5%), 
            linear-gradient(30deg, var(--olive-mist) 12%, transparent 12.5%, transparent 87%, var(--olive-mist) 87.5%), 
            linear-gradient(150deg, var(--olive-mist) 12%, transparent 12.5%, transparent 87%, var(--olive-mist) 87.5%); 
          background-size: 80px 140px;
          background-position: 0 0, 0 0, 40px 70px, 40px 70px;
          opacity: 0.1;
        }

        .hero-bg--static .hero-bg-pattern {
          opacity: 0.3;
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        }

        .hero-glow { 
          position: absolute; inset: 0; z-index: 4; 
          background: 
            radial-gradient(ellipse at 55% 40%, rgba(190,224,233,0.1) 0%, transparent 50%), 
            radial-gradient(ellipse at 20% 70%, rgba(126,129,0,0.06) 0%, transparent 40%); 
<<<<<<< HEAD
          transition: opacity 1s ease-in-out;
=======
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        }

        @keyframes gradientShift { 
          0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } 
        }

<<<<<<< HEAD
        .particles { position: absolute; inset: 0; z-index: 5; overflow: hidden; transition: opacity 1s ease-in-out; }
        
        .hero-bg--static ~ .hero-glow,
        .hero-bg--static ~ .particles { 
          opacity: 0; 
          pointer-events: none; 
        }

=======
        .particles { position: absolute; inset: 0; z-index: 5; overflow: hidden; }
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        @keyframes particleFloat { 
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0 } 
        }

        .nav { position: relative; z-index: 10; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; }
<<<<<<< HEAD
        .nav-logo { display: flex; align-items: center; gap: 18px; text-decoration: none; }
        .nav-logo-text { font-size: 36px; font-weight: 800; color: white; letter-spacing: -.5px; }
=======
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-text { font-size: 22px; font-weight: 800; color: white; letter-spacing: -.5px; }
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        .nav-logo-text em { font-style: normal; color: var(--teal-light); }

        .hero-content { 
          position: relative; z-index: 6; flex: 1; display: flex; flex-direction: column; 
          align-items: center; justify-content: flex-start; text-align: center; 
<<<<<<< HEAD
          padding: 0 24px 220px; width: min(100%, 1180px); max-width: 1180px; margin: 0 auto;
          margin-top: -60px;
        }

        .tier-1 { margin-bottom: 14px;
        margin-top: -40px;  
=======
          padding: 2px 24px 220px; width: min(100%, 1180px); max-width: 1180px; margin: 0 auto; 
        }

        .tier-1 { margin-bottom: 14px;
        margin-top: -22px;  
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        opacity: 0; animation: tierFadeIn .8s ease .3s forwards; }
        .tier-1-text { 
          font-family: 'Playfair Display', serif; font-size: clamp(14px, 2vw, 17px); 
          font-style: italic; font-weight: 500; 
          color: var(--white); line-height: 1.7; letter-spacing: .3px; 
        }

        .tier-2 { margin-bottom: 15px; margin-top: -22px; opacity: 0; animation: tierFadeIn .8s ease .6s forwards; }
        .tier-2-title { 
          font-family: 'Playfair Display', serif;
           font-size: clamp(32px, 5vw, 68px); 

          font-weight: 800; line-height: 1.02; 
          color: white;
          width: 100%;
        }
        .tier-2-title .line-1 { 
          display: block;
          color: white;
        }
        .tier-2-title .accent {
          display: block;
          font-size: 0.82em;
          line-height: 1.02;
          letter-spacing: -0.01em;
<<<<<<< HEAD
          color: var(--olive-light);
=======
          background: linear-gradient(135deg, var(--teal-light), var(--olive-light), var(--sprout-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        }

        .tier-3 { margin-bottom: 20px; opacity: 0; animation: tierFadeIn .8s ease .9s forwards; }
        .tier-3-text { 
          font-size: clamp(15px, 2vw, 18px); color: var(--white); 
          max-width: 520px; line-height: 1.65; margin: 0 auto; 
        }
        .tier-3-text strong { color: rgba(190, 224, 233, 0.85); }

        .tier-4 { opacity: 0; animation: tierFadeIn .8s ease 1.2s forwards; }
        .cta-row { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; }
        .cta-main { 
          background: linear-gradient(135deg, var(--olive), var(--sprout)); color: white; 
          padding: 16px 44px; border-radius: 32px; font-size: 16px; font-weight: 700; 
          text-decoration: none; border: none; cursor: pointer; transition: all .3s; 
          box-shadow: 0 4px 24px rgba(126, 129, 0, 0.3); font-family: 'DM Sans', sans-serif; 
          display: inline-flex; align-items: center; gap: 8px; 
        }
        .cta-main:hover { transform: translateY(-2px); box-shadow: 0 8px 36px rgba(126, 129, 0, 0.45); }
        .cta-main .arrow { transition: transform .2s; }
        .cta-main:hover .arrow { transform: translateX(4px); }
        
        .cta-row-secondary { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; }
        .cta-pill { 
          display: inline-flex; align-items: center; gap: 6px; 
          padding: 10px 20px; border-radius: 24px; font-size: 12px; font-weight: 600; 
          color: #F3F7FF; text-decoration: none; 
          border: 1px solid rgba(190, 224, 233, 0.38); background: rgba(255, 255, 255, 0.08); 
          transition: all .25s; cursor: pointer; white-space: nowrap; 
        }
        .cta-pill:hover { color: #ffffff; border-color: rgba(190, 224, 233, 0.55); background: rgba(255, 255, 255, 0.14); transform: translateY(-1px); }
        .cta-genz { border-color: rgba(164, 168, 48, 0.4); color: #F0F79A; }
        .cta-genz:hover { border-color: var(--olive-light); background: rgba(126, 129, 0, 0.16); }

        .cta-gentle { font-size: 12px; color: var(--white); line-height: 1.5; }

        .trust-row { display: flex; gap: 24px; margin-top: 18px; flex-wrap: wrap; justify-content: center; opacity: 0; animation: tierFadeIn .8s ease 1.5s forwards; }
        .trust-item { display: flex; align-items: center; gap: 7px; font-size: 11px; color: rgba(190, 224, 233, 0.4); }
        .trust-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--olive-light); flex-shrink: 0; }

        .floating-stats { 
          position: absolute; z-index: 8; bottom: 0; left: 0; right: 0; 
          display: flex; justify-content: center; gap: 0; 
        }
        .float-stat { 
          background: rgba(3, 36, 103, 0.45); backdrop-filter: blur(20px); 
          border-top: 1px solid rgba(126, 129, 0, 0.15); 
          padding: 16px 20px; text-align: center; flex: 1; max-width: 190px; transition: all .3s; 
        }
        .float-stat:hover { background: rgba(3, 36, 103, 0.65); border-top-color: var(--olive-light); }
        .float-stat:not(:last-child) { border-right: 1px solid rgba(126, 129, 0, 0.08); }
        .fs-num { 
          font-family: 'Playfair Display', serif; font-size: clamp(20px, 2.6vw, 30px); 
          font-weight: 800; line-height: 1; display: block; 
          background: linear-gradient(135deg, var(--teal-light), var(--olive-light)); 
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; 
        }
        .fs-label { font-size: 9px; color: rgba(190, 224, 233, 0.4); margin-top: 5px; line-height: 1.25; }

        @keyframes tierFadeIn { 
          from { opacity: 0; transform: translateY(20px) } 
          to { opacity: 1; transform: translateY(0) } 
        }

        @media(max-width: 900px) { 
          .hero-wrapper {
            height: auto;
            min-height: 100dvh;
            min-height: 100svh;
            overflow-x: hidden;
            overflow-y: auto;
          }
          .nav { padding: 14px 16px; } 
<<<<<<< HEAD
          .nav-logo-text { font-size: 24px; }
          .hero-content {
            flex: 1;
            padding: 0px 16px 80px;
            justify-content: flex-start;
            margin-top: -20px;
          }
          .tier-1 { margin-bottom: 14px; margin-top: 16px !important; }
          .tier-2 { margin-bottom: 14px; margin-top: 0px !important; }
=======
          .nav-logo-text { font-size: 18px; }
          .hero-content {
            flex: none;
            padding: 2px 16px 20px;
            justify-content: flex-start;
          }
          .tier-1 { margin-bottom: 14px; }
          .tier-2 { margin-bottom: 14px; margin-top: -16px; }
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
          .tier-3 { margin-bottom: 18px; }
          .tier-3-text { max-width: 100%; font-size: clamp(14px, 3.8vw, 17px); }
          .tier-1-text { font-size: clamp(13px, 3.4vw, 16px); line-height: 1.6; }
          .trust-row { display: none; }
          .scroll-cue { display: none; }
          .floating-stats {
            position: relative;
            flex-wrap: wrap;
            margin-top: 8px;
          }
          .float-stat { min-width: 120px; padding: 14px 10px; flex: 1 1 45%; max-width: none; }
          .tier-2-title { font-size: clamp(26px, 6vw, 46px); }
          .cta-pill { white-space: normal; text-align: center; line-height: 1.35; }
        }
        @media(max-width: 600px) { 
          .nav { padding: 12px 14px; }
<<<<<<< HEAD
          .nav-logo img { height: 38px !important; width: 38px !important; border-radius: 10px !important; }
          .nav-logo-text { font-size: 18px !important; }
=======
          .nav-logo img { height: 34px !important; width: 34px !important; }
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
          .hero-content { padding: 0 14px 16px; }
          .floating-stats { flex-direction: column; align-items: stretch; } 
          .float-stat {
            flex: 1 1 auto;
            max-width: 100%;
            border-right: none !important;
            border-bottom: 1px solid rgba(126, 129, 0, 0.1);
          }
          .float-stat:last-child { border-bottom: none; }
          .cta-row { flex-direction: column; align-items: stretch; width: 100%; } 
          .cta-main {
            width: 100%;
            max-width: none;
            text-align: center;
            justify-content: center;
            padding: 14px 20px;
            font-size: 15px;
          }
          .cta-row-secondary { flex-direction: column; align-items: stretch; width: 100%; }
          .cta-pill {
            width: 100%;
            max-width: none;
            justify-content: center;
            padding: 12px 16px;
            font-size: 11px;
          }
          .trust-row { display: none; }
          .tier-2-title { font-size: clamp(22px, 7.2vw, 36px); }
          .fs-num { font-size: clamp(20px, 5vw, 28px); }
          .fs-label { font-size: 9px; }
        }
      `}</style>

      {/* Background layers */}
<<<<<<< HEAD
      <div className={`hero-bg${isStatic ? ' hero-bg--static' : ''}`}>
        {!videoEnded && videoAvailable && (
          <video
            ref={videoRef}
            className={`hero-bg-video ${videoPlaying ? 'playing' : ''}`}
=======
      <div className={`hero-bg${videoAvailable ? '' : ' hero-bg--static'}`}>
        {videoAvailable && (
          <video
            className="hero-bg-video"
            src={HERO_VIDEO_SRC}
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
<<<<<<< HEAD
            disablePictureInPicture
            onCanPlay={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onPlaying={() => setVideoPlaying(true)}
            onError={() => setVideoAvailable(false)}
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
=======
            onError={() => setVideoAvailable(false)}
          />
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
        )}
        <div className="hero-bg-gradient" />
        <div className="hero-bg-pattern" />
      </div>
      <div className="hero-glow" />
      <div className="particles" id="particles" />

      {/* Nav */}
      <nav className="nav">
        <a className="nav-logo" href="/">
          <img
            src="/AppIcon.jpeg"
            alt="MANAS360 logo"
            style={{
<<<<<<< HEAD
              height: '84px',
              width: '84px',
              borderRadius: '20px',
=======
              height: '52px',
              width: '52px',
              borderRadius: '14px',
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
              objectFit: 'cover',
              marginTop: '4px',
            }}
          />
          <span className="nav-logo-text">MANAS<em>360</em></span>
        </a>
      </nav>

      {/* TIERED HERO MESSAGING */}
      <div className="hero-content">
        {/* TIER 1 */}
        <div className="tier-1">
          <p className="tier-1-text">
            150 million Indians suffer in silence. You don't have to.<br />
            You're not broken. You're just carrying too much alone — <em>and you're not alone.</em>
          </p>
        </div>

        {/* TIER 2 */}
        <div className="tier-2">
          <h1 className="tier-2-title">
            <span className="line-1">You Deserve</span>
            <span className="accent">Good Vibes &amp; Great</span>
            <span className="accent">Living</span>
          </h1>
        </div>

        {/* TIER 3 */}
        <div className="tier-3">
          <p className="tier-3-text">
            India's complete mental wellness ecosystem. <strong>Verified therapists</strong>
            in your language, <strong>AI companion</strong> at 2 AM, clinical care from <strong>₹99/month</strong>.
            You don't have to carry it alone.
          </p>
        </div>

        {/* TIER 4 */}
        <div className="tier-4">
          <div className="cta-row">
            <button className="cta-main" onClick={goToLanding}>
              Take a Free 6-Min Screening <span className="arrow">→</span>
            </button>
          </div>
          <div className="cta-row-secondary">
            <button className="cta-pill" onClick={goToLanding}>
              <span className="pill-icon">🩺</span> I'm a Therapist
            </button>
            <button className="cta-pill" onClick={goToLanding}>
              <span className="pill-icon">🏢</span> I'm a CHO — Corp · College · Healthcare
            </button>
            <button className="cta-pill cta-genz" onClick={goToLanding}>
              <span className="pill-icon">⚡</span> I'm GenZ
            </button>
          </div>
          <p className="cta-gentle">
            No login. No credit card. No email required. Just 7 questions and a path forward.
          </p>
        </div>

        {/* Trust badges */}
        {/* <div className="trust-row">
          <div className="trust-item"><span className="trust-dot" />DPDPA Compliant</div>
          <div className="trust-item"><span className="trust-dot" />NMC/RCI Verified</div>
          <div className="trust-item"><span className="trust-dot" />5 Indian Languages</div>
          <div className="trust-item"><span className="trust-dot" />DPIIT Recognised</div>
        </div> */}
      </div>

      {/* Floating stats bar */}
      <div className="floating-stats">
        <div className="float-stat">
          <span className="fs-num">5</span>
          <span className="fs-label">Languages<br />Hindi · English · Tamil · Telugu · Kannada</span>
        </div>
        <div className="float-stat">
          <span className="fs-num">₹99</span>
          <span className="fs-label">Per Month<br />Platform Access</span>
        </div>
        <div className="float-stat">
          <span className="fs-num">24/7</span>
          <span className="fs-label">AnytimeBuddy<br />AI Companion</span>
        </div>
        <div className="float-stat">
          <span className="fs-num">6 min</span>
          <span className="fs-label">Free Screening<br />No Login Needed</span>
        </div>
        <div className="float-stat">
          <span className="fs-num">21</span>
          <span className="fs-label">Day Free Trial<br />No Card Required</span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
