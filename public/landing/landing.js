
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DATA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const LANES = [
  {
    id:"seeking_help",label:"I Need a Helping Hand",icon:"ðŸ’š",color:"#38A169",tagline:"Start your healing journey",
    items:[
      {label:"Free Screening",desc:"2-min PHQ-9 mood assessment",icon:"ðŸ©º",badge:"Free"},
      {label:"Find a Therapist",desc:"Psychologists & counselors",icon:"ðŸ§ "},
      {label:"See a Psychiatrist",desc:"Medication & diagnosis",icon:"âš•ï¸"},
      {label:"Specialized Care",desc:"OCD, PTSD, addiction, child",icon:"ðŸŽ¯"},
      {label:"Group Sessions",desc:"Peer support from â‚¹99",icon:"ðŸ‘¥",badge:"â‚¹99"},
      {label:"Crisis Support",desc:"Immediate 24/7 help",icon:"ðŸ†˜",crisis:true},
    ]
  },
  {
    id:"ai_power",label:"AI Power Hub",icon:"ðŸ¤–",color:"#7C3AED",tagline:"AI-driven tools â€” 24/7, no appointment needed",
    items:[
      {label:"Anytime Buddy AI",desc:"Guidance from your AI companion",icon:"ðŸ§ ",badge:"AI"},
      {label:"AnytimeBuddy Chat",desc:"24/7 text companion",icon:"ðŸ«‚",badge:"24/7"},
      {label:"Vent Buddy",desc:"Safe space to express feelings",icon:"ðŸ’­",badge:"Soon"},
      {label:"AI Session Notes",desc:"Claude-powered clinical summaries",icon:"ðŸ“",badge:"Pro"},
    ]
  },
  {
    id:"digital_pet",label:"Digital Pets4Happy Hormones",icon:"ðŸ¾",color:"#D97706",tagline:"4 pets, 4 hormones â€” nurture them, nurture you",
    items:[
      {label:"Baby Dinosaur ðŸ¦•",desc:"Oxytocin â€” nurture, bond, feel loved",icon:"ðŸ¦•",badge:"Love"},
      {label:"Golden Retriever ðŸ•",desc:"Serotonin â€” daily routines, calm, stability",icon:"ðŸ•",badge:"Happy"},
      {label:"Healing Elephant ðŸ˜",desc:"Dopamine â€” achievements, games, milestones",icon:"ðŸ˜",badge:"Reward"},
      {label:"Chintu Fox ðŸ¦Š",desc:"Endorphins â€” breathwork, play, laughter",icon:"ðŸ¦Š",badge:"Energy"},
      {label:"Name Your Pet â€” Adopt",desc:"Choose, name, and start your journey",icon:"ðŸ’",badge:"Free"},
    ]
  },
  {
    id:"premium_therapy",label:"Premium Therapy Hub",icon:"â­",color:"#0C7C8A",tagline:"Clinically supervised, evidence-based sessions",
    items:[
      {label:"1-on-1 Therapy",desc:"Psychologist sessions from â‚¹699",icon:"ðŸ§ ",badge:"â‚¹699"},
      {label:"Psychiatry Consult",desc:"Medication review from â‚¹999",icon:"âš•ï¸",badge:"â‚¹999"},
      {label:"Couples Therapy",desc:"Rebuild your relationship",icon:"ðŸ’‘",badge:"â‚¹1,499"},
      {label:"Group Therapy",desc:"Peer circles from â‚¹149",icon:"ðŸ‘¥",badge:"â‚¹149"},
      {label:"Sound Therapy",desc:"Raga healing + sleep tracks",icon:"ðŸŽµ",badge:"20 Free"},
      {label:"Executive Coaching",desc:"High-performance wellness",icon:"ðŸ’¼",badge:"Pro"},
    ]
  },
  {
    id:"self_help",label:"Self-Help Tools",icon:"ðŸ§˜",color:"#7F8000",tagline:"Free tools you can use right now â€” no login needed",
    items:[
      {label:"Mood Tracker",desc:"Track emotional trends daily",icon:"ðŸ“Š",badge:"Free"},
      {label:"Sound Therapy",desc:"Calm sound-based relaxation",icon:"ðŸŽµ",badge:"Free"},
      {label:"Breathing Exercises",desc:"4-7-8 Â· Box Â· Calm Breath Â· Guided sessions",icon:"ðŸŒ¬ï¸",badge:"Free"},
      {label:"Journaling Prompts",desc:"Daily reflection questions",icon:"ðŸ““"},
      {label:"Sleep Guide",desc:"Hygiene checklist + wind-down",icon:"ðŸŒ™"},
      {label:"CBT Worksheets",desc:"Thought records & behavioral experiments",icon:"ðŸ“",badge:"Free"},
    ]
  },
  {
    id:"relationships",label:"Find a Spark Again",icon:"â¤ï¸",color:"#E53E6B",tagline:"Couples, parents & families",
    items:[
      {label:"Find a Spark â€” Couples",desc:"Reignite your connection",icon:"ðŸ’‘"},
      {label:"Concerned Parent",desc:"Help for your child",icon:"ðŸ‘¨â€ðŸ‘§"},
      {label:"Family Plan",desc:"Care for 2-5 members",icon:"ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦",badge:"â‚¹499+"},
      {label:"Teen & Student",desc:"Age-appropriate support",icon:"ðŸŽ“",badge:"50% off"},
    ]
  },
  {
    id:"professional",label:"For Corporates / Edu / Healthcare",icon:"ðŸ¢",color:"#002365",tagline:"Corporate, education institutions & healthcare units",
    items:[
      {label:"Corporate Wellness",desc:"Employee mental health programs",icon:"ðŸ¢"},
      {label:"Education Institutions",desc:"School & college wellness programs",icon:"ðŸ«"},
      {label:"Healthcare Units",desc:"Hospital & clinic integration",icon:"ðŸ¥"},
      {label:"Government Agency",desc:"Tele-MANAS & ASHA worker programs",icon:"ðŸ›ï¸"},
    ]
  },
  {
    id:"grow",label:"Certify2EarnMore",icon:"ðŸŒ±",color:"#2E7D32",tagline:"Certifications, training & shop",
    items:[
      {label:"Certification Hub",desc:"CBT, NLP, 5Whys training",icon:"ðŸ†",badge:"Pro"},
      {label:"Join as Therapist",desc:"Earn â‚¹50K-2L/month",icon:"ðŸ‘¨â€âš•ï¸"},
      {label:"Wellness Retreats",desc:"Rishikesh, Coorg, Goa",icon:"ðŸ”ï¸"},
      {label:"Wellness Shop",desc:"Journals, tools, merch",icon:"ðŸ›ï¸"},
    ]
  },
  {
    id:"mydigitalclinic",label:"MyDigitalClinic",icon:"ðŸ¥",color:"#002365",tagline:"Digitize your practice â€” your patients, your data",
    items:[
      {label:"Patient Database",desc:"DPDPA-compliant vault",icon:"ðŸ‘¤"},
      {label:"Session Notes",desc:"SOAP, CBT, Trauma templates",icon:"ðŸ“"},
      {label:"Scheduling",desc:"Booking + auto-reminders",icon:"ðŸ“…"},
      {label:"Prescriptions",desc:"Digital sign + PDF + delivery",icon:"ðŸ’Š"},
      {label:"Progress Tracking",desc:"PHQ-9/GAD-7 trends",icon:"ðŸ“Š"},
      {label:"21-Day Free Trial",desc:"All modules unlocked",icon:"âœ¨",badge:"Free"},
    ]
  },
];

const SUGGESTIONS = [
  "I feel anxious","couples therapy","psychiatrist near me","CBT certification",
  "corporate wellness","student discount","can't sleep","grief counseling",
  "child psychologist","insurance coverage","group session","Hindi therapist",
];

const RECRUIT_ITEMS = [
  {icon:"ðŸ©º",text:'<span>Free Screening</span> â€” 2-min PHQ-9 assessment, no signup, instant results'},
  {icon:"ðŸ§ ",text:'<span>Find Your Therapist</span> â€” 500+ verified psychologists & counselors across India'},
  {icon:"ðŸ«‚",text:'<span>AnytimeBUDDY</span> â€” 3 free AI conversations every day, <em>24/7</em>'},
  {icon:"ðŸŽµ",text:'<span>Sound Therapy</span> â€” 200+ free tracks: sleep, calm, focus, Raga healing'},
  {icon:"ðŸ’‘",text:'<span>Couples Therapy</span> â€” First session <strong>â‚¹499/couple</strong> (normally â‚¹999)'},
  {icon:"ðŸ¾",text:'<span>Digital Pets</span> â€” Adopt Chintu the Fox <em>free forever</em> â€” happy hormones daily'},
  {icon:"ðŸŽ",text:'<span>21 Days FREE</span> â€” Full Premium access, register payment method & start today'},
  {icon:"ðŸ’°",text:'First therapy session <span>â‚¹399</span> (was â‚¹699) â€” <strong>43% off</strong> for new patients'},
  {icon:"ðŸ‘¥",text:'<span>Group Therapy</span> â€” Live peer circles from <strong>â‚¹149/session</strong>'},
  {icon:"ðŸ‡®ðŸ‡³",text:'<span>NRI?</span> â€” Therapy in your mother tongue from anywhere, <strong>$29/session</strong>'},
];

const NOW = new Date();
const GT_SESSIONS = [
  {
    theme: "Anxiety Circle", emoji: "ðŸ˜°", host: "Dr. Priya", lang: "English",
    spots: { total: 12, taken: 11 },
    startsAt: new Date(NOW.getTime() - 5 * 60000), duration: 60,
  },
  {
    theme: "Grief & Loss", emoji: "ðŸ•Šï¸", host: "Dr. Rajan", lang: "Hindi",
    spots: { total: 10, taken: 8 },
    startsAt: new Date(NOW.getTime() + 12 * 60000), duration: 45,
  },
  {
    theme: "Mindful Parenting", emoji: "ðŸ‘¨â€ðŸ‘§", host: "Ms. Kavitha", lang: "Tamil",
    spots: { total: 15, taken: 6 },
    startsAt: new Date(NOW.getTime() + 95 * 60000), duration: 60,
  },
  {
    theme: "Couples Connect", emoji: "ðŸ’‘", host: "Dr. Sindhuja", lang: "English",
    spots: { total: 8, taken: 2 },
    startsAt: new Date(NOW.getTime() + 240 * 60000), duration: 60,
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INTENT LANES + MEGA MENUS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const intentRow = document.getElementById('intentRow');
LANES.forEach(lane => {
  const el = document.createElement('div');
  el.className = 'intent-lane';
  el.style.setProperty('--lane-color', lane.color);
  el.dataset.lane = lane.id;
  el.innerHTML = `<span class="il-icon">${lane.icon}</span><span class="il-label">${lane.label}</span>`;
  el.addEventListener('mouseenter', () => openMega(lane.id));
  intentRow.appendChild(el);

  const mega = document.createElement('div');
  mega.className = 'mega-menu';
  mega.id = 'mega-' + lane.id;
  mega.style.setProperty('--lane-color', lane.color);
  mega.innerHTML = `
    <div class="mega-header">
      <span class="mh-icon">${lane.icon}</span>
      <div><div class="mh-label">${lane.label}</div><div class="mh-tagline">${lane.tagline}</div></div>
    </div>
    <div class="mega-grid">
      ${lane.items.map(item => `
        <div class="mega-item" onclick="openFeaturePanel('${item.label.replace(/'/g,"\\'")}', '${lane.color}')">
          <span class="mi-icon">${item.icon}</span>
          <div>
            <div style="display:flex;align-items:center;">
              <span class="mi-label ${item.crisis?'crisis':''}">${item.label}</span>
              ${item.badge?`<span class="mi-badge">${item.badge}</span>`:''}
            </div>
            <div class="mi-desc">${item.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  mega.addEventListener('mouseleave', closeMega);
  document.getElementById('megaContainer').appendChild(mega);
});

intentRow.insertAdjacentHTML('beforeend', `
  <div class="quick-pills">
    <div class="quick-pill" title="24/7 Chat"><span class="qp-icon">ðŸ«‚</span> Buddy</div>
  </div>
`);

let currentMega = null;
function openMega(id) {
  closeFeaturePanel();
  closeMega();
  const m = document.getElementById('mega-' + id);
  if (m) { m.classList.add('open'); document.getElementById('megaOverlay').classList.add('open'); currentMega = id; }
  document.querySelectorAll('.intent-lane').forEach(el => el.classList.toggle('active', el.dataset.lane === id));
}
function closeMega() {
  document.querySelectorAll('.mega-menu').forEach(m => m.classList.remove('open'));
  document.getElementById('megaOverlay').classList.remove('open');
  document.querySelectorAll('.intent-lane').forEach(el => el.classList.remove('active'));
  currentMega = null;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FEATURE PANEL (inline expandable)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const FEATURE_DETAILS = {
  // â”€â”€ I Need Support â”€â”€
  "Free Screening": { eyebrow:"Free Screening", title:"Free Screening", desc:"A clinically validated 2-minute mood assessment based on PHQ-9 and GAD-7. No signup needed â€” just answer, get your severity score, and see matched therapists instantly.", icon:"ðŸ©º", color:"#38A169", status:"live", highlights:["PHQ-9 + GAD-7 validated scales","Available in 5 languages","Instant severity result + therapist matching","No app download required"], bullets:["2-minute completion","Severity: Minimal â†’ Severe","Top 3 therapist matches","Crisis detection if Q9 â‰¥ 1"], cta:"Take Free Screening", cta2:"Learn More" },
  "Find a Therapist": { eyebrow:"Therapy", title:"Find a Therapist", desc:"AI-powered matching across 500+ verified psychologists and counselors. Filter by language, specialization, location, availability, and session type.", icon:"ðŸ§ ", color:"#38A169", status:"live", highlights:["100-point matching algorithm","Filter by 15+ specializations","Hindi, English, Tamil, Telugu, Kannada","Video, audio, or in-person options"], bullets:["Government-verified credentials","Session rates from â‚¹699","Same-day availability","21-day free trial"], cta:"Find My Match", cta2:"Browse All" },
  "See a Psychiatrist": { eyebrow:"Psychiatry", title:"See a Psychiatrist", desc:"Consult NMC-verified psychiatrists for medication evaluation, diagnosis, and treatment planning. Digital prescriptions delivered to your pharmacy.", icon:"âš•ï¸", color:"#38A169", status:"live", highlights:["NMC-verified psychiatrists only","Digital prescription with SHA-256 signing","Medication management + follow-ups","Insurance-compatible documentation"], bullets:["Consultations from â‚¹999","Digital Rx to your pharmacy","Follow-up tracking","DPDPA-compliant records"], cta:"Book Psychiatrist", cta2:"How It Works" },
  "Specialized Care": { eyebrow:"Specializations", title:"Specialized Care", desc:"Expert therapists for specific conditions â€” OCD, PTSD, addiction, eating disorders, child psychology, ADHD, grief, perinatal mental health, and more.", icon:"ðŸŽ¯", color:"#38A169", status:"live", highlights:["15+ clinical specializations","Trauma-informed care specialists","Child & adolescent experts","Addiction recovery programs"], bullets:["OCD & anxiety disorders","PTSD & trauma","Addiction & substance use","Child & teen psychology","ADHD & neurodiversity","Grief & loss"], cta:"Find Specialist", cta2:"See All Specializations" },
  "Group Sessions": { eyebrow:"Peer Support", title:"Group Sessions", desc:"Therapist-led group circles for shared healing. Join anxiety circles, grief groups, couples workshops, or mindful parenting sessions with peers who understand.", icon:"ðŸ‘¥", color:"#38A169", status:"live", highlights:["6-15 participants per group","Led by licensed therapists","Weekly recurring sessions","Anonymous participation option"], bullets:["Anxiety Circle â€” â‚¹99","Grief & Loss â€” â‚¹149","Couples Connect â€” â‚¹199","Mindful Parenting â€” â‚¹149"], cta:"Join a Session", cta2:"View Schedule" },
  "Crisis Support": { eyebrow:"24/7 Emergency", title:"Crisis Support", desc:"Immediate help when you need it most. One-tap access to KIRAN helpline, crisis counselors, and safety resources. No login required.", icon:"ðŸ†˜", color:"#c62828", status:"live", highlights:["KIRAN: 1800-599-0019 (24/7, free)","Tele MANAS: 14416","NIMHANS: 080-4611-0007","Emergency: 112"], bullets:["Instant crisis resources","24/7 availability","13 languages supported","No signup needed"], cta:"Get Help Now", cta2:"Crisis Protocol" },

  // â”€â”€ AI Power Hub â”€â”€
  "Anytime Buddy AI": { eyebrow:"AI Companion", title:"Anytime Buddy AI", desc:"Your AI-powered mental wellness companion built on Claude API. Get personalized guidance, coping techniques, mindfulness exercises, and emotional support â€” any time of day.", icon:"ðŸ§ ", color:"#7C3AED", status:"live", highlights:["Powered by Claude API (Anthropic)","Understands context across sessions","CBT-based coping suggestions","5 languages: Hindi, English, Tamil, Telugu, Kannada"], bullets:["24/7 availability","No appointment needed","Remembers your journey","Escalates to human therapist when needed"], cta:"Chat with Buddy", cta2:"How Buddy Works" },
  "Vent Buddy": { eyebrow:"Safe Expression", title:"Vent Buddy", desc:"A judgement-free space to express anything you're feeling. Write, speak, or type â€” Vent Buddy listens, validates, and never judges. Everything is encrypted and private.", icon:"ðŸ’­", color:"#7C3AED", status:"live", highlights:["Zero judgement, zero advice (unless asked)","Text, voice, or emoji expression","End-to-end encrypted","DPDPA compliant â€” auto-purge available"], bullets:["Type or voice-record your feelings","AI validates your emotions","Mood pattern detection over time","Option to share with therapist"], cta:"Start Venting", cta2:"Privacy Details" },
  "AnytimeBuddy Chat": { eyebrow:"24/7 Chat", title:"AnytimeBuddy Chat", desc:"Text-based companion available around the clock. Talk about your day, process difficult emotions, practice coping skills, or just have someone to chat with at 2 AM.", icon:"ðŸ«‚", color:"#7C3AED", status:"live", highlights:["Always available â€” no scheduling","Natural conversation, not chatbot scripts","Detects distress and escalates to human","Integrates with your therapy journey"], bullets:["Unlimited messages","Mood check-in prompts","Coping technique suggestions","Seamless therapist handoff"], cta:"Open Chat", cta2:"Try a Sample" },
  "AI Session Notes": { eyebrow:"For Providers", title:"AI Session Notes", desc:"Claude API generates clinical session notes in SOAP, CBT, Psychodynamic, or Trauma-Informed format. Therapist reviews, edits, and finalizes â€” reducing documentation time by 80%.", icon:"ðŸ“", color:"#7C3AED", status:"live", highlights:["5 note templates: SOAP, CBT, Psychodynamic, Trauma, Free Form","Claude API with clinical prompting","Therapist review required before finalization","DPDPA-compliant encryption at rest"], bullets:["Draft in 30 seconds","Anonymized patient references","Encrypted storage (AES-256)","Export to PDF"], cta:"For Providers â†’", cta2:"See Sample Note" },

  // â”€â”€ Digital Pet Hub â”€â”€
  "Chintu ðŸ¦Š": { eyebrow:"Digital Companion", title:"Chintu the Curious Fox ðŸ¦Š", desc:"Chintu builds your daily wellness habits through playful nudges. Feed Chintu by completing mood check-ins, stretches, and gratitude entries. Watch Chintu grow as you grow.", icon:"ðŸ¦Š", color:"#D97706", status:"coming", highlights:["Daily habit tracking through play","Chintu's mood mirrors yours","Streak rewards and evolution stages","Gentle reminders, never pushy"], bullets:["Morning mood check-in","3 daily micro-habits","Weekly progress garden","Shareable pet card"], cta:"Coming Soon", cta2:"Get Notified" },
  "Bholu ðŸ»": { eyebrow:"Digital Companion", title:"Bholu the Gentle Bear ðŸ»", desc:"Bholu is your mindfulness buddy. Practice breathing exercises, body scans, and grounding techniques together. Bholu calms down as you calm down.", icon:"ðŸ»", color:"#D97706", status:"coming", highlights:["Guided breathing with Bholu","Body scan animations","Grounding 5-4-3-2-1 exercises","Anxiety-soothing interactions"], bullets:["4-7-8 breathing partner","Progressive muscle relaxation","Visual calm-down animations","Sleep wind-down routine"], cta:"Coming Soon", cta2:"Get Notified" },
  "Mithi ðŸ˜": { eyebrow:"Digital Companion", title:"Mithi the Wise Elephant ðŸ˜", desc:"Mithi helps you build memory and gratitude habits. Daily journaling prompts, gratitude entries, and memory exercises â€” Mithi remembers everything you share.", icon:"ðŸ˜", color:"#D97706", status:"coming", highlights:["Gratitude journaling partner","Memory garden â€” grows with entries","Weekly reflection summaries","Emotional pattern insights"], bullets:["Daily gratitude prompt","Photo memory journal","Weekly mood summary","Shareable progress card"], cta:"Coming Soon", cta2:"Get Notified" },
  "Dheeraj ðŸ¢": { eyebrow:"Digital Companion", title:"Dheeraj the Patient Turtle ðŸ¢", desc:"Dheeraj teaches patience and anxiety management through slow, deliberate interactions. Ideal for people who need to slow down and breathe.", icon:"ðŸ¢", color:"#D97706", status:"coming", highlights:["Slow-paced calming interactions","Anxiety countdown techniques","Patience-building mini-games","No rush, no pressure"], bullets:["Anxiety timer (5-4-3-2-1)","Slow breathing pacer","Worry jar exercise","Daily calm streak"], cta:"Coming Soon", cta2:"Get Notified" },
  "Name Your Pet â€” Adopt": { eyebrow:"Start Here", title:"Name Your Pet â€” Adopt", desc:"Choose your first digital companion â€” free forever. Your pet grows with your wellness journey. Start with any one, unlock all four as you progress.", icon:"ðŸ’", color:"#D97706", status:"coming", highlights:["Choose: Chintu ðŸ¦Š Bholu ðŸ» Mithi ðŸ˜ Dheeraj ðŸ¢","Free forever â€” no in-app purchases","Pet evolves with your wellness streak","Personalized to your goals"], bullets:["Personality quiz â†’ best match","Free first pet","Unlock others through streaks","No ads, no paywalls"], cta:"Coming Soon", cta2:"Take Pet Quiz" },

  // â”€â”€ Premium Therapy Hub â”€â”€
  "1-on-1 Therapy": { eyebrow:"Core Service", title:"1-on-1 Therapy Sessions", desc:"Private sessions with government-verified psychologists. Video (Jitsi), audio, or in-person. From â‚¹699 per session with 21-day free trial.", icon:"ðŸ§ ", color:"#0C7C8A", status:"live", highlights:["Video (Jitsi), audio, or in-person","500+ verified psychologists","15+ specializations","21-day free trial for new patients"], bullets:["Sessions from â‚¹699","Same-day booking available","Progress tracking built-in","DPDPA-compliant records"], cta:"Book a Session", cta2:"Browse Therapists" },
  "Psychiatry Consult": { eyebrow:"Medication", title:"Psychiatry Consultation", desc:"NMC-verified psychiatrists for diagnosis, medication management, and treatment planning. Digital prescriptions with pharmacist-verified QR codes.", icon:"âš•ï¸", color:"#0C7C8A", status:"live", highlights:["NMC-verified psychiatrists","Digital Rx with SHA-256 signing","Pharmacy QR code delivery","Follow-up scheduling"], bullets:["Consultations from â‚¹999","Medication review","Diagnosis & treatment plan","Insurance documentation"], cta:"Book Psychiatrist", cta2:"How Prescriptions Work" },
  "Couples Therapy": { eyebrow:"Relationships", title:"Couples Therapy", desc:"Rebuild connection with specialized couples therapists. Joint sessions, individual components, and structured programs for relationship healing.", icon:"ðŸ’‘", color:"#0C7C8A", status:"live", highlights:["Joint + individual session models","Communication skill building","Conflict resolution frameworks","Intimacy rebuilding programs"], bullets:["Sessions from â‚¹1,499","8-week structured programs","Joint progress tracking","Private individual add-ons"], cta:"Start Together", cta2:"Couples Programs" },
  "Group Therapy": { eyebrow:"Peer Circles", title:"Group Therapy", desc:"Therapist-led peer support circles. Shared healing in safe, moderated spaces with 6-15 participants. Anonymous option available.", icon:"ðŸ‘¥", color:"#0C7C8A", status:"live", highlights:["6-15 participants per group","Licensed therapist moderator","Weekly recurring format","Anonymous participation"], bullets:["From â‚¹149/session","Anxiety, grief, parenting, couples","Schedule view + instant join","Chat continues between sessions"], cta:"View Groups", cta2:"This Week's Schedule" },
  "Sound Therapy": { eyebrow:"Wellness Tool", title:"Sound Therapy", desc:"200+ curated audio tracks for sleep, calm, focus, and Raga healing. Clinically-informed soundscapes designed in collaboration with music therapists.", icon:"ðŸŽµ", color:"#0C7C8A", status:"live", highlights:["200+ tracks across 4 categories","Sleep, Calm, Focus, Raga Healing","Background play during sessions","Offline download available"], bullets:["Sleep tracks (rain, ocean, white noise)","Raga Therapy (Yaman, Bhairavi)","Focus beats (lo-fi, binaural)","Guided body scan audio"], cta:"Listen Free", cta2:"Browse Library" },
  "Executive Coaching": { eyebrow:"Performance", title:"Executive Coaching", desc:"High-performance mental wellness for leaders and professionals. Stress management, burnout prevention, decision-making clarity, and leadership resilience.", icon:"ðŸ’¼", color:"#0C7C8A", status:"coming", highlights:["1-on-1 with executive coaches","Leadership resilience programs","Burnout prevention frameworks","Confidential C-suite safe space"], bullets:["8-week intensive programs","Decision-making clarity","Work-life integration","Stress performance mapping"], cta:"Coming Soon", cta2:"Get Notified" },

  // â”€â”€ Self-Help Tools â”€â”€
  "Mood Tracker": { eyebrow:"Daily Tool", title:"Mood Tracker", desc:"Track your emotional trends daily with simple taps. Visual charts show patterns over weeks and months. Share trends with your therapist for better-informed sessions.", icon:"ðŸ“Š", color:"#D4A017", status:"live", highlights:["One-tap daily mood entry","Visual trend charts (week/month/quarter)","Share with therapist","Pattern detection alerts"], bullets:["5-second daily check-in","Emotion wheel selection","Sleep + mood correlation","Exportable PDF reports"], cta:"Start Tracking", cta2:"See Sample Chart" },
  "Breathing Exercises": { eyebrow:"Free Tool", title:"Breathing Exercises", desc:"Guided breathing techniques for anxiety, sleep, and focus. 4-7-8, box breathing, diaphragmatic, and alternate nostril â€” all with visual pacers.", icon:"ðŸŒ¬ï¸", color:"#D4A017", status:"live", highlights:["4-7-8 breathing for sleep","Box breathing for anxiety","Visual pacer animations","No login required"], bullets:["6 breathing techniques","Audio + visual guidance","Timer: 2, 5, 10 minutes","Works offline"], cta:"Breathe Now", cta2:"Which Technique?" },
  "Journaling Prompts": { eyebrow:"Free Tool", title:"Journaling Prompts", desc:"Daily reflection questions to build self-awareness. Gratitude, cognitive reframing, emotional processing, and goal-setting prompts refreshed daily.", icon:"ðŸ““", color:"#D4A017", status:"live", highlights:["New prompt every day","4 categories: Gratitude, Reflection, Goals, Processing","Private â€” never shared unless you choose","Integrates with Mood Tracker"], bullets:["365 unique prompts","Write or voice-record","Weekly summary email","Export your journal"], cta:"Today's Prompt", cta2:"Browse Prompts" },
  "Sleep Guide": { eyebrow:"Free Tool", title:"Sleep Guide", desc:"Evidence-based sleep hygiene checklist, wind-down routines, and sleep tracking. Combine with Sound Therapy tracks for the complete sleep toolkit.", icon:"ðŸŒ™", color:"#D4A017", status:"live", highlights:["Sleep hygiene checklist","Wind-down routine builder","Pairs with Sound Therapy","Sleep pattern insights"], bullets:["10-item hygiene checklist","30-min wind-down routine","Sleep quality log","Blue light reminder"], cta:"Improve Sleep", cta2:"Sleep Checklist" },

  // â”€â”€ For Relationships â”€â”€
  "Find a Spark â€” Couples": { eyebrow:"Couples", title:"Find a Spark â€” Couples Therapy", desc:"Reignite your connection with specialized couples therapists. Communication workshops, conflict resolution, and intimacy rebuilding programs.", icon:"ðŸ’‘", color:"#E53E6B", status:"live", highlights:["Specialized couples therapists","Joint + individual sessions","8-week structured programs","Progress tracking for both partners"], bullets:["Communication skills","Conflict resolution","Intimacy rebuilding","Trust repair"], cta:"Start Together", cta2:"Couples Programs" },
  "Concerned Parent": { eyebrow:"Parenting", title:"Concerned Parent", desc:"Professional help for your child's mental health. Child psychologists, adolescent specialists, and parenting support â€” all in one place.", icon:"ðŸ‘¨â€ðŸ‘§", color:"#E53E6B", status:"live", highlights:["Child & adolescent specialists","Age-appropriate assessments","Parent coaching included","School coordination support"], bullets:["Ages 6-17 supported","Behavioral assessments","ADHD/autism screening","Family therapy options"], cta:"Help My Child", cta2:"Parent Resources" },
  "Family Plan": { eyebrow:"Family", title:"Family Plan", desc:"Mental wellness for the whole family â€” 2 to 5 members. Shared dashboard, individual sessions, and family therapy options. One subscription, everyone benefits.", icon:"ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦", color:"#E53E6B", status:"live", highlights:["2-5 members per plan","Individual + family sessions","Shared progress dashboard","One billing, separate privacy"], bullets:["From â‚¹499/month","Each member gets private space","Family therapist access","Parenting workshops included"], cta:"Get Family Plan", cta2:"Compare Plans" },
  "Teen & Student": { eyebrow:"Youth", title:"Teen & Student Support", desc:"Age-appropriate mental health support for teenagers and college students. Exam stress, peer pressure, identity, relationships â€” with therapists who understand.", icon:"ðŸŽ“", color:"#E53E6B", status:"live", highlights:["Ages 13-24 specialists","Exam stress programs","Peer pressure & identity","50% student discount"], bullets:["Student verification for discount","Campus counselor integration","Anonymous screening","Group support circles"], cta:"Student Signup", cta2:"Campus Programs" },

  // â”€â”€ For Organizations â”€â”€
  "Corporate Wellness": { eyebrow:"Enterprise", title:"Corporate Wellness (EAP)", desc:"Employee mental health at scale. Anonymous screening QR standees, therapist access, usage analytics for HR, and DPDPA-compliant data handling.", icon:"ðŸ¢", color:"#2196F3", status:"live", highlights:["Anonymous QR screening standees","Therapist network access for employees","HR dashboard (anonymous analytics)","DPDPA-compliant â€” no employee PII to employer"], bullets:["Per-employee pricing","Same-day therapist access","Anonymous usage reports","Custom wellness workshops"], cta:"Request Demo", cta2:"EAP Brochure" },
  "Education Partner": { eyebrow:"Schools & Colleges", title:"Education Partner", desc:"Student mental health programs for schools and colleges. Screening drives, on-campus counseling, teacher training, and parent workshops.", icon:"ðŸ«", color:"#2196F3", status:"live", highlights:["Student screening drives","On-campus counselor placement","Teacher sensitization training","Parent awareness workshops"], bullets:["Exam stress programs","Bullying intervention","Career anxiety support","Annual wellness audits"], cta:"Partner With Us", cta2:"School Programs" },
  "Healthcare Partner": { eyebrow:"Hospitals & Clinics", title:"Healthcare Partner", desc:"Integrate MANAS360 into existing hospital and clinic workflows. Referral pathways, MyDigitalClinic for practitioners, and teleconsultation infrastructure.", icon:"ðŸ¥", color:"#2196F3", status:"live", highlights:["Hospital referral integration","MyDigitalClinic for staff psychiatrists","Teleconsultation infrastructure","EHR-compatible data export"], bullets:["API integration","Patient referral tracking","Prescription interop","DPDPA compliance built-in"], cta:"Integrate", cta2:"Technical Docs" },
  "Government Agency": { eyebrow:"Public Health", title:"Government Agency", desc:"Tele-MANAS integration, ASHA worker training, DMHP coordination, and district-level mental health program support.", icon:"ðŸ›ï¸", color:"#2196F3", status:"live", highlights:["Tele-MANAS referral integration","ASHA worker training (5-Why Framework)","DMHP district coordination","Government dashboard reporting"], bullets:["ASHA incentive tracking","Bulk worker onboarding","District-wise analytics","NIMHANS/DIMHANS coordination"], cta:"Connect", cta2:"ASHA Program" },

  // â”€â”€ Learn & Grow â”€â”€
  "Certification Hub": { eyebrow:"Professional", title:"Certification Hub", desc:"Earn accredited certifications in CBT, NLP, 5-Why Empathy Framework, and more. Self-paced learning with quizzes, case studies, and digital certificates.", icon:"ðŸ†", color:"#2E7D32", status:"live", highlights:["CBT Fundamentals certification","NLP Practitioner pathway","5-Why Empathy Framework","Digital certificate with QR verification"], bullets:["Self-paced modules","Video + quiz format","Case study practice","Shareable digital badges"], cta:"Browse Certifications", cta2:"Free Preview" },
  "Join as Therapist": { eyebrow:"For Providers", title:"Join as Therapist", desc:"Earn â‚¹50K-2L/month on your schedule. Government-verified profiles, AI session notes, patient matching, and MyDigitalClinic access â€” all included.", icon:"ðŸ‘¨â€âš•ï¸", color:"#2E7D32", status:"live", highlights:["60/40 revenue split (provider gets 60%)","AI-generated session notes","100-point patient matching","MyDigitalClinic free for 21 days"], bullets:["DigiLocker verification","Zoho Sign contracts","5-module onboarding training","QR business card auto-generated"], cta:"Apply Now", cta2:"Provider FAQ" },
  "Wellness Retreats": { eyebrow:"Experiences", title:"Wellness Retreats", desc:"Curated mental wellness retreats in Rishikesh, Coorg, Goa, and Dharamsala. Yoga, meditation, therapy sessions, and nature immersion.", icon:"ðŸ”ï¸", color:"#2E7D32", status:"coming", highlights:["Curated retreat partnerships","Therapist-accompanied programs","3-day, 5-day, and 7-day options","Rishikesh, Coorg, Goa, Dharamsala"], bullets:["Yoga & meditation","Group therapy sessions","Nature immersion","Digital detox programs"], cta:"Coming Soon", cta2:"Get Notified" },
  "Wellness Shop": { eyebrow:"Merchandise", title:"Wellness Shop", desc:"Journals, guided workbooks, therapy tools, calming products, and MANAS360 merchandise. Curated for mental wellness.", icon:"ðŸ›ï¸", color:"#2E7D32", status:"coming", highlights:["Guided therapy journals","CBT workbooks","Calming sensory products","MANAS360 merch"], bullets:["Gratitude journals","Anxiety toolkit box","Sleep hygiene kit","Gift bundles"], cta:"Coming Soon", cta2:"Preview Collection" },

  // â”€â”€ MyDigitalClinic â”€â”€
  "Patient Database": { eyebrow:"MyDigitalClinic", title:"Patient Database", desc:"Secure, DPDPA-compliant patient records. Encrypted PII, CSV import, search, and configurable auto-purge. Your patients, your data, your rules.", icon:"ðŸ‘¤", color:"#4A6741", status:"live", highlights:["Encrypted PII (AES-256)","CSV bulk import","Configurable auto-purge (24h/48h/72h/never)","DPDPA right-to-access export"], bullets:["Add patients manually or CSV","Search by name, phone, ID","Audit trail on every access","Patient data export (DPDPA)"], cta:"Start Free Trial", cta2:"DPDPA Details" },
  "Session Notes": { eyebrow:"MyDigitalClinic", title:"Session Notes", desc:"5 pre-built clinical note templates: SOAP, CBT, Psychodynamic, Trauma-Informed, and Free Form. AI-generated drafts via Claude API â€” review and finalize.", icon:"ðŸ“", color:"#4A6741", status:"live", highlights:["5 clinical templates pre-loaded","AI draft generation (Claude API)","Therapist review + finalization","Encrypted storage â€” never readable by MANAS360"], bullets:["SOAP notes","CBT session records","Psychodynamic formulation","Trauma-informed documentation","Free form notes"], cta:"Start Free Trial", cta2:"See Templates" },
  "Scheduling": { eyebrow:"MyDigitalClinic", title:"Scheduling & Reminders", desc:"Appointment calendar with automatic reminders at 24h and 1h before session via WhatsApp (Heyo Phone). Patient check-in via QR standee.", icon:"ðŸ“…", color:"#4A6741", status:"live", highlights:["Drag-and-drop calendar","Auto WhatsApp reminders (24h + 1h)","QR check-in standee for reception","No-show tracking"], bullets:["Daily/weekly/monthly views","Buffer time between sessions","Cancellation/reschedule flow","Waitlist management"], cta:"Start Free Trial", cta2:"QR Check-In Demo" },
  "Prescriptions": { eyebrow:"MyDigitalClinic", title:"Digital Prescriptions", desc:"Write, digitally sign (SHA-256), generate PDF, and deliver prescriptions via WhatsApp. Pharmacist QR verification for authenticity.", icon:"ðŸ’Š", color:"#4A6741", status:"live", highlights:["Digital signature (SHA-256 hash)","PDF generation + S3 storage","WhatsApp delivery to patient","Pharmacist QR verification"], bullets:["NMC-compliant format","Drug interaction alerts","Refill tracking","Prescription history"], cta:"Start Free Trial", cta2:"Sample Rx" },
  "Progress Tracking": { eyebrow:"MyDigitalClinic", title:"Progress Tracking", desc:"PHQ-9 and GAD-7 scores tracked over time with visual trend charts. See severity changes session-over-session. Share progress reports with patients.", icon:"ðŸ“Š", color:"#4A6741", status:"live", highlights:["PHQ-9 + GAD-7 visual trends","Session-over-session comparison","Severity band tracking","Exportable patient reports"], bullets:["Auto-scored assessments","Color-coded severity bands","Trend line charts","PDF report generation"], cta:"Start Free Trial", cta2:"Sample Report" },
  "21-Day Free Trial": { eyebrow:"MyDigitalClinic", title:"21-Day Free Trial", desc:"All MyDigitalClinic modules unlocked for 21 days. â‚¹1 authorization required (DPDPA identity verification). No auto-charge â€” you decide after the trial.", icon:"âœ¨", color:"#4A6741", status:"live", highlights:["All 6 modules unlocked","â‚¹1 authorization (no auto-charge)","Full patient database access","AI session notes included"], bullets:["Patient Database","Session Notes + AI","Scheduling + Reminders","Prescriptions","Progress Tracking","DPDPA Compliance"], cta:"Start 21-Day Trial", cta2:"What's Included" },

  // â”€â”€ How It Works â”€â”€
  "Step 1: Screen": { eyebrow:"Your Journey", title:"Step 1: Screen", desc:"Take a free 2-minute PHQ-9 or GAD-7 assessment. No signup, no app download. Get your severity score and understand where you stand.", icon:"1ï¸âƒ£", color:"#718096", status:"live", highlights:["Free â€” no signup needed","2 minutes to complete","Clinically validated (WHO-recognised)","Instant severity result"], bullets:["PHQ-9 for depression","GAD-7 for anxiety","Available in 5 languages","Crisis detection built-in"], cta:"Take Free Screening", cta2:"" },
  "Step 2: Match": { eyebrow:"Your Journey", title:"Step 2: Match", desc:"Our AI matches you with 3 therapists based on your score, language, location, specialization needs, and availability. 100-point scoring algorithm.", icon:"2ï¸âƒ£", color:"#718096", status:"live", highlights:["100-point matching algorithm","Language + location + specialization","Top 3 matches shown","All credentials government-verified"], bullets:["40pts specialization match","20pts language match","15pts location match","10pts experience + 10pts availability + 5pts rating"], cta:"See How Matching Works", cta2:"" },
  "Step 3: Book": { eyebrow:"Your Journey", title:"Step 3: Book", desc:"Choose your therapist, pick a time slot, and pay via PhonePe (UPI). Confirmation sent via email + WhatsApp with session details and Jitsi link.", icon:"3ï¸âƒ£", color:"#718096", status:"live", highlights:["Choose from top 3 matches","Real-time availability calendar","Pay via PhonePe (UPI)","Instant confirmation + Jitsi link"], bullets:["Same-day slots available","â‚¹1 authorization for free trial","PhonePe UPI payment","WhatsApp + email confirmation"], cta:"Book a Session", cta2:"" },
  "Step 4: Session": { eyebrow:"Your Journey", title:"Step 4: Session", desc:"Attend your therapy session via Jitsi video, audio call, or in-person. Your therapist takes notes using AI-assisted templates. Everything encrypted.", icon:"4ï¸âƒ£", color:"#718096", status:"live", highlights:["Jitsi video (self-hosted, private)","Audio or in-person options","AI session notes for therapist","DPDPA-compliant encryption"], bullets:["45-60 minute sessions","QR join link for video","Session recording (consent-based)","Homework assigned post-session"], cta:"How Sessions Work", cta2:"" },
  "Step 5: Track": { eyebrow:"Your Journey", title:"Step 5: Track", desc:"Track your progress over time with PHQ-9/GAD-7 re-assessments, mood tracking, homework completion, and session summaries. Visual charts show your improvement.", icon:"5ï¸âƒ£", color:"#718096", status:"live", highlights:["PHQ-9/GAD-7 trend charts","Mood tracker integration","Homework completion tracking","Session summary timeline"], bullets:["Weekly re-assessments","Visual severity trends","Therapist progress reports","Exportable PDF reports"], cta:"See Sample Progress", cta2:"" },
  "Step 6: Thrive": { eyebrow:"Your Journey", title:"Step 6: Thrive", desc:"From episodic to transformational. Sustained care, relapse prevention, and wellness maintenance. Your journey doesn't end â€” it evolves.", icon:"6ï¸âƒ£", color:"#718096", status:"live", highlights:["Relapse prevention planning","Maintenance session scheduling","Wellness toolkit access","Community support circles"], bullets:["Quarterly check-ins","Sound therapy + meditation","Peer support groups","Lifetime AnytimeBuddy access"], cta:"Start Your Journey", cta2:"" },
};

function openFeaturePanel(label, laneColor) {
  const d = FEATURE_DETAILS[label];
  if (!d) { console.warn('No detail for:', label); return; }

  const panel = document.getElementById('featurePanel');
  panel.style.setProperty('--fp-color', d.color || laneColor);

  document.getElementById('fpEyebrow').textContent = d.eyebrow;
  document.getElementById('fpTitle').textContent = d.title;
  document.getElementById('fpDesc').textContent = d.desc;
  document.getElementById('fpIcon').textContent = d.icon;

  document.getElementById('fpHighlights').innerHTML = d.highlights.map(h =>
    `<div class="fp-hl"><span class="fp-hl-icon">âœ¦</span><span>${h}</span></div>`
  ).join('');

  document.getElementById('fpBullets').innerHTML = d.bullets.map(b =>
    `<li>${b}</li>`
  ).join('');

  const statusMap = { live: ['ðŸŸ¢ Live now', 'live'], coming: ['ðŸŸ¡ Coming soon', 'coming'], beta: ['ðŸ”µ Beta', 'beta'] };
  const [statusText, statusClass] = statusMap[d.status] || statusMap.live;
  document.getElementById('fpStatus').innerHTML = `<div class="fp-status ${statusClass}">${statusText}</div>`;

  const cta2Html = d.cta2 ? `<button class="fp-cta fp-cta-secondary" onclick="alert('${d.cta2} â€” page coming soon')">${d.cta2}</button>` : '';
  document.getElementById('fpCtas').innerHTML = `
    <button class="fp-cta fp-cta-primary" onclick="alert('${d.cta} â€” page coming soon')">${d.cta}</button>
    ${cta2Html}
  `;

  closeMega();
  panel.classList.add('open');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeFeaturePanel() {
  document.getElementById('featurePanel').classList.remove('open');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// THERAPIST RECRUITMENT MARQUEE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildMarquee() {
  const track = document.getElementById('recruitTrack');
  const sep = '<span class="recruit-sep">â—</span>';
  const itemsHtml = RECRUIT_ITEMS.map(r =>
    `<div class="recruit-item"><span class="ri-icon">${r.icon}</span><span class="ri-text">${r.text}</span></div>`
  ).join(sep);
  track.innerHTML = itemsHtml + sep + itemsHtml + sep;
}
// buildMarquee(); // REMOVED in V5 - marquee strips dropped

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// OFFERS & DEALS MARQUEE (Admin-configurable)
// Admin can edit these live via Login â†’ Admin â†’ Edit Offers
// Badge types: free, deal, new, seasonal, limited
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let OFFER_ITEMS = JSON.parse(localStorage.getItem('MANAS360_OFFERS')) || [
  // â”€â”€â”€ 21-DAY FREE TRIAL (Everyone) â”€â”€â”€
  {icon:"ðŸŽ", text:'<span>21 Days FREE</span> â€” Full platform access for everyone. Register payment method & start today', badge:'free', badgeText:'21 DAYS'},
  {icon:"ðŸ‘¨â€âš•ï¸", text:'<span>Therapists</span> â€” 21 days free access, zero platform fee. Add payment method, start seeing patients', badge:'free', badgeText:'21 DAYS'},
  {icon:"ðŸ§‘", text:'<span>Patients</span> â€” 21 days full Premium free. Register UPI/card, explore everything, pay only if you stay', badge:'free', badgeText:'21 DAYS'},
  {icon:"ðŸ¥", text:'<span>MyDigitalClinic</span> â€” Practitioners: 21 days free, all modules unlocked. Payment method required', badge:'free', badgeText:'21 DAYS'},

  // â”€â”€â”€ ALWAYS FREE (No trial, truly free) â”€â”€â”€
  {icon:"ðŸ†“", text:'<span>Free PHQ-9 Assessment</span> â€” No signup, no card, instant results', badge:'free', badgeText:'FREE'},
  {icon:"ðŸ¤–", text:'<span>AnytimeBUDDY</span> â€” 3 free AI conversations every day, forever', badge:'free', badgeText:'FREE'},
  {icon:"ðŸ¾", text:'<span>First Digital Pet</span> â€” Adopt Chintu the Fox, <em>free forever</em>', badge:'free', badgeText:'FREE'},
  {icon:"ðŸŽµ", text:'<span>Sound Therapy</span> â€” 20 free tracks: sleep, calm, focus, raga healing', badge:'free', badgeText:'FREE'},
  {icon:"ðŸ“‹", text:'<span>GAD-7 Anxiety Screening</span> â€” Available in 5 languages, always free', badge:'free', badgeText:'FREE'},
  {icon:"ðŸ’¬", text:'<span>WhatsApp Assessment</span> â€” Chat-based PHQ-9, get PDF report <em>free</em>', badge:'free', badgeText:'FREE'},

  // â”€â”€â”€ DISCOUNTS (Admin editable) â”€â”€â”€
  {icon:"ðŸ", text:'<span>Hit a Sixer!</span> â€” Refer a friend, <strong>both get 10% off</strong> next session', badge:'deal', badgeText:'DEAL'},
  {icon:"ðŸ’°", text:'First therapy session <span>â‚¹399</span> (was â‚¹699) â€” <strong>43% off</strong> for new patients', badge:'deal', badgeText:'43% OFF'},
  {icon:"ðŸ‘¥", text:'<span>Group Therapy</span> â€” Join live circles from <strong>â‚¹149/session</strong> (50% off)', badge:'deal', badgeText:'50% OFF'},
  {icon:"ðŸ’‘", text:'<span>Couples Therapy</span> â€” First session <strong>â‚¹499/couple</strong> (normally â‚¹999)', badge:'deal', badgeText:'COUPLES'},
  {icon:"ðŸ‡®ðŸ‡³", text:'<span>NRI Special</span> â€” Therapy in your mother tongue, <strong>$29</strong> (was $45)', badge:'deal', badgeText:'35% OFF'},

  // â”€â”€â”€ SEASONAL (Admin adds/removes by date) â”€â”€â”€
  {icon:"ðŸŽ", text:'<span>World Mental Health Day</span> â€” 30 days Premium access, <em>FREE</em>, no card', badge:'seasonal', badgeText:'OCT 10'},
  {icon:"ðŸª”", text:'<span>Diwali Wellness</span> â€” Gift a therapy session to someone you love, <strong>â‚¹299</strong>', badge:'seasonal', badgeText:'DIWALI'},
  {icon:"ðŸ§˜", text:'<span>Yoga Day Special</span> â€” Free guided meditation pack (10 sessions)', badge:'seasonal', badgeText:'JUN 21'},

  // â”€â”€â”€ NEW LAUNCHES â”€â”€â”€
  {icon:"ðŸ§ ", text:'<span>AI Self-Service Hub</span> â€” CBT exercises + breathing coach + journaling', badge:'new', badgeText:'NEW'},
  {icon:"ðŸ»", text:'<span>Bholu the Bear</span> â€” New endorphin companion just launched!', badge:'new', badgeText:'NEW'},

  // â”€â”€â”€ LIMITED TIME â”€â”€â”€
  {icon:"âš¡", text:'<span>0% platform fee</span> for therapists â€” First 3 months, <strong>limited seats</strong>', badge:'limited', badgeText:'LIMITED'},
  {icon:"ðŸ‘¨â€ðŸ‘©â€ðŸ‘§", text:'<span>Family Plan</span> â€” Add 4 members for price of 2, <em>this month only</em>', badge:'limited', badgeText:'ENDS SOON'},
];

function buildOffersMarquee() {
  const track = document.getElementById('offersTrack');
  const sep = '<span class="offer-sep">âœ¦</span>';
  const itemsHtml = OFFER_ITEMS.map(o =>
    `<div class="offer-item">` +
    `<span class="oi-icon">${o.icon}</span>` +
    `<span class="oi-badge ${o.badge}">${o.badgeText}</span>` +
    `<span class="oi-text">${o.text}</span>` +
    `</div>`
  ).join(sep);
  track.innerHTML = itemsHtml + sep + itemsHtml + sep; // duplicate for seamless loop
}
// buildOffersMarquee(); // REMOVED - marquee strips dropped

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GROUP THERAPY LIVE WIDGET
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function getSessionStatus(session) {
  const diff = session.startsAt - Date.now();
  const endTime = session.startsAt.getTime() + session.duration * 60000;
  if (diff <= 0 && Date.now() < endTime) return 'live';
  if (diff > 0 && diff <= 15 * 60000) return 'soon';
  if (diff > 15 * 60000 && diff <= 120 * 60000) return 'upcoming';
  return 'scheduled';
}

function formatCountdown(ms) {
  if (ms <= 0) return 'NOW';
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min >= 60) { const hr = Math.floor(min / 60); const rm = min % 60; return `${hr}h ${rm}m`; }
  return `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
}

function renderGTSessions() {
  const container = document.getElementById('gtBoxes');
  const strip = document.getElementById('gtStrip');

  // FILTER: Only LIVE or within 2 hours
  const visibleSessions = GT_SESSIONS.filter(s => {
    const st = getSessionStatus(s);
    return st === 'live' || st === 'soon' || st === 'upcoming';
  });

  if (visibleSessions.length === 0) {
    container.innerHTML = `<div class="gt-box-empty">No sessions in the next 2 hours. <a href="#all-sessions">See full schedule â†’</a></div>`;
    return;
  }

  // If fewer than 3, pad the grid gracefully
  let html = '';
  visibleSessions.forEach(s => {
    const status = getSessionStatus(s);
    const diff = s.startsAt - Date.now();
    const seatPct = (s.spots.taken / s.spots.total) * 100;
    const seatsLeft = s.spots.total - s.spots.taken;

    // Box class
    const boxClass = status === 'live' ? 'box-live' : status === 'soon' ? 'box-soon' : 'box-upcoming';

    // Status badge
    let badge = '';
    if (status === 'live') badge = `<span class="gt-status gt-status-live"><span class="gt-dot"></span> LIVE</span>`;
    else if (status === 'soon') badge = `<span class="gt-status gt-status-soon">ðŸ”¥ ${formatCountdown(diff)}</span>`;
    else badge = `<span class="gt-status gt-status-upcoming">â° ${formatCountdown(diff)}</span>`;

    // Button
    let btn = '';
    if (status === 'live') btn = `<button class="gt-box-btn btn-live">âš¡ JOIN NOW â€” FREE</button>`;
    else if (status === 'soon') btn = `<button class="gt-box-btn btn-soon">ðŸ”¥ JOIN â€” Starting Soon</button>`;
    else btn = `<button class="gt-box-btn btn-upcoming">ðŸ”” Remind Me</button>`;

    // Seats
    let seatsHtml = '';
    if (seatsLeft <= 3 && seatsLeft > 0) {
      const barColor = status === 'live' ? '#FF9933' : status === 'soon' ? '#3B82F6' : '#EAB308';
      seatsHtml = `<div class="gt-box-seats seats-hot">ðŸ”¥ Only ${seatsLeft} seat${seatsLeft>1?'s':''} left!
        <span class="gt-seats-bar"><span class="gt-seats-fill" style="width:${seatPct}%;background:${barColor};"></span></span>
      </div>`;
    } else {
      seatsHtml = `<div class="gt-box-seats" style="color:var(--gray);">ðŸ‘¥ ${s.spots.taken}/${s.spots.total} joined</div>`;
    }

    html += `
      <div class="gt-box ${boxClass}">
        <div class="gt-box-top">
          <span class="gt-box-theme"><span class="gt-emoji">${s.emoji}</span> ${s.theme}</span>
          ${badge}
        </div>
        <div class="gt-box-meta">
          <span>ðŸ‘¨â€âš•ï¸ ${s.host}</span>
          <span>ðŸŒ ${s.lang}</span>
        </div>
        ${seatsHtml}
        ${btn}
      </div>
    `;
  });

  // If only 1 or 2 sessions, adjust grid
  if (visibleSessions.length === 1) container.style.gridTemplateColumns = '1fr';
  else if (visibleSessions.length === 2) container.style.gridTemplateColumns = '1fr 1fr';
  else container.style.gridTemplateColumns = 'repeat(3, 1fr)';

  container.innerHTML = html;
}

renderGTSessions();
setInterval(renderGTSessions, 1000);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOGIN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function toggleLogin() {
  const dd = document.getElementById('loginDropdown');
  const btn = document.getElementById('loginBtn');
  dd.classList.toggle('open'); btn.classList.toggle('open');
  if (dd.classList.contains('open')) document.addEventListener('click', closeLoginOut);
}
function closeLoginOut(e) {
  if (!document.querySelector('.login-wrapper').contains(e.target)) {
    document.getElementById('loginDropdown').classList.remove('open');
    document.getElementById('loginBtn').classList.remove('open');
    document.removeEventListener('click', closeLoginOut);
  }
}
function goLogin(type) {
  console.log('Login:', type);
  document.getElementById('loginDropdown').classList.remove('open');
  document.getElementById('loginBtn').classList.remove('open');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FESTIVAL RIBBON
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function closeFestival() { document.getElementById('festivalRibbon').classList.add('ribbon-hidden'); }

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SMART SEARCH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchInput').focus();
  renderSearchTags('');
}
function closeSearch(e) {
  if (!e || e.target === document.getElementById('searchOverlay'))
    document.getElementById('searchOverlay').classList.remove('open');
}
const allItems = LANES.flatMap(l => l.items.map(i => ({...i, lane:l.label, laneColor:l.color})));
function onSearchInput(q) {
  const md = document.getElementById('searchMatches');
  const st = document.getElementById('searchSuggestTitle');
  if (q.length > 1) {
    const ql = q.toLowerCase();
    const matches = allItems.filter(i => i.label.toLowerCase().includes(ql) || i.desc.toLowerCase().includes(ql));
    if (matches.length) {
      md.innerHTML = `<div class="search-section-title">Matching Services</div>` +
        matches.map(m => `<div class="search-match"><span class="sm-icon">${m.icon}</span><div><div class="sm-label">${m.label}</div><div class="sm-desc">${m.desc} â€” ${m.lane}</div></div></div>`).join('');
      md.style.marginBottom = '12px';
    } else { md.innerHTML = ''; md.style.marginBottom = '0'; }
    st.textContent = 'Suggestions';
  } else { md.innerHTML = ''; md.style.marginBottom = '0'; st.textContent = 'People often search for'; }
  renderSearchTags(q);
}
function renderSearchTags(q) {
  const t = document.getElementById('searchTags');
  const f = q.length > 0 ? SUGGESTIONS.filter(s => s.toLowerCase().includes(q.toLowerCase())) : SUGGESTIONS.slice(0, 8);
  t.innerHTML = f.map(s => `<span class="search-tag" onclick="document.getElementById('searchInput').value='${s}';onSearchInput('${s}');">${s}</span>`).join('');
}

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

window.addEventListener('scroll', () => {
  document.getElementById('brandBar').classList.toggle('scrolled', window.scrollY > 20);
});

document.querySelectorAll('.lang-pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.lang-pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
  });
});

renderSearchTags('');

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HIT A SIXER â€” Countdown Timer (Ariely: Scarcity/urgency)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function claimSixer() {
  alert('ðŸ SIXER! You\'ve earned â‚¹70 credit toward your next session!\n\nShare your referral code with a friend â€” when they book, you BOTH get 10% off.\n\nCode: SIXER-' + Math.random().toString(36).substr(2,6).toUpperCase());
}
(function sixerClock() {
  let s = 86387; // ~24 hours
  setInterval(() => {
    s--; if(s<0) s=86399;
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
    const el = document.getElementById('sixerTimer');
    if(el) el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }, 1000);
})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ANYTIMEBUDDY FLOATER â€” Rotating messages (Ariely: Social proof + Availability bias)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const buddyMessages = [
  { text: "Feeling stuck? I'm here 24/7. No appointments, no judgment.", cta: "Talk to me â†’" },
  { text: "3,247 people talked to me today. You're not alone in this.", cta: "Start chatting â†’" },
  { text: "Quick 5-min mood check? I'll remember where we left off.", cta: "Check in â†’" },
  { text: "Can't sleep? I know a breathing trick that works in 90 seconds.", cta: "Try it â†’" },
  { text: "Arre, itna tension mat lo. Baat karo na.", cta: "à¤šà¤²à¥‹ à¤¬à¤¾à¤¤ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚ â†’" },
  { text: "Your therapist session is in 2 days. Want to prep together?", cta: "Let's prep â†’" },
  { text: "You've been consistent for 5 days! Your streak is ðŸ”¥", cta: "Keep going â†’" },
];
let buddyMsgIdx = 0;
let buddyVisible = false;

function rotateBuddyMsg() {
  const bubble = document.getElementById('buddyBubble');
  const msgEl = document.getElementById('buddyMsg');
  const ctaEl = document.getElementById('buddyCta');
  if (!bubble || !msgEl) return;

  bubble.classList.remove('show');
  setTimeout(() => {
    const msg = buddyMessages[buddyMsgIdx % buddyMessages.length];
    msgEl.textContent = msg.text;
    ctaEl.textContent = msg.cta;
    bubble.classList.add('show');
    buddyMsgIdx++;
  }, 400);

  // Auto-hide after 6s
  setTimeout(() => { bubble.classList.remove('show'); }, 6500);
}

// Show first message after 3s, then every 20s
setTimeout(rotateBuddyMsg, 3000);
setInterval(rotateBuddyMsg, 20000);

// Toggle on avatar click
function toggleBuddy() {
  const bubble = document.getElementById('buddyBubble');
  buddyVisible = !buddyVisible;
  if (buddyVisible) {
    rotateBuddyMsg();
  } else {
    bubble.classList.remove('show');
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GROUP GLOW â€” Seat drain animation (Ariely: Scarcity)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
setInterval(() => {
  document.querySelectorAll('.group-glow-box.live .gg-seats-label .left').forEach(el => {
    const current = parseInt(el.textContent);
    if (current > 1 && Math.random() < 0.3) {
      el.textContent = (current - 1) + ' seats left!';
      // Update bar
      const bar = el.closest('.gg-seats').querySelector('.gg-seats-fill');
      if (bar) {
        const total = parseInt(el.closest('.gg-seats-label').querySelector('.total').textContent);
        const filled = total - (current - 1);
        bar.style.width = Math.round((filled / total) * 100) + '%';
      }
    }
  });
}, 15000); // Every 15 seconds, maybe lose a seat

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADMIN OFFER EDITOR
// Opens from Login â†’ Admin â†’ Edit Offers
// Edits save to localStorage, marquee rebuilds live
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openAdminEditor() {
  document.getElementById('loginDropdown').classList.remove('open');
  document.getElementById('loginBtn').classList.remove('open');
  document.getElementById('adminOverlay').classList.add('open');
  renderAdminTable();
}
function closeAdmin() { document.getElementById('adminOverlay').classList.remove('open'); }

function renderAdminTable() {
  const tbody = document.getElementById('adminTbody');
  tbody.innerHTML = '';
  OFFER_ITEMS.forEach((item, i) => {
    const tr = document.createElement('tr');
    const safeText = item.text.replace(/"/g,'&quot;');
    tr.innerHTML =
      `<td style="width:28px;text-align:center;color:#A0AEC0;font-size:10px;font-weight:700">${i+1}</td>`+
      `<td><input class="icon-input" value="${item.icon}" onchange="updateOffer(${i},'icon',this.value)"></td>`+
      `<td><input value="${safeText}" onchange="updateOffer(${i},'text',this.value)" style="min-width:260px"></td>`+
      `<td><select class="badge-select" onchange="updateOffer(${i},'badge',this.value)">`+
        `<option value="free" ${item.badge==='free'?'selected':''}>ðŸŸ¢ Free</option>`+
        `<option value="deal" ${item.badge==='deal'?'selected':''}>ðŸ”´ Deal</option>`+
        `<option value="new" ${item.badge==='new'?'selected':''}>ðŸ”µ New</option>`+
        `<option value="seasonal" ${item.badge==='seasonal'?'selected':''}>ðŸŸ£ Seasonal</option>`+
        `<option value="limited" ${item.badge==='limited'?'selected':''}>ðŸŸ¡ Limited</option>`+
      `</select></td>`+
      `<td><input class="badge-text-input" value="${item.badgeText}" onchange="updateOffer(${i},'badgeText',this.value)"></td>`+
      `<td><button class="del-btn" onclick="deleteOffer(${i})">âœ•</button></td>`;
    tbody.appendChild(tr);
  });
}
function updateOffer(idx,key,val) { OFFER_ITEMS[idx][key]=val; }
function deleteOffer(idx) { OFFER_ITEMS.splice(idx,1); renderAdminTable(); saveAndRebuild(); }
function addNewOffer() {
  OFFER_ITEMS.push({icon:'ðŸŽ¯',text:'<span>New Offer</span> â€” Edit this text with your deal details',badge:'deal',badgeText:'NEW'});
  renderAdminTable();
  document.querySelector('.admin-body').scrollTop=99999;
}
function saveAndRebuild() {
  localStorage.setItem('MANAS360_OFFERS',JSON.stringify(OFFER_ITEMS));
  // buildOffersMarquee(); // REMOVED - marquee strips dropped
  const s=document.getElementById('adminSaved'); s.classList.add('show');
  setTimeout(()=>s.classList.remove('show'),2000);
}
function resetOffers() {
  if(!confirm('Reset all offers to defaults? This will clear your edits.')) return;
  localStorage.removeItem('MANAS360_OFFERS'); location.reload();
}

