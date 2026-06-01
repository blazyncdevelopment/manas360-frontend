import type {
  HomeSection,
  JourneyContent,
  JourneyId,
} from './howItWorksTypes';

export const journeyLabels: Record<JourneyId, string> = {
  home: "Home",
  discover: "Not Sure-Discover Myself",
  group: "Group Therapies-My Topic-Pay Less",
  patient: "Mental Wellness Seeker",
  provider: "Provider Journey",
  corporate: "Corporate Wellness",
  retreat: "Detox-Tranquility Retreats",
  training: "Certify-Earn More Journey",
  admin: "MANAS360-Admin",
  onboarding: "Anyone Onboarding-Jiffy",
  executive: "Executive-One on One Goals",
  nri: "NRI-Janmabhoomi Connection",
  analytics: "Analytics for Therapists",
  'analytics-patient': "Analytics for Patients",
  'analytics-corporate': "Analytics for Corporate",
  'analytics-chw': "Analytics for CHWs",
  buddy: "AnytimeBUDDY — 24/7 AI Companion",
  meera: "Dr. Meera — AI Health Chat",
  pet: "Digital Pet Companions",
  sound: "Sound Therapy",
  screening: "Free Mental Health Screening",
  sixer: "Hit a Sixer — Refer & Earn",
  clinic: "MyDigitalClinic",
};

export const homeSections: HomeSection[] = [
  {
    title: "🎁 Start Free — Zero Commitment",
    subtitle: "Explore MANAS360 with no login, no payment, no friction. Just pure tools to help you understand yourself better.",
    gridClass: 'freebies-grid',
    cards: [
      { id: 'discover', icon: "🔍", title: "Not Sure-Discover Myself", description: "Free screening, AnytimeBUDDY, digital pet, sound therapy, Dr. Meera chat, and more. Try free. No commitment needed.", cta: "Explore Free Tools", badge: "100% FREE", badgeType: 'freebie' },
      { id: 'group', icon: "👥", title: "Group Therapies-My Topic-Pay Less", description: "Join 4-8 person groups on YOUR topic. Same clinical depth as 1-on-1, but 40% cheaper (₹500-2K/session).", cta: "See Group Therapy", badge: "MOST AFFORDABLE", badgeType: 'freebie' },
    ],
  },
  {
    title: "🎯 Core Pathways — Your Main Journey",
    subtitle: "Choose the pathway that matches your life situation. Each has its own entry point, fees, and transformation arc.",
    gridClass: 'pathways-grid',
    cards: [
      { id: 'patient', icon: "🌟", title: "Mental Wellness Seeker", description: "Seek lasting transformation. Discovery → Booking → 7-day Retreat → 6-month support. Complete pathway.", cta: "Start Journey" },
      { id: 'provider', icon: "👨‍⚕️", title: "Provider Journey", description: "Build your practice. Register → Train → Manage clients → Lead retreats → Earn 60% of revenue.", cta: "Start Journey" },
      { id: 'corporate', icon: "💼", title: "Corporate Wellness", description: "IT HR / CSR / Hospital / College Admin. Scale team wellness, measure ROI, track outcomes.", cta: "Start Journey" },
      { id: 'retreat', icon: "🌿", title: "Detox-Tranquility Retreats", description: "7-14 day intensive. Digital detox. Nature. Therapy + naturo-therapy. Rediscover joy and purpose.", cta: "Start Journey" },
      { id: 'training', icon: "💰", title: "Certify-Earn More Journey", description: "ASHA/CHW income opportunity. 6-week training → Certification → ₹5-15K/month livelihood.", cta: "Start Journey" },
      { id: 'admin', icon: "⚙️", title: "MANAS360-Admin", description: "Operations view. Manage therapists, track outcomes, ensure safety, measure business health.", cta: "Start Journey" },
      { id: 'onboarding', icon: "⚡", title: "Anyone Onboarding-Jiffy", description: "Signup to access in minutes. No friction. No delays. Fast, smooth onboarding for everyone.", cta: "Start Journey" },
      { id: 'executive', icon: "🎯", title: "Executive-One on One Goals", description: "C-suite therapy. High-touch 1-on-1 focused on performance, clarity, purpose. Flexible scheduling.", cta: "Start Journey" },
      { id: 'nri', icon: "🌏", title: "NRI-Janmabhoomi Connection", description: "For Indians abroad. Homesick but can't go home. Therapy + cultural reconnection. Find roots, heal.", cta: "Start Journey" },
    ],
  },
  {
    title: "✨ Cool Features to Try — Each Takes <60 Seconds",
    subtitle: "Discover what makes MANAS360 different. Quick micro-experiences you can explore right now.",
    gridClass: 'features-grid',
    cards: [
      { id: 'buddy', icon: "🤖", title: "AnytimeBUDDY", description: "Your AI companion. Get dopamine hits, motivational messages, celebrate wins anytime.", cta: "Try Now", badge: "ONCE/DAY", badgeType: 'feature', featureCard: true },
      { id: 'meera', icon: "👩‍⚕️", title: "Dr. Meera Chat", description: "Talk to our AI doctor. Ask about symptoms, get gentle guidance. Safe, confidential space.", cta: "Try Now", badge: "2 MIN/DAY", badgeType: 'feature', featureCard: true },
      { id: 'pet', icon: "🐾", title: "Digital Pet", description: "Adopt & care for your healing buddy. Feed = hydration, play = movement, rest = sleep quality.", cta: "Try Now", badge: "GAMIFIED", badgeType: 'feature', featureCard: true },
      { id: 'sound', icon: "🎵", title: "Sound Therapy", description: "10 free soundscapes. Forest rain, ocean waves, meditation bells. Pure relaxation. Pick & play.", cta: "Try Now", badge: "<1 MIN", badgeType: 'feature', featureCard: true },
      { id: 'screening', icon: "📋", title: "Free Screening", description: "PHQ-9 or GAD-7 assessment. Know where you stand. Instant results, no email needed.", cta: "Try Now", badge: "2 MIN", badgeType: 'feature', featureCard: true },
      { id: 'sixer', icon: "🏏", title: "Hit A Sixer", description: "Refer a friend, both get 10% off. Cricket-themed wellness rewards. Share the healing.", cta: "Try Now", badge: "<1 MIN", badgeType: 'feature', featureCard: true },
    ],
  },
  {
    title: "📊 AI-Powered Analytics — Data-Driven Insights",
    subtitle: "See how different roles leverage real-time analytics to make smarter decisions, improve outcomes, and measure impact.",
    gridClass: 'pathways-grid',
    cards: [
      { id: 'analytics', icon: "📊", title: "Analytics for Therapists", description: "Track patient progress, predict relapse risk, identify breakthrough moments, optimize session plans, grow practice.", cta: "Explore Analytics", badge: "DATA INSIGHTS", badgeType: 'analytics' },
      { id: 'analytics-patient', icon: "📈", title: "Analytics for Patients", description: "Visualize your progress with PHQ-9 trends, mood patterns, breakthrough tracking, therapy ROI metrics in real-time.", cta: "Explore Analytics", badge: "SELF INSIGHTS", badgeType: 'analytics' },
      { id: 'analytics-corporate', icon: "🏢", title: "Analytics for Corporate", description: "HR dashboards: team wellness scores, burnout trends, retention impact, ROI calculator, compliance reports.", cta: "Explore Analytics", badge: "ORGANIZATIONAL", badgeType: 'analytics' },
      { id: 'analytics-chw', icon: "🌍", title: "Analytics for CHWs", description: "Track referral conversion rates, income growth, village mental health needs, impact on community outcomes.", cta: "Explore Analytics", badge: "COMMUNITY DATA", badgeType: 'analytics' },
    ],
  },
];

export const journeyData: Record<Exclude<JourneyId, 'home'>, JourneyContent> = {
  discover: {
    heading: "🔍 Not Sure-Discover Myself: The Free Explorer",
    description: "No commitment. No risk. Just explore MANAS360 with free tools. Perfect for people curious but not ready to book.",
    stats: [
    { icon: "💰", text: "<strong>100% Free</strong> to start" },
    { icon: "⏱️", text: "15-30 min to experience" },
    { icon: "📱", text: "All features on mobile" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Free Screening: \"Am I okay?\"", description: "Take a free 2-minute mental health screening. PHQ-9 or GAD-7 assessment. Instant results (no email required).", action: "Take free screening" },
      { number: 2, title: "AnytimeBUDDY Meet Chintu: \"Your free companion\"", description: "Meet Chintu, your dopamine buddy. Tap for encouragement, get motivational messages, celebrate small wins. No login needed.", action: "Play with Chintu" },
      { number: 3, title: "Digital Pet: \"Your healing buddy\"", description: "Adopt a free digital pet. Care for it, watch it grow. Gamified wellness: feeding = hydration, playing = movement.", action: "Adopt your pet" },
      { number: 4, title: "Sound Therapy: \"Calm your mind\"", description: "Access 10 free soundscapes: forest rain, ocean waves, meditation bells. 5-30 minutes each. Pure relaxation.", action: "Browse soundtracks" },
      { number: 5, title: "Dr. Meera Chat: \"2 min with a doctor\"", description: "Text or audio chat with Dr. Meera (AI companion). 2 minutes free per day. Ask about symptoms, get gentle guidance.", action: "Chat with Dr. Meera" },
      { number: 6, title: "Free Certification Module: \"Learn basics\"", description: "Access Module 1 free: \"Understanding Mental Health Basics.\" Video + quiz. See what full training includes.", action: "Start module 1" },
      { number: 7, title: "Gentle Upgrade Path: \"Ready for more?\"", description: "Based on screening results, see personalized recommendations: Group therapy (₹500/session), 1-on-1 (₹1000/session), Retreat (₹25K+). All optional.", action: "View recommendations" }
    ] }
    ],
    tipTitle: "💡 Why Free Tools?",
    tipText: "<strong>MANAS360 believes exploration should be free.</strong> These tools help you understand where you stand, introduce our approach, and build trust. No gates. No pressure. Just genuine tools that work.",
    next: { id: "group", label: "See Group Therapy Journey →" },
  },
  group: {
    heading: "👥 Group Therapies-My Topic-Pay Less: Heal Together",
    description: "Same clinical depth as 1-on-1, but in a group of 4-8 people on YOUR topic. Build community. Share stories. Pay 40% less. Heal more.",
    stats: [
    { icon: "💵", text: "₹500-2K per session" },
    { icon: "👥", text: "Groups of 4-8 people" },
    { icon: "🎯", text: "8-12 week cycles" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Topic-Based Groups", value: "Anxiety Circle, Burnout Recovery, Life Transitions, Relationship Healing, Grief & Loss, Career Clarity" }, { label: "Session Cost", value: "₹500-2K/session" }, { label: "Commitment", value: "8-12 weeks (1x/week)" }] },
      { cells: [{ label: "Total Investment", value: "₹4K-24K (8-12 sessions)" }, { label: "vs 1-on-1", value: "40-50% cheaper" }, { label: "Group Size", value: "4-8 people per group" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Browse & Choose: \"Find your group\"", description: "See available groups by topic. Therapist bio, schedule, cost, member testimonials.", action: "Browse groups" },
      { number: 2, title: "Free Group Intro: \"Meet before committing\"", description: "15-min free intro call. Meet therapist & hear from current members. Ask questions. Ensure fit.", action: "Schedule intro" },
      { number: 3, title: "First Session: \"You belong here\"", description: "60-90 min session. Safe space. People share. You realize: You're not alone.", action: "Attend session 1" },
      { number: 4, title: "Weekly Participation: \"The work\"", description: "Show up weekly for 8-12 weeks. Share. Listen. Learn. Your story becomes part of someone else's healing.", action: "Complete cycle" },
      { number: 5, title: "Community Bonds: \"Find your people\"", description: "Exchange WhatsApp (optional). Support between sessions. Real friendships form. Feel understood.", action: "Join WhatsApp circle" },
      { number: 6, title: "Cycle Completion: \"Measure progress\"", description: "After 8-12 weeks: PHQ-9 before/after assessment. See your improvement. Decide next steps.", action: "Complete survey" }
    ] }
    ],
    tipTitle: "💡 Why Groups?",
    tipText: "<strong>Healing is social.</strong> Group therapy is 40% cheaper but research shows equal/better outcomes. Hearing others' stories normalizes yours. Helping someone else heal, heals you.",
    next: { id: "patient", label: "See Mental Wellness Seeker →" },
  },
  patient: {
    heading: "🌟 Patient Mega-Journey: From First Click to Lasting Transformation",
    description: "The complete healing arc — from \"I'm not okay\" to \"I'm thriving.\" Five phases, every touchpoint mapped with real pricing. This is the journey 70% of MANAS360 patients follow.",
    stats: [
    { icon: "💰", text: "<strong>₹0 → ₹299/mo</strong> platform + ₹699+/session" },
    { icon: "⏱️", text: "<strong>3 min → 6 months</strong> full arc" },
    { icon: "📱", text: "Phone + OTP · PhonePe · 5 languages" }
    ],
    blocks: [
    { kind: 'phase' as const, variant: 'blue', title: "🔍 Phase 1 — Discovery (Free · No Login)", subtitle: "The courage gap is real. 70% of people who need help never seek it. This phase removes every barrier.", steps: [
      { number: 1, title: "Land on MANAS360: \"Something feels off\"", description: "Google search, WhatsApp share, or a friend's Sixer referral code brings them here. They see: free screening, AnytimeBuddy floating avatar, group therapy LIVE tiles. <strong>No login wall. No signup form. Just help.</strong>", action: "Browse landing page freely" },
      { number: 2, title: "Free Screening: \"Am I okay?\" (₹0 · 2 min)", description: "Take PHQ-9 (depression) or GAD-7 (anxiety) in Hindi, English, Tamil, Telugu, or Kannada. Via app, WhatsApp, or toll-free IVR call. <strong>Instant results with severity band:</strong> Minimal (green) → Mild (yellow) → Moderate (orange) → Severe (red). No email, no card, no data stored unless they choose.", action: "Get instant score + severity interpretation" },
      { number: 3, title: "First AnytimeBuddy Chat: \"Someone who listens\" (₹0)", description: "The floating 🤖 avatar catches their eye. Tap → \"Hi, I'm here. No judgment. What's on your mind?\" 3 free conversations per day. Buddy remembers nothing yet (no account), but the warmth is enough. <strong>For many, this is the first time they've told anyone how they feel.</strong>", action: "First conversation with AI companion" }
    ] },
    { kind: 'phase' as const, variant: 'green', title: "🔑 Phase 2 — Platform Access (₹1 auth → 6 days free)", subtitle: "The screening result + Buddy conversation creates the \"aha moment.\" Now they're ready to commit — but the 6-day free trial makes it risk-free.", steps: [
      { number: 4, title: "Phone + OTP Signup (30 seconds)", description: "Enter phone number → OTP arrives in 3 seconds → Name → Done. <strong>No email required.</strong> No password to remember. Their phone IS their identity. Seamless WhatsApp bridge activates automatically — session reminders, Buddy nudges, assessment follow-ups all flow via WA.", action: "Account created via phone + OTP" },
      { number: 5, title: "Register Payment Method + Start 21-Day Free Trial", description: "₹1 authorization via PhonePe (auto-refunded instantly). This stores their UPI/card for future charges. <strong>6 days of FULL platform access — Premium features, assessments, therapist matching, sound therapy, digital pets.</strong> They experience everything before paying a rupee. After trial: auto-converts to ₹299/month after the 6-day free trial.", action: "₹1 auth → 6 days free trial" },
      { number: 6, title: "AI-Powered Therapist Matching", description: "Based on screening results, language preference, time slots, and budget → MANAS360's 100-point matching algorithm suggests 3 therapists. Profile cards show: photo, specialization, languages, availability, session fee (₹699–₹2,999), patient reviews. <strong>Patient picks their therapist — no forced assignment.</strong>", action: "Browse matched therapists → select one" }
    ] },
    { kind: 'phase' as const, variant: 'orange', title: "🧠 Phase 3 — Therapy Arc (₹699–₹999/session · 60/40 split)", subtitle: "The clinical core. Psychologist first, psychiatrist if needed, group therapy for community. Every session paid separately via PhonePe.", steps: [
      { number: 7, title: "First Psychologist Session (₹699 · Video 50 min)", description: "Book via app or WhatsApp. Pay ₹699 via PhonePe (₹769 with video surcharge). Join Jitsi session. Therapist conducts detailed assessment, sets treatment goals, creates initial plan. SOAP notes auto-generated. <strong>Revenue split: ₹419 to therapist (60%) · ₹280 to platform (40%).</strong> Patient receives session summary + next steps via WhatsApp.", action: "First therapy session complete" },
      { number: 8, title: "Ongoing Therapy: Weeks 2-8 (₹699/session · 2-4 sessions/month)", description: "Regular CBT/DBT/REBT sessions. PHQ-9 re-assessment every 2 weeks (automated via app). Progress dashboard shows trend: \"Your anxiety score dropped from 14 to 9 in 4 weeks.\" Therapist adjusts treatment plan based on data. <strong>Between sessions: AnytimeBuddy check-ins + therapist-prescribed sound therapy tracks.</strong>", action: "Track weekly progress on dashboard" },
      { number: 9, title: "Group Therapy: \"I'm not alone\" (₹149/session)", description: "Therapist recommends joining a group: Anxiety Circle, Work Burnout, Grief & Loss, or Couples Workshop. Live sessions with 8-15 participants. ₹149/session (50% cheaper than 1:1). <strong>Social proof: \"47 people joined this week.\"</strong> Anonymous participation option. Many patients say group therapy is where the real breakthrough happens.", action: "Join first group session" },
      { number: 10, title: "Psychiatrist Escalation (If Needed · ₹999/session)", description: "If PHQ-9 stays above 15 (severe) after 4 weeks, or psychologist identifies medication need → <strong>warm referral to psychiatrist.</strong> Psychologist's notes + assessment history shared (with consent). Psychiatrist (MD) session: ₹999 via PhonePe. e-Prescription generated. Medication + therapy combined = best clinical outcomes. <strong>Not everyone needs this step — only ~20% of patients escalate.</strong>", action: "Psychiatrist evaluation + e-Rx if needed" }
    ] },
    { kind: 'phase' as const, variant: 'navy', title: "✨ Phase 4 — Premium Upgrades (The Healing Accelerators)", subtitle: "Therapy is the foundation. These tools amplify it — between sessions, before bed, during panic, on lonely nights. Therapist prescribes them like medicine.", steps: [
      { number: 11, title: "🐾 Digital Pet Companion: \"Dheeraj says Sab Theek Hai\"", description: "Therapist prescribes: \"Spend 5 min with Dheeraj (turtle/serotonin) doing breathing exercises before bed.\" Patient's first free pet (Chintu the Fox) is already Level 3 from daily engagement. Now they unlock Dheeraj for calm, Bholu for comfort after hard sessions, Mithi for connection on lonely days. <strong>Premium unlocks all 4 (₹299/M subscription).</strong> Each interaction = real neurotransmitter-mapped coping skill practice.", action: "Pet companion integrated into treatment" },
      { number: 12, title: "🎵 Sound Therapy Rx: \"Raga Yaman before sleep\"", description: "Therapist prescribes specific tracks: \"Listen to Raga Yaman (evening peace) for 15 min before our session\" or \"Ocean waves white noise for sleep — your insomnia pattern shows 2-3 AM waking.\" Rx tracks unlock FREE even on free tier (💊 badge). Own tracks forever at ₹30 each, or get unlimited with Premium. <strong>Analytics show: patients who use prescribed sound therapy report 40% better sleep within 2 weeks.</strong>", action: "Sound prescription active" },
      { number: 13, title: "🤖 AnytimeBuddy Hour Pack: \"3 AM panic covered\"", description: "Free tier gives 3 chats/day, but severe anxiety doesn't follow schedules. Therapist recommends: \"Get the 3-hour pack (₹999) — use it for panic episodes between our sessions.\" Buddy knows their treatment plan, remembers last session's homework, guides them through CBT exercises at 3 AM when no human is available. <strong>₹999 for 180 minutes of on-demand AI support = ₹5.55/minute. Cheaper than any crisis line.</strong>", action: "Buddy available for crisis moments" },
      { number: 14, title: "💑 Specialty Upgrade: Couples / Sleep / Executive", description: "As therapy progresses, root causes surface: \"My anxiety comes from my marriage\" → Couples Therapy (₹1,499/session). \"I can't sleep\" → Sleep Therapy specialist (₹1,499/session). \"Work is killing me\" → Executive Coach (₹1,999/session, weekends). For NRIs: therapy in mother tongue (₹2,999–₹3,599/session). <strong>Each specialty is a lateral upgrade, not a replacement — patients often run 1:1 + specialty in parallel.</strong>", action: "Add specialty service to treatment plan" }
    ] },
    { kind: 'phase' as const, variant: 'pink', title: "🌿 Phase 5 — Transformation (Retreat → Alumni → Give Back)", subtitle: "From episodic to transformational. The retreat is the crescendo — but the alumni community and give-back loop ensure the change lasts forever.", steps: [
      { number: 15, title: "🌿 Wellness Retreat: \"The Deep Reset\" (₹25K–₹50K · 7 days)", description: "After 3-6 months of therapy, patient is ready for immersive healing. Choose: Rishikesh (Himalayan silence) · Coorg (coffee plantation calm) · Goa (ocean restoration) · Kerala (Ayurvedic integration). 7 days: daily therapy + naturopathy + yoga + digital detox + sound healing + group ceremony. <strong>Accommodation + meals + all sessions included. Pay via PhonePe.</strong>", action: "Book retreat via MANAS360" },
      { number: 16, title: "Post-Retreat Support: \"The Landing\" (6 months included)", description: "Re-entry is fragile. MANAS360 wraps the retreat with: 4 virtual follow-up sessions (bi-weekly), daily AnytimeBuddy check-ins, PHQ-9 re-assessment at 1/3/6 months, alumni WhatsApp community. <strong>Average post-retreat PHQ-9 improvement: 62% reduction from baseline.</strong> Therapist monitors remotely — if scores spike, intervention is immediate.", action: "6-month follow-up active" },
      { number: 17, title: "🏏 Give Back: \"Hit a Sixer for someone else\"", description: "The transformed patient becomes the referrer. They share their Sixer code: \"This platform changed my life. Use SIXER-XXXX and we both get ₹70 off.\" Their friend starts at Step 1. <strong>The healing cycle continues.</strong> Top referrers earn: free group sessions, digital pet unlocks, sound bundles. Some patients even pursue the Certification journey (training module) to become peer counselors themselves.", action: "Refer friends → healing multiplies" }
    ] },
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Platform Access", value: "₹299/mo" }, { label: "Psychologist Session", value: "₹699/session" }, { label: "Psychiatrist Session", value: "₹999/session" }] },
      { cells: [{ label: "Group Therapy", value: "₹149/session" }, { label: "AnytimeBuddy Pack", value: "₹399–₹1,699" }, { label: "Wellness Retreat", value: "₹25K–₹50K (7 days)" }] }
    ] }
    ],
    tipTitle: "🧠 The Full Arc — From Episodic to Transformational",
    tipText: "<strong>Most platforms stop at Step 8 (weekly therapy).</strong> MANAS360 goes further: group support (Step 9), psychiatric integration (Step 10), AI companions that work 24/7 between sessions (Steps 11-13), specialty escalation (Step 14), immersive retreat (Step 15), and a 6-month landing protocol (Step 16). Then the patient becomes the healer (Step 17). <strong>That's the difference between episodic care and lasting transformation.</strong>",
    next: { id: "provider", label: "See Provider View →" },
  },
  provider: {
    heading: "👨‍⚕️ Provider Journey: Build Your Practice",
    description: "500+ verified therapists on MANAS360. Register, get trained, grow your practice, and earn 60% of revenue.",
    stats: [
    { icon: "💵", text: "Earn 60% of session fees" },
    { icon: "📍", text: "₹1000-5000/session (therapist keeps 60%)" },
    { icon: "👥", text: "Built-in patient base from MANAS360" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Standard Session (1-on-1)", value: "₹1000/session (You earn 60% = ₹600)" }, { label: "Group Session (4-8 people)", value: "₹2K-4K (You earn 60% of each participant)" }, { label: "Retreat Leadership (7 days)", value: "₹50K-150K (60% of retreat revenue)" }] },
      { cells: [{ label: "Onboarding", value: "Free + 4-week paid training" }, { label: "Support", value: "Weekly sync with Clinical Lead + Supervision" }, { label: "Real-time Analytics", value: "Earnings dashboard + Patient progress tracking" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Registration: \"Join the network\"", description: "Create account, upload NMC/RCI credentials. Verification within 48 hours.", action: "Start registration" },
      { number: 2, title: "Profile Setup: \"Tell your story\"", description: "Bio, specializations, languages, availability, rates. Immediately visible to patients with \"Verified\" badge.", action: "Build profile" },
      { number: 3, title: "Training: \"Get certified\"", description: "4-week onboarding: MANAS360 protocols, crisis management, patient matching, naturo-therapy basics.", action: "Complete training" },
      { number: 4, title: "First Client: \"Get matched\"", description: "Platform matches you with patient. Free 15-min consultation. Assess therapeutic fit.", action: "View client queue" },
      { number: 5, title: "Ongoing Practice: \"Scale your impact\"", description: "Conduct sessions, track progress, earn 60% of fees, access retreat leadership opportunities.", action: "View earnings" }
    ] }
    ],
    tipTitle: "💡 Key Insights for Therapists",
    tipText: "<strong>MANAS360 is built FOR therapists.</strong> You keep 60% of revenue, get trained in specialized protocols, have access to built-in patient base, and get real-time support from Clinical Advisory Board.",
    next: { id: "corporate", label: "See Corporate View →" },
  },
  corporate: {
    heading: "💼 Corporate Wellness Journey: Team Health at Scale",
    description: "IT HR / CSR / Hospital / College Admin. Measure ROI, track outcomes, prove impact with real data.",
    stats: [
    { icon: "👥", text: "25-1000 people per program" },
    { icon: "💵", text: "₹35-60K/person for retreat" },
    { icon: "📊", text: "-40% burnout, +12% retention ROI" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Team Size: 25-50 people", value: "₹8.75L-30L (₹35K-60K/person)" }, { label: "Team Size: 51-100 people", value: "₹17.85L-60L (₹35K-60K/person)" }, { label: "Team Size: 100+ people", value: "Custom pricing (₹30K-50K/person)" }] },
      { cells: [{ label: "Includes", value: "5-7 day retreat + 6 months post-retreat support" }, { label: "Delivered", value: "Group therapy + Individual sessions + Naturo-therapy" }, { label: "Measured", value: "Pre/post/6-month PHQ-9 + NPS + Retention impact" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Discovery: \"We need wellness\"", description: "HR leader sees MANAS360, recognizes team burnout. Books discovery call with corporate specialist.", action: "Schedule call" },
      { number: 2, title: "Proposal: \"Business case\"", description: "Get custom proposal with team size, retreat dates, cost, ROI projections. Budget approved.", action: "View sample proposal" },
      { number: 3, title: "Baseline: \"Measure before\"", description: "Team takes confidential pre-assessment: PHQ-9, GAD-7, team dynamics. Baseline data captured (anonymized).", action: "Send baseline survey" },
      { number: 4, title: "Enrollment: \"Team registration\"", description: "HR shares enrollment link. Employees select retreat dates. Health screening by clinician.", action: "Enroll team" },
      { number: 5, title: "Retreat: \"Transformation week\"", description: "5-7 day intensive. Group therapy, trust-building, individual check-ins, nature. Therapists run groups, managers step back.", action: "Execute retreat" },
      { number: 6, title: "Post-Retreat: \"Sustain gains\"", description: "Monthly virtual sessions (6 months). Quarterly micro-retreats. HR dashboard tracks real-time engagement.", action: "View dashboard" },
      { number: 7, title: "Impact: \"Prove ROI\"", description: "6-month re-assessment: -40% burnout avg, +12% retention, +35% team trust. Case study published (with permission).", action: "View impact report" }
    ] }
    ],
    tipTitle: "💡 Why Corporate Chooses MANAS360",
    tipText: "<strong>This isn't a team offsite. It's measured transformation.</strong> Real clinical depth, ongoing support, and proven ROI. Your best talent feels valued. Your org culture improves. Data proves it.",
    next: { id: "retreat", label: "See Retreat Journey →" },
  },
  retreat: {
    heading: "🌿 Detox-Slow-Tranquility-Find a Spark Again Retreats",
    description: "7-14 day intensive. Digital detox. Nature. Therapy + naturo-therapy. Leave burnout behind. Rediscover joy.",
    stats: [
    { icon: "📍", text: "Goa, Kerala, Himalayas, Coorg" },
    { icon: "💵", text: "₹25K-75K (solo)" },
    { icon: "🌍", text: "6-month post-retreat support" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Solo Detox Retreat (7 days)", value: "₹25K-50K" }, { label: "Solo Detox Retreat (14 days)", value: "₹50K-75K" }, { label: "Couple's Healing Retreat (7 days)", value: "₹80K (both)" }] },
      { cells: [{ label: "Location Variations", value: "Goa (coastal) ₹25K | Kerala (Ayurveda) ₹35K | Himalayas (mountain) ₹40K | Coorg (nature) ₹30K" }, { label: "Includes", value: "Therapy + Naturo-therapy + Meals + Rooms + Transport from airport" }, { label: "Post-Retreat", value: "4 virtual sessions (bi-weekly, 6 months) + Herbal protocols" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Discovery: \"I need to get away\"", description: "Land on MANAS360. See retreat options (solo, couple, corporate). Each location highlighted.", action: "Browse retreats" },
      { number: 2, title: "Preparation: \"Getting ready\"", description: "Email sequence leading up: Day 1 = Welcome, Day 3 = Schedule, Day 5 = Packing, Day 7 = Final call.", action: "Download kit" },
      { number: 3, title: "Arrival: \"You're here\"", description: "Land at resort. Leave phone (digital detox protocol). Welcome dinner. Meet your group. Nerves + hope.", action: "Check in" },
      { number: 4, title: "Daily Rhythm: \"The magic\"", description: "6:30 AM Yoga → 8:30 AM Therapy group → 1:30 PM Naturo-therapy → 5 PM Activity → 7 PM Circle. Repeat 7-14 days.", action: "View schedule" },
      { number: 5, title: "Breakthroughs: \"Things shift\"", description: "Day 3-4: Walls come down. Cry. Laugh. Realize what you've been carrying. Therapist holds space. Group supports.", action: "Read stories" },
      { number: 6, title: "Closure: \"The last night\"", description: "Final circle. Share transformations. Receive \"home protocols\" (herbal remedies, daily practices). Optional video testimonial.", action: "Plan practices" },
      { number: 7, title: "Post-Retreat: \"Sustain change\"", description: "4 bi-weekly virtual sessions (6 months). Re-assessment. Alumni community. Some continue therapy or 1-on-1.", action: "View follow-up" }
    ] }
    ],
    tipTitle: "💡 Why Intensive Works",
    tipText: "<strong>Transformation requires depth.</strong> 1 hour/week takes 2 years. 7 days of immersion = exponential healing. Therapy + nature + community + naturo-therapy resets your nervous system. You come home different.",
    next: { id: "training", label: "See Certify-Earn More →" },
  },
  training: {
    heading: "💰 Certify-Earn More Journey: Build Your Income",
    description: "Community health workers get trained, certified, and unlock sustainable income. 6 weeks to ₹5-15K/month.",
    stats: [
    { icon: "⏱️", text: "<strong>6-8 weeks</strong> to certification" },
    { icon: "💵", text: "Earn <strong>₹5-15K/month</strong> post-cert" },
    { icon: "💰", text: "₹500-2K per referral" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Training Cost", value: "Free (sponsored by MANAS360)" }, { label: "Duration", value: "6-8 weeks (on-site + online hybrid)" }, { label: "Income per Referral", value: "₹500-2K (converted to therapy)" }] },
      { cells: [{ label: "Monthly Income (Avg)", value: "₹5-15K (2-5 referrals/week)" }, { label: "Additional Income", value: "Group therapy session support (₹500-1K/session)" }, { label: "Support", value: "Monthly group calls + WhatsApp support + Annual refresher training" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Recruitment: \"Join the mission\"", description: "ASHA/CHW hears about MANAS360 training. Minimal quals: class 8+ education + interest in mental health.", action: "View flyer" },
      { number: 2, title: "Induction: \"Welcome aboard\"", description: "1-day workshop at district center. MANAS360 model intro. Mobile app demo. Receive training kit (manual, flashcards, certs).", action: "Explore materials" },
      { number: 3, title: "Module Learning: \"The framework\"", description: "Weeks 1-4: 5 core modules (blended). NLP basics, empathy, 5Why framework, crisis ID. Videos + group sessions + WhatsApp support.", action: "Access modules" },
      { number: 4, title: "Practical Training: \"Learn by doing\"", description: "Weeks 5-6: Role-play exercises with facilitators. Practice IVR, PHQ-9 screening, community outreach. Video recorded for feedback.", action: "Practice" },
      { number: 5, title: "Certification: \"Prove mastery\"", description: "Week 7: Written + practical exam. 60% pass threshold. Pass = Certificate + App activation + Income unlocked.", action: "Take exam" },
      { number: 6, title: "Deployment: \"Back to village\"", description: "Return to village with app + IVR system. Start identifying people in crisis. Route to platform for professional help. Earn referral fees.", action: "Deploy" },
      { number: 7, title: "Ongoing Growth: \"Build income\"", description: "Monthly group calls. WhatsApp support. Quarterly refreshers. Escalation protocols for complex cases. Income grows with consistent effort (₹8-15K/month possible).", action: "View opportunity" }
    ] }
    ],
    tipTitle: "💡 Key Insights for CHWs",
    tipText: "<strong>This is an income opportunity, not just training.</strong> Get certified in 6-8 weeks. Start earning ₹5-15K/month through referrals and session support. Build a sustainable livelihood while helping your community access mental health.",
    next: { id: "admin", label: "See Admin View →" },
  },
  admin: {
    heading: "⚙️ MANAS360-Admin: Keeping the Platform Running",
    description: "Operations perspective. Manage therapists, track outcomes, ensure safety, and measure business health.",
    stats: [
    { icon: "📊", text: "Real-time dashboards & alerts" },
    { icon: "🔍", text: "Therapist management & compliance" },
    { icon: "🚨", text: "Incident & crisis tracking" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Daily Dashboard: \"The pulse\"", description: "Every morning: platform health, active users, therapist workload, incident log, revenue. Automated alerts flag issues.", action: "View dashboard" },
      { number: 2, title: "Therapist Onboarding: \"Add to network\"", description: "New therapist applies. Verify credentials, background check, training completion. Profile goes live with \"Verified\" badge.", action: "Process application" },
      { number: 3, title: "Quality Monitoring: \"Ensure excellence\"", description: "Weekly spot-checks: review therapy recordings (consent obtained). Patient NPS monitored. If issues = coaching conversation.", action: "Run QA" },
      { number: 4, title: "Incident Management: \"Safety first\"", description: "Incident reported (suicidal ideation, crisis). Admin logs it, escalates to Clinical Lead. Follow-up protocol initiated. Data tracked.", action: "Review protocols" },
      { number: 5, title: "Retreat Operations: \"Execute flawlessly\"", description: "Month before: venue booked, therapists assigned, naturo-doctors confirmed, transport arranged. Daily check-ins during. Post-retreat debrief.", action: "View checklist" },
      { number: 6, title: "Outcomes Tracking: \"Measure impact\"", description: "All participants: PHQ-9/GAD-7 pre/post/3-month/6-month. Track aggregated metrics: avg improvement %, retention, case study opportunities.", action: "View outcomes" },
      { number: 7, title: "Business Intelligence: \"Make decisions\"", description: "Monthly reports: revenue by pathway, therapist ranking, patient lifetime value, churn risk analysis. Data informs strategy.", action: "View BI reports" }
    ] }
    ],
    tipTitle: "💡 Key Insights for Operations",
    tipText: "<strong>Complete visibility into platform health.</strong> Clinical quality, business metrics, and safety all in one place. Data-driven decisions = sustainable growth.",
    next: { id: "onboarding", label: "See Onboarding Journey →" },
  },
  onboarding: {
    heading: "⚡ Anyone Onboarding-Jiffy: Registration to Access in Minutes",
    description: "Quick, seamless onboarding for everyone. From signup to first interaction in minutes. No forms friction.",
    stats: [
    { icon: "🚀", text: "Minutes from signup to access" },
    { icon: "✅", text: "All roles supported" },
    { icon: "📱", text: "Mobile-first design" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Quick Registration: \"Just email + password\"", description: "Enter email, create password. Choose role. No 20-page forms. No delays.", action: "Register" },
      { number: 2, title: "Profile Completion: \"Tell us just enough\"", description: "Name, location, phone (optional). For therapists: credential upload (optional now, required later). Minimal friction.", action: "Complete profile" },
      { number: 3, title: "Email Verification: \"Instant\"", description: "Click link in email (2 seconds). Account activated. Ready to explore.", action: "Verify email" },
      { number: 4, title: "Access Granted: \"You're in\"", description: "Immediate access to dashboard. Patients see retreat options. Therapists see patient queue. CHWs see IVR. Corporate sees enrollment tools.", action: "View dashboard" },
      { number: 5, title: "First Action: \"Start immediately\"", description: "Patient: Browse & book. Therapist: View first client. CHW: Download app. Corporate: Enroll team. No \"pending approval\" messages.", action: "Take action" },
      { number: 6, title: "Optional Enrichment: \"As you go\"", description: "Add details as needed: bio, specializations, roster upload. Nothing blocks access. Enrich later.", action: "Enrich profile" },
      { number: 7, title: "Ongoing Support: \"We're here\"", description: "In-app help, chat support, email. Most people don't need it—experience is intuitive. Less friction = higher adoption.", action: "Get support" }
    ] }
    ],
    tipTitle: "💡 Why Jiffy Works",
    tipText: "<strong>Friction kills adoption.</strong> Every extra field, every delay—reduces who tries MANAS360. Jiffy onboarding means more people actually experience the platform. Experience is what converts.",
    next: { id: "executive", label: "See Executive Journey →" },
  },
  executive: {
    heading: "🎯 Executive-One on One Focused Goals-Manifest",
    description: "C-suite therapy. High-touch 1-on-1 focused on performance, clarity, purpose. Flexible scheduling. Executive-level discretion.",
    stats: [
    { icon: "💵", text: "₹2000-5000 per session" },
    { icon: "⏱️", text: "Flexible scheduling (early mornings, weekends)" },
    { icon: "🎯", text: "Performance + clarity + purpose" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Initial Consultation (60 min)", value: "₹2000-3000" }, { label: "Ongoing Sessions (60-90 min)", value: "₹3000-5000/session" }, { label: "Frequency", value: "Weekly (12 weeks) or ongoing" }] },
      { cells: [{ label: "12-Week Program Cost", value: "₹36K-60K (12 sessions)" }, { label: "Includes", value: "Therapy + Executive coaching hybrid + Progress tracking" }, { label: "Post-Program", value: "Monthly check-ins or alumni network" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Initial Consultation: \"Let's understand you\"", description: "60-min deep dive with senior therapist. Performance anxiety? Imposter syndrome? Decision fatigue? Leadership isolation? Set clear goals.", action: "Schedule" },
      { number: 2, title: "Therapist Match: \"Your dedicated therapist\"", description: "Senior therapist experienced with C-suite. Understands pressure, stakes, confidentiality. You're their focus.", action: "Meet therapist" },
      { number: 3, title: "Weekly Sessions: \"The work\"", description: "60-90 min weekly sessions. Flexible timing (7 AM, 6 PM, weekends). Focus: decision clarity, stress mgmt, relationships, purpose.", action: "Schedule recurring" },
      { number: 4, title: "Performance Coaching: \"Clarity in action\"", description: "Therapy + coaching hybrid. Between sessions, track progress on stated goals. Practical strategies tailored to your role.", action: "Track progress" },
      { number: 5, title: "Leadership Resilience: \"You're stronger\"", description: "After 12 weeks: Clearer decisions, better boundaries, less imposter syndrome. Better presence with team. More authentic leadership.", action: "Measure progress" },
      { number: 6, title: "Ongoing Optimization: \"Continue or graduate\"", description: "After initial goals: Monthly check-ins, pause during slower seasons, or graduate. Therapist remains available for future needs.", action: "Plan next phase" },
      { number: 7, title: "Executive Alumni Network: \"Peer community\"", description: "Join exclusive alumni circle of other executives who've done deep work. Quarterly confidential mastermind sessions. Peer support.", action: "Join mastermind" }
    ] }
    ],
    tipTitle: "💡 Why Executives Choose MANAS360",
    tipText: "<strong>Because you need privacy + expertise.</strong> Can't take 7 days off. Need flexible scheduling. Need therapist who understands your world. This is therapy designed for the C-suite.",
    next: { id: "nri", label: "See NRI Journey →" },
  },
  nri: {
    heading: "🌏 NRI-Find a Janmabhoomi Connection-Heal",
    description: "For Indians abroad. Homesick but can't go home. Therapy + cultural reconnection. Find roots, heal displacement.",
    stats: [
    { icon: "🌍", text: "Global time zones" },
    { icon: "💵", text: "₹1500-4000 per session" },
    { icon: "🗣️", text: "Hindi, English, regional languages" }
    ],
    blocks: [
    { kind: 'pricing' as const, rows: [
      { cells: [{ label: "Weekly Sessions", value: "₹1500-4000/session (based on specialization)" }, { label: "12-Week Program", value: "₹18K-48K (12 sessions)" }, { label: "Ongoing Support", value: "Monthly or as-needed sessions" }] },
      { cells: [{ label: "Languages Offered", value: "Hindi, English, Tamil, Telugu, Kannada, Marathi, Gujarati" }, { label: "Scheduling", value: "Any timezone (synchronous video)" }, { label: "Therapist Specialization", value: "Indian-origin, NRI displacement expertise" }] }
    ] },
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Recognition: \"I'm homesick but can't go home\"", description: "You're in London, US, Singapore, Australia. Successful career. Good life. But something's missing. The sounds. The people.", action: "Share your story" },
      { number: 2, title: "Therapist Match: \"Someone who knows\"", description: "Matched with Indian-origin therapist who specializes in NRI displacement. They understand the unique pain: success far from home, cultural dissonance.", action: "Connect" },
      { number: 3, title: "Emotional Excavation: \"What you're grieving\"", description: "Weekly sessions (your timezone) exploring: What does 'home' mean? Who do you miss? What would reconnecting look like? Permission to feel.", action: "Begin journey" },
      { number: 4, title: "Cultural Reconnection: \"Heal through roots\"", description: "Specialized sessions: listen to grandmother's stories, explore regional poetry/songs, connect with diaspora community online.", action: "Explore practices" },
      { number: 5, title: "Integration: \"You can be both\"", description: "Realization: Don't have to choose. Successful abroad AND have roots. Miss India AND love new home. Honor both identities.", action: "Integration work" },
      { number: 6, title: "Action Plan: \"Bridge the distance\"", description: "With therapist: Plan reconnection (visit timing, call family more, learn language, join diaspora, start projects honoring roots).", action: "Create plan" },
      { number: 7, title: "Ongoing Connection: \"The threads hold\"", description: "Monthly sessions (ongoing). Join MANAS360 NRI community (WhatsApp, Slack). Share stories with others doing same work. Longing transforms into belonging.", action: "Join community" }
    ] }
    ],
    tipTitle: "💡 Why NRI-Specific?",
    tipText: "<strong>Homesickness is real grief.</strong> You've sacrificed proximity to home for opportunity. That's a real loss. This therapy honors that loss while helping you build new roots without abandoning old ones. You're not broken. You're healing displacement.",
    next: { id: "analytics", label: "See AI-Powered Analytics →" },
  },
  analytics: {
    heading: "📊 AI-Powered Analytics for Therapists: Optimize Patient Care",
    description: "Real-time dashboards help therapists track patient progress, predict relapse risk, identify breakthrough moments, and optimize session plans.",
    stats: [
    { icon: "📈", text: "Real-time patient progress tracking" },
    { icon: "🚨", text: "Relapse risk prediction (AI-powered)" },
    { icon: "💡", text: "Breakthrough moment identification" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Dashboard Overview: \"Your practice at a glance\"", description: "See all active clients with: current PHQ-9 score, session frequency, progress trend, risk flags, next appointment reminder.", action: "View dashboard" },
      { number: 2, title: "Progress Tracking: \"See improvement in real-time\"", description: "Each session: patient completes brief check-in (mood, sleep, stress, wins). AI aggregates into trend graphs. Therapist sees weekly/monthly patterns.", action: "Track patient progress" },
      { number: 3, title: "Relapse Risk Alerts: \"Early intervention\"", description: "AI analyzes patient patterns. If mood dips, sleep worsens, or engagement drops → \"yellow flag\" alert. Therapist can proactively check in before crisis.", action: "Review alerts" },
      { number: 4, title: "Breakthrough Detection: \"Celebrate wins\"", description: "AI notices when patient: speaks differently, reports wins, tries new behaviors, improves sleep/mood significantly. \"Breakthrough!\" notification celebrates progress.", action: "See breakthroughs" },
      { number: 5, title: "Session Planning: \"Optimize next session\"", description: "Before session: AI summarizes last session, flags unresolved issues, suggests topics to explore. Therapist can prepare better sessions.", action: "Plan sessions" },
      { number: 6, title: "Outcome Metrics: \"Measure your impact\"", description: "Monthly reports: avg PHQ-9 improvement across caseload, % patients showing significant progress, avg session quality scores, recommendation rate.", action: "View metrics" },
      { number: 7, title: "Practice Growth: \"Scale with confidence\"", description: "Data shows which treatment approaches work best with your clientele. Use insights to refine practice, attract more patients, build reputation.", action: "Optimize practice" }
    ] }
    ],
    tipTitle: "💡 Analytics = Better Care",
    tipText: "<strong>Data-driven therapy = better outcomes.</strong> Real-time insights help you catch problems early, celebrate progress loudly, and continuously improve. Your patients feel seen.",
    next: { id: "analytics-patient", label: "See Patient Analytics →" },
  },
  'analytics-patient': {
    heading: "📈 AI-Powered Analytics for Patients: Visualize Your Journey",
    description: "See your progress with beautiful charts and real-time insights. Track mood trends, breakthrough moments, therapy ROI, and celebrate your wins.",
    stats: [
    { icon: "📊", text: "PHQ-9 trend graphs" },
    { icon: "😊", text: "Daily mood tracking" },
    { icon: "💎", text: "Breakthrough celebration" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Baseline Assessment: \"Where you stand\"", description: "First session: take PHQ-9 assessment. Get your baseline score (0-27). See visual representation of your starting point.", action: "Take baseline" },
      { number: 2, title: "Daily Check-Ins: \"How are you today?\"", description: "Each day: 30-second check-in (mood 1-10, sleep quality, stress level, one win). Optional voice note. AI compiles into daily dashboard.", action: "Daily check-in" },
      { number: 3, title: "Progress Visualization: \"See yourself improving\"", description: "Weekly graph shows: PHQ-9 trend (going down = good!), mood weekly average, sleep/stress patterns. Visual proof you're getting better.", action: "View progress graph" },
      { number: 4, title: "Breakthrough Moments: \"Celebrate wins\"", description: "When you report significant win or mood jump, AI celebrates: \"Breakthrough! 🎉 You tried something new today.\" Gamified dopamine hit.", action: "Celebrate" },
      { number: 5, title: "Therapy ROI: \"Measure the value\"", description: "After 6 weeks: AI calculates your progress (e.g., \"PHQ-9 improved 35%\"). Cost per point of improvement. \"You're on track for ___% improvement by month 3.\"", action: "View ROI" },
      { number: 6, title: "Streak & Gamification: \"Build momentum\"", description: "Track: \"Daily check-in streak: 45 days\" or \"Sessions attended: 12/12.\" Badges for consistency, breakthroughs, milestones.", action: "View streaks" },
      { number: 7, title: "6-Month Review: \"How far you've come\"", description: "6-month reassessment: compare PHQ-9 (baseline → now), mood trends, breakthroughs achieved, habits built. Visual journey proof. \"You did it!\"", action: "View 6-month review" }
    ] }
    ],
    tipTitle: "💡 Analytics = Motivation",
    tipText: "<strong>You can't manage what you can't see.</strong> Beautiful visualizations of your progress keep you motivated. Seeing PHQ-9 drop 12 points = proof therapy works. Celebration = dopamine = continued engagement.",
    next: { id: "analytics-corporate", label: "See Corporate Analytics →" },
  },
  'analytics-corporate': {
    heading: "🏢 AI-Powered Analytics for Corporate: ROI & Impact Dashboards",
    description: "HR dashboards show team wellness scores, burnout trends, retention impact, and ROI calculators in real-time.",
    stats: [
    { icon: "📊", text: "Team wellness aggregated (anonymized)" },
    { icon: "📉", text: "Burnout trend analysis" },
    { icon: "💰", text: "Retention ROI calculator" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Baseline Dashboard: \"Team health snapshot\"", description: "Before retreat: see aggregated team PHQ-9 (anonymized), burnout levels, engagement scores, turnover risk score.", action: "View baseline" },
      { number: 2, title: "Participation Tracking: \"Who's engaged\"", description: "Real-time: see % team in retreat, daily attendance rate, session participation, program completion progress (no names, just aggregate).", action: "Track participation" },
      { number: 3, title: "Post-Retreat Trends: \"Measure impact\"", description: "Week 1 post-retreat: see average mood improvement, sleep quality jump, stress reduction across team. Visualize the immediate impact.", action: "View post-retreat trends" },
      { number: 4, title: "Burnout Trend Analysis: \"Prevention\"", description: "3-month trend: team PHQ-9 average (declining = good!), burnout prevalence (% of team at risk), identifying at-risk groups for targeted support.", action: "View burnout trends" },
      { number: 5, title: "Retention Impact: \"The business case\"", description: "Correlate: retreat participation → employee turnover reduction. Example: \"Teams with high participation show 12% lower turnover vs control.\"", action: "Calculate retention ROI" },
      { number: 6, title: "Cohort Comparison: \"Which groups improve most\"", description: "Compare: engineering team vs sales vs HR. Which departments improved most? Use insights for targeted future programs.", action: "Analyze cohorts" },
      { number: 7, title: "6-Month Business Report: \"Prove the investment\"", description: "Executive summary: \"Team wellness improved 40%, retention up 12%, engagement +35%, cost per improvement = Rs X. Next year's program justified.\"", action: "Generate report" }
    ] }
    ],
    tipTitle: "💡 Analytics = Business Case",
    tipText: "<strong>Data proves wellness ROI.</strong> Beautiful dashboards show CFO that wellness isn't a \"nice-to-have\"—it's a direct business lever. Retention savings alone justify the investment.",
    next: { id: "analytics-chw", label: "See CHW Analytics →" },
  },
  'analytics-chw': {
    heading: "🌍 AI-Powered Analytics for CHWs: Track Your Impact & Income",
    description: "CHWs see referral conversion rates, income growth, village mental health needs, and community impact in real-time.",
    stats: [
    { icon: "📞", text: "Referral conversion tracking" },
    { icon: "💵", text: "Income growth dashboard" },
    { icon: "🌍", text: "Village health needs analysis" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Onboarding Dashboard: \"Your platform\"", description: "Post-certification: see dashboard with: your referral link, income to-date (₹0), pending conversions, village population served.", action: "View dashboard" },
      { number: 2, title: "Referral Tracking: \"Who you've helped\"", description: "Each person you refer: track their status (lead → consultation → therapy started). See who converted. Celebrate: \"5 people in therapy now!\"", action: "Track referrals" },
      { number: 3, title: "Conversion Metrics: \"Your success rate\"", description: "See: \"10 referrals → 7 conversions = 70% conversion rate.\" AI compares to peers: \"You're in top 15% of CHWs!\" Motivational benchmarking.", action: "View conversion" },
      { number: 4, title: "Income Growth: \"Your earnings\"", description: "Monthly income tracker: ₹500 × referral + ₹1K × group sessions supported + bonuses. Real-time: \"This month: ₹8,500. On track for ₹12K next month.\"", action: "View income" },
      { number: 5, title: "Village Health Insights: \"Your impact\"", description: "AI analyzes patterns: \"Top issues in your village: anxiety (40%), grief (30%), burnout (20%).\" Use insights to tailor community outreach.", action: "View health insights" },
      { number: 6, title: "Peer Comparison: \"See your potential\"", description: "Anonymous comparison: \"Top CHWs in your region earn ₹15K/month with 40+ conversions.\" Motivates growth without shaming.", action: "View peer benchmarks" },
      { number: 7, title: "Growth Plan: \"Next level income\"", description: "AI suggests: \"If you increase outreach to 10 people/week, earn ₹18K/month. Here's how other top CHWs did it...\" Actionable steps.", action: "View growth plan" }
    ] }
    ],
    tipTitle: "💡 Analytics = Empowerment",
    tipText: "<strong>See your impact and income grow.</strong> Real-time dashboards show CHWs how their work directly translates to village health improvement and personal income. Transparency + achievement = motivation.",
    next: { id: "discover", label: "Explore Free Tools →" },
  },
  buddy: {
    heading: "🤖 AnytimeBUDDY: Your 24/7 AI Companion",
    description: "Always available. Never judges. Remembers your journey. AnytimeBuddy is your between-session support system powered by Claude AI.",
    stats: [
    { icon: "💰", text: "<strong>3 free/day</strong> · ₹399/hr pack" },
    { icon: "⏱️", text: "Available <strong>24/7</strong>" },
    { icon: "🌐", text: "Hindi · English · Tamil · Telugu · Kannada" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Open AnytimeBuddy", description: "Tap the floating 🤖 avatar on any screen. It's always there — bottom right corner. No login needed for first 3 daily chats.", action: "Tap avatar" },
      { number: 2, title: "Choose Your Mode", description: "Quick Check-In (5 min mood scan) · Guided Breathing (90-second calm) · Just Talk (open conversation) · Session Prep (prepare for upcoming therapy)", action: "Select mode" },
      { number: 3, title: "Chat in Your Language", description: "Type or voice in Hindi, English, Tamil, Telugu, or Kannada. Buddy responds in the same language. Mix languages freely — it understands code-switching.", action: "Start chatting" },
      { number: 4, title: "Get Personalized Support", description: "Buddy remembers your history, assessment scores, therapy goals. It gives contextual suggestions — not generic advice. \"Last week you mentioned sleep trouble — how was this week?\"", action: "Receive insights" },
      { number: 5, title: "Crisis Detection", description: "If Buddy detects distress keywords, it gently offers: \"Want me to connect you to someone right now?\" One tap → crisis helpline or on-call therapist. Never ignores warning signs.", action: "Safety net active" },
      { number: 6, title: "Upgrade for More", description: "Free: 3 conversations/day. Hour Packs: ₹399/1hr · ₹999/3hr (most bought) · ₹1,699/5hr. Premium subscribers: unlimited. Your therapist can \"prescribe\" Buddy sessions between appointments.", action: "Choose your pack" }
    ] }
    ],
    tipTitle: "💡 Why AnytimeBuddy Works",
    tipText: "<strong>80% of mental health support happens between sessions.</strong> Buddy fills that gap. It's not a replacement for therapy — it's the bridge that keeps progress moving between appointments. Powered by Claude API with clinical guardrails.",
    next: { id: "pet", label: "See Digital Pet Journey →" },
  },
  meera: {
    heading: "👩‍⚕️ Dr. Meera: AI-Guided Mental Health Chat",
    description: "Not ready for a therapist yet? Talk to Dr. Meera — an AI doctor who listens, asks the right questions, and helps you understand what you're feeling. Safe. Confidential. No judgment.",
    stats: [
    { icon: "💰", text: "<strong>2 min free</strong>/day" },
    { icon: "🧠", text: "Trained on <strong>clinical protocols</strong>" },
    { icon: "🔒", text: "100% confidential" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Open Dr. Meera", description: "Find Dr. Meera in the left sidebar or search. She greets you warmly: \"Hi, I'm Dr. Meera. What's on your mind today?\" Text or voice — your choice.", action: "Start conversation" },
      { number: 2, title: "Describe What You're Feeling", description: "Talk freely. Dr. Meera uses CBT-informed questions to help you identify patterns: \"When did you first notice this feeling?\" \"What was happening around that time?\"", action: "Share your concerns" },
      { number: 3, title: "Get Gentle Assessment", description: "Based on your responses, Dr. Meera may suggest: \"Would you like to take a quick PHQ-9 screening? It takes 2 minutes and helps us understand better.\" No pressure.", action: "Optional screening" },
      { number: 4, title: "Receive Guidance", description: "Dr. Meera offers personalized suggestions: breathing exercises, journaling prompts, sound therapy tracks, or recommends seeing a specific type of provider (psychologist vs psychiatrist).", action: "Get recommendations" },
      { number: 5, title: "Warm Handoff to Human", description: "If appropriate, Dr. Meera offers: \"I think you'd benefit from talking to a psychologist. Want me to show you matched therapists?\" Seamless transition — your conversation summary transfers (with consent).", action: "Connect to therapist" }
    ] }
    ],
    tipTitle: "💡 Dr. Meera vs AnytimeBuddy",
    tipText: "<strong>Dr. Meera</strong> is for clinical guidance — symptoms, screening, provider recommendations. <strong>AnytimeBuddy</strong> is for emotional support — mood check-ins, between-session help, motivation. Both work together: Meera diagnoses, Buddy supports.",
    next: { id: "buddy", label: "See AnytimeBuddy Journey →" },
  },
  pet: {
    heading: "🐾 Digital Pet Companions: Your Neurotransmitter Friends",
    description: "Science says your brain releases serotonin from connection — even digital ones. Each pet maps to a neurotransmitter and teaches a different coping skill through play.",
    stats: [
    { icon: "💰", text: "<strong>First pet FREE</strong> · Premium: all 4" },
    { icon: "🧠", text: "4 neurotransmitters" },
    { icon: "🎮", text: "Gamified healing" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Meet the Companions", description: "🦊 <strong>Chintu the Fox</strong> (Dopamine) — Focus, drive, rewards. Catchphrase: \"Ek Aur!\"<br>🐻 <strong>Bholu the Bear</strong> (Endorphin) — Comfort, pain relief, hugs. \"Koi Baat Nahi!\"<br>🐘 <strong>Mithi the Elephant</strong> (Oxytocin) — Trust, bonding, empathy. \"Saath Mein!\"<br>🐢 <strong>Dheeraj the Turtle</strong> (Serotonin) — Calm, balance, contentment. \"Sab Theek Hai!\"", action: "Browse companions" },
      { number: 2, title: "Adopt Your First Pet (FREE)", description: "Pick any one companion to start. Chintu (Fox) is the default free companion. Your pet appears on your dashboard, responds to taps, and tracks your wellness streaks.", action: "Adopt free pet" },
      { number: 3, title: "Interact Daily", description: "Each pet has 8 unique actions: Chintu → High-5, Coin Chase, Challenge, Trick, Ek Aur!, Streak, Celebrate, Plot. Actions boost pet stats (Focus, Drive, Energy, Wins) and YOUR wellness score.", action: "Play with your pet" },
      { number: 4, title: "Level Up Together", description: "Your pet grows as you engage. Level 1→10 progression. Each level unlocks new animations, environments, and deeper interactions. XP earned from therapy sessions, mood check-ins, and daily engagement.", action: "Watch your pet grow" },
      { number: 5, title: "Therapist Prescriptions", description: "Your therapist can \"prescribe\" specific pet interactions: \"Spend 5 minutes with Dheeraj (breathing exercises) before bed.\" Rx-recommended activities appear with a special badge.", action: "Follow Rx recommendations" },
      { number: 6, title: "Unlock All 4 (Premium)", description: "Premium subscribers (₹299/M) get all 4 companions. Each targets different needs: anxiety (Dheeraj), motivation (Chintu), loneliness (Mithi), pain/grief (Bholu). Switch between them based on your mood.", action: "Unlock full collection" }
    ] }
    ],
    tipTitle: "🧠 The Science Behind Digital Pets",
    tipText: "<strong>Research shows digital companion interaction increases oxytocin by 11% and reduces cortisol by 7%.</strong> Each pet's behavior is designed around its neurotransmitter: Chintu's coin chase triggers dopamine reward loops. Bholu's bear hug simulates endorphin release. Mithi's trust circles build oxytocin pathways. Dheeraj's breathing exercises regulate serotonin.",
    next: { id: "sound", label: "See Sound Therapy Journey →" },
  },
  sound: {
    heading: "🎵 Sound Therapy: Heal Through Listening",
    description: "200+ curated tracks across Indian classical ragas, nature sounds, binaural beats, and guided meditations. Science-backed soundscapes for sleep, calm, focus, and healing.",
    stats: [
    { icon: "💰", text: "<strong>20 tracks FREE</strong> · ₹30/track · ₹250/bundle" },
    { icon: "🎧", text: "<strong>200+</strong> tracks" },
    { icon: "⏱️", text: "5–60 min sessions" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Browse Categories", description: "🌙 Sleep (rain, white noise, lullabies) · 🧘 Calm (ocean waves, forest, Tibetan bowls) · ⚡ Focus (binaural beats, lo-fi, alpha waves) · 🕉️ Raga Healing (Indian classical therapy ragas) · 🌿 Nature (birds, streams, wind)", action: "Choose category" },
      { number: 2, title: "Free Tier: 20 Tracks", description: "3 tracks per category, always free. No login required. Stream instantly. Perfect for trying out before buying. Includes: Rain on Leaves, Ocean at Dawn, Raga Yaman (evening calm).", action: "Play free tracks" },
      { number: 3, title: "Buy À la Carte", description: "Love a track? Buy it forever: ₹30/track. Own it, download it, play unlimited. No subscription needed. Or grab a 10-track bundle for ₹250 (17% off — ₹25/track).", action: "Purchase tracks" },
      { number: 4, title: "Premium: Unlimited Access", description: "Premium subscribers (₹299/M) get unlimited streaming + downloads of all 200+ tracks. New tracks added monthly. Curated playlists: \"Pre-Session Calm,\" \"Post-Therapy Integration,\" \"Sleep Protocol.\"", action: "Explore premium library" },
      { number: 5, title: "Therapist-Prescribed Soundscapes", description: "Your therapist can prescribe specific tracks: \"Listen to Raga Bhairavi (morning calm) for 15 min before our next session.\" Rx tracks unlock free even on free tier. Appears with a 💊 badge.", action: "Follow sound prescription" },
      { number: 6, title: "Track Your Sound Journey", description: "Analytics show: minutes listened, favorite categories, sleep quality correlation, mood before/after listening. Share insights with your therapist for personalized sound protocols.", action: "View listening analytics" }
    ] }
    ],
    tipTitle: "🕉️ Indian Roots",
    tipText: "<strong>Raga Therapy is a 3,000-year-old Indian practice.</strong> Specific ragas map to specific moods: Raga Yaman for evening peace, Raga Bhairavi for morning devotion, Raga Darbari for deep contemplation. MANAS360 brings this ancient wisdom into a digital format, validated by modern neuroscience research on sound frequency and brainwave entrainment.",
    next: { id: "screening", label: "See Free Screening Journey →" },
  },
  screening: {
    heading: "📋 Free Mental Health Screening: Know Where You Stand",
    description: "Take a clinically validated assessment in 2–3 minutes. Available in 5 languages. No signup, no card, no email. Instant results with severity interpretation.",
    stats: [
    { icon: "💰", text: "<strong>Always FREE</strong>" },
    { icon: "⏱️", text: "<strong>2–3 minutes</strong>" },
    { icon: "🌐", text: "Hindi · English · Tamil · Telugu · Kannada" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Choose Your Assessment", description: "<strong>PHQ-9</strong> (Depression screening — 9 questions, 2 min) or <strong>GAD-7</strong> (Anxiety screening — 7 questions, 90 sec). Both are WHO-validated, gold-standard clinical tools used globally.", action: "Select assessment" },
      { number: 2, title: "Pick Your Language", description: "All assessments available in Hindi, English, Tamil, Telugu, and Kannada. Bhashini API powers real-time translation. Questions culturally adapted for Indian context.", action: "Choose language" },
      { number: 3, title: "Choose Your Channel", description: "📱 In-App (emoji mood picker + full questionnaire) · 📞 IVR Call (toll-free, talk to AI in your language) · 💬 WhatsApp (chat-based, reply at your pace, get PDF report)", action: "Pick channel" },
      { number: 4, title: "Answer Honestly", description: "Rate each question from \"Not at all\" to \"Nearly every day.\" There are no right or wrong answers. Your responses are 100% confidential — not stored unless you create an account.", action: "Complete screening" },
      { number: 5, title: "Get Instant Results", description: "Score with severity band: 0–4 Minimal (green) · 5–9 Mild (yellow) · 10–14 Moderate (orange) · 15+ Severe (red). Plain-language explanation: \"Your score suggests moderate anxiety. Here's what that means...\"", action: "View results" },
      { number: 6, title: "See Your Options", description: "Based on score: Minimal → self-help tools (free). Mild → group therapy (₹149/session). Moderate → psychologist (₹699/session). Severe → psychiatrist referral (₹999/session). All optional — no pressure.", action: "Explore recommendations" }
    ] }
    ],
    tipTitle: "🔒 Privacy Promise",
    tipText: "<strong>Your screening data is never sold, never shared, never stored without your explicit consent.</strong> If you don't create an account, results exist only on your screen. If you do create an account, results feed into your progress dashboard and help your therapist understand your starting point.",
    next: { id: "patient", label: "See Full Patient Journey →" },
  },
  sixer: {
    heading: "🏏 Hit a Sixer: Refer & Earn Together",
    description: "Cricket-themed referral rewards. Share mental wellness with someone you care about — and both of you save 10% on your next therapy session.",
    stats: [
    { icon: "💰", text: "<strong>₹70 credit</strong> each" },
    { icon: "🏏", text: "10% off for <strong>both</strong>" },
    { icon: "⏱️", text: "30 seconds to share" }
    ],
    blocks: [
    { kind: 'steps' as const, steps: [
      { number: 1, title: "Get Your Sixer Code", description: "Every MANAS360 user gets a unique referral code: SIXER-XXXX. Find it on your dashboard, in the green cricket-themed bar at the top of the homepage, or ask AnytimeBuddy.", action: "Copy your code" },
      { number: 2, title: "Share With Someone", description: "WhatsApp share, SMS, QR code, or just tell them. Message: \"Hey, I've been using MANAS360 for my mental wellness. Use my code SIXER-XXXX and we both get ₹70 off our next session.\"", action: "Share code" },
      { number: 3, title: "Friend Signs Up", description: "Your friend enters your code during signup or first booking. They get 10% off their first session instantly. No minimum purchase. Works on any session type — individual, group, couples.", action: "Friend registers" },
      { number: 4, title: "Both Get Rewarded", description: "When your friend completes their first session: ₹70 credit added to YOUR account + ₹70 credit to THEIR account. Both can use on next booking. Credits never expire (as long as account is active).", action: "Credits applied" },
      { number: 5, title: "Stack Your Sixers", description: "No limit on referrals. Refer 5 friends = ₹350 credit. Refer 10 = ₹700. Top referrers get featured on the \"Sixer Leaderboard\" and earn bonus rewards: free group session, Digital Pet unlock, sound bundles.", action: "Keep referring" }
    ] }
    ],
    tipTitle: "🏏 Why \"Hit a Sixer\"?",
    tipText: "<strong>In cricket, a sixer changes the game in one shot.</strong> One conversation about mental health can change someone's life. This isn't just a discount — it's permission to talk about therapy with someone you love. The cricket metaphor makes it culturally comfortable: \"I'm not asking you to see a therapist — I'm just sharing my Sixer code.\" Ariely's loss aversion: the ₹70 credit has a countdown timer. Share before it expires.",
    next: { id: "discover", label: "See Free Explorer Journey →" },
  },
  clinic: {
    heading: "🏥 MyDigitalClinic — Not available in v1.0",
    description: "MyDigitalClinic has been scoped out of the v1.0 platform. This feature is deferred to a future release. Please explore the Provider Network journey instead.",
    stats: [
    
    ],
    blocks: [

    ],
    tipTitle: "",
    tipText: "",
    next: { id: "provider", label: "See Provider Journey →" },
  }
};

export function getJourney(id: JourneyId): JourneyContent | null {
  if (id === 'home') return null;
  return journeyData[id] ?? null;
}
