import type { PhoneSlide } from '../components/PhoneScrollTrack';
import type { LivePrototypesConfig } from '../components/LivePrototypeDemos';

export interface CaseStudyMetric {
  value: string;
  label: string;
  context: string;
}

export interface CaseStudySection {
  id: string;
  kicker: string;
  heading?: string;
  lead?: string;
  paragraphs: string[];
  callout?: {
    label: string;
    quote: string;
    attribution: string;
  };
  findings?: {
    title: string;
    detail: string;
  }[];
  prototypeCta?: {
    kicker?: string;
    tagline: string;
    buttonLabel: string;
    href: string;
  };
  image?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
    variant?: 'wide' | 'phone';
  };
  phoneCarousel?: PhoneSlide[];
  livePrototypes?: LivePrototypesConfig;
  auditTable?: {
    category: string;
    platformsAudited: string;
    dominantGap: string;
  }[];
  scopeTable?: {
    status: string;
    decision: string;
    driver: string;
  }[];
}

export interface CaseStudy {
  slug: string;
  index: string;
  title: string;
  displayTitle: string;
  heroTagline?: string;
  subtitle: string;
  shortRole: string;
  year: string;
  microLabel: string;
  summary: string;
  heroImages?: {
    src: string;
    width?: number;
    height?: number;
    alt: string;
  };
  metadata: {
    role: string;
    scope: string;
    methods: string;
    tools: string;
  };
  metrics: CaseStudyMetric[];
  problemSolution?: {
    problem: string;
    solution: string;
  };
  researchGoals?: string[];
  sections: CaseStudySection[];
}

export const CONTACT_EMAIL = 'micah.samter@proton.me';

export const WELLBE_SLIDES: PhoneSlide[] = [
  {
    id: 'wellbe-live-1',
    src: '/assets/wellbe-mockup-1.webp',
    title: 'Today / Quick Check-In',
    caption:
      'Calm dashboard with latest mood status and one-tap check-in tags.',
    alt: 'WELLBE+ mobile preview Today screen showing latest Joyful state and color-coded Quick Check-In buttons',
  },
  {
    id: 'wellbe-live-2',
    src: '/assets/wellbe-mockup-2.webp',
    title: 'Instant Check-In (RULER Grid)',
    caption:
      'Full 16-emotion RULER grid across four quadrants for sub-3-second logging.',
    alt: 'WELLBE+ mobile preview Instant Check-In screen displaying the 16-emotion RULER grid',
  },
  {
    id: 'wellbe-live-3',
    src: '/assets/wellbe-mockup-3.webp',
    title: 'Routines & Somatic Resets',
    caption:
      'Quick 1-8 min somatic resets with voice panic anchors and gratitude capture.',
    alt: 'WELLBE+ mobile preview Routines screen with reset durations, Voice Panic Anchor, and Gratitude Capture',
  },
  {
    id: 'wellbe-live-4',
    src: '/assets/wellbe-mockup-4.webp',
    title: 'Mood Log & Daily Timeline',
    caption:
      'Filterable history of check-ins with category counts and one-tap export.',
    alt: 'WELLBE+ mobile preview Mood Log screen with category filters, daily entries, and Export & Data button',
  },
  {
    id: 'wellbe-live-5',
    src: '/assets/wellbe-mockup-5.webp',
    title: 'Trends & Biometric Analytics',
    caption:
      '7- and 30-day mood data, live biometrics, and a one-page therapist summary.',
    alt: 'WELLBE+ mobile preview Trends screen showing emotional distribution bars, Therapist Summary, and 7-day mood curve',
  },
  {
    id: 'wellbe-live-6',
    src: '/assets/wellbe-mockup-6.webp',
    title: 'WELLBE+ Coach & Wearable Sync',
    caption:
      'Reflections from local mood logs and Pixel Watch sleep, HRV, and heart rate.',
    alt: 'WELLBE+ mobile preview Coach screen with suggested reflection prompts and Pixel Watch context sync',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'wellbe',
    index: '01',
    title: 'Holistic Mental Health (WELLBE+)',
    displayTitle: 'WELLBE+',
    heroTagline: 'A Holistic Mental Health App: Designing a Low-Friction Ecosystem.',
    subtitle: 'UX Research, Product Strategy & Cross-Device Design',
    shortRole: 'UX Research & Product Strategy',
    year: '2026',
    microLabel: 'UX CASE STUDY BY MICAH SAMTER',
    summary:
      'An investigation into how everyday people rely on phones for wellbeing, and how user-centered design can support the whole person.',
    heroImages: {
      src: 'assets/wellbe-work-1604.webp',
      width: 1604,
      height: 902,
      alt: 'WELLBE+ mobile interface screens showing Quick Check-In, Routines, Mood Log, and Trends',
    },
    metadata: {
      role: 'Lead UX Researcher & Product Designer',
      scope: 'Mixed-Methods Research, Synthesis, Cross-Device Prototyping & Testing',
      methods:
        'Clinical & User Interviews, Ethnographic Synthesis, 22-Platform Competitive Audit',
      tools: 'Figma, FigJam, Google Workspace, Google Forms, Gemini, React',
    },
    metrics: [
      {
        value: '50',
        label: 'Survey Respondents',
        context: 'Asked about daily phone habits, stress triggers, and how they take care of themselves.',
      },
      {
        value: '7',
        label: 'User Interviews',
        context: 'One-on-one chats digging into real mental health routines and app workflows.',
      },
      {
        value: '22',
        label: 'Platforms Audited',
        context: 'Looked closely at mental health, meditation, and journaling apps to spot gaps.',
      },
    ],
    problemSolution: {
      problem:
        'Your sleep, workouts, and mood live in separate apps, making it hard to see how daily habits affect how you feel.',
      solution:
        'One calm dashboard that pulls together wearable data and quick check-ins so you can spot patterns between physical habits and mood at a glance.',
    },
    researchGoals: [
      'See how people manage their day-to-day mental wellness on their own.',
      'Spot what slows users down or causes friction inside mobile wellness apps.',
      'Understand the stigma and practical roadblocks that keep people from getting care or sticking with digital tools.',
    ],
    sections: [
      {
        id: 'overview',
        kicker: '01. Overview',
        heading:
          "How people actually use their phones for wellbeing—and how to design support that doesn't add more mental clutter.",
        lead: 'Standalone wellness apps often create more stress than relief. In this solo UX research and design case study, I looked at how folks use their phones and wearables day to day, and why disconnected tools burn people out.',
        paragraphs: [
          'From there, I designed WELLBE+ across Wear OS, mobile, tablet, and desktop. It pairs passive wearable data with quick check-ins so you can spot patterns between daily routines and mood without turning self-care into extra work.',
        ],
      },
      {
        id: 'problem-statement',
        kicker: '02. Problem Statement',
        heading: 'Mental health tools demand the most effort when users have the least capacity.',
        lead: "Most wellbeing apps treat emotional care like a productivity streak. Miss a day, and you get hit with red badges or asked to write long journal entries on a bright screen while you're already overwhelmed.",
        paragraphs: [
          'Tracking mood, sleep, and workouts across separate apps also makes it hard to spot what actually affects how you feel. When logging turns into another chore, people drop it on the rough days when they need help most. I wanted to see how folks actually use their phones and wearables to stay steady, then pull passive watch data and fast check-ins into one quiet dashboard instead of making them bounce between apps.',
        ],
        callout: {
          label: 'Field Interview Insight',
          quote:
            'When I am actually spiraling, the last thing I want is an app cheerfully asking me to write three paragraphs about gratitude or reminding me that I broke a 14-day streak.',
          attribution: 'Participant P04 · 29, Graduate Student & Retail Manager, Atlanta',
        },
      },
      {
        id: 'understanding-the-user',
        kicker: '03. Understanding the User',
        heading: 'Talking to clinicians and everyday users—and auditing 22 platforms',
        lead: 'Before sketching anything, I audited 22 wellness platforms and ran semi-structured interviews with both licensed clinicians and everyday adults dealing with stress. I wanted to see how people actually manage their wellbeing day to day instead of relying on wellness clichés.',
        paragraphs: [
          'I built WELLBE+ for busy working adults who already use smartphones and wearables. In my 50-person survey, 75% managed anxiety and 50% dealt with depression, with people aged 25–34 reporting the highest rates. Using those responses and 7 interviews, I created my primary persona, Joey Blackwell—a full-time professional who wants one fast way to connect his mood with sleep, workouts, and daily habits instead of juggling separate apps. I also kept clinicians in mind as a secondary audience, since they need trustworthy, evidence-based tools they can recommend between sessions.',
          'Talking with clinical psychologists surfaced a useful blind spot. Clients rarely had trouble remembering that they felt "bad" on Tuesday; what they forgot were the physical and environmental triggers leading up to it—like poor sleep, a sustained high heart rate, or back-to-back social fatigue.',
        ],
        auditTable: [
          {
            category: 'Guided Meditation Apps',
            platformsAudited: '7 platforms',
            dominantGap: 'Steep paywalls and streak pressure, with no passive biometric context.',
          },
          {
            category: 'Mood & Journaling Tools',
            platformsAudited: '8 platforms',
            dominantGap: 'Basic 5-face scales or exhausting blank-page text boxes.',
          },
          {
            category: 'Fitness & Sleep Wearables',
            platformsAudited: '7 platforms',
            dominantGap: 'Great HRV and sleep data, but framed only around athletic performance rather than emotional wellbeing.',
          },
        ],
      },
      {
        id: 'roles-and-responsibilities',
        kicker: '04. Roles & Responsibilities',
        heading: 'Doing all the research and design solo across four screens',
        lead: 'I took this project on by myself, working remotely with no client or company partner. That meant handling both the UX research and product design from early discovery through usability testing.',
        paragraphs: [
          'During the sprint, I put together a 50-person survey, ran 7 interviews, and audited 22 apps before sketching wireframes and setting up a WCAG AA/AAA visual system. After that, I built interactive Figma prototypes for Wear OS, mobile, tablet, and desktop, then ran guerrilla usability tests on each flow.',
          "Working solo didn't mean working in a bubble. I talked with a therapist early to shape the clinical side, and tested changes directly with everyday participants as I went.",
        ],
      },
      {
        id: 'scope-and-constraints',
        kicker: '05. Scope',
        heading: 'Running a 5-week solo sprint with a $0 budget and clear clinical boundaries',
        lead: "I ran this as a solo 5-week sprint (Feb 12–Mar 18, 2024) on a $0 budget. Because I didn't have paid panels or funding, I leaned on free tools, remote recruiting, and guerrilla testing.",
        paragraphs: [
          'What I learned pushed the scope in two directions. First, I went from a single phone view to four screens (Wear OS watch, mobile, tablet, and desktop) so passive wearable tracking could actually work. Second, I cut heavier ideas—like AI chatbots and mandatory journaling—because tired users bail on high-effort features.',
          "Since there was no engineering team to ship live code, I stopped at interactive prototypes. On the clinical side, I grounded the product in CBT, DBT, and Yale's RULER framework as an everyday companion rather than a stand-in for therapy.",
        ],
        scopeTable: [
          {
            status: 'EXPANDED',
            decision: '1 screen to 4 screens (Wear OS, mobile, tablet, desktop)',
            driver:
              'Survey and interview notes showed users wanted passive watch tracking instead of constant manual logging.',
          },
          {
            status: 'PRIORITIZED',
            decision: 'Rapid RULER check-ins, burnout alerts, and panic mode',
            driver: 'High-stress moments need fast capture and quick relief without extra friction.',
          },
          {
            status: 'CUT',
            decision: 'AI therapy chatbots and mandatory journaling',
            driver:
              "Guerrilla testing showed exhausted users quit long text flows and didn't trust synthetic therapy.",
          },
          {
            status: 'BOUNDED',
            decision: 'Interactive Figma prototypes (no live engineering build)',
            driver: 'Tight 5-week solo timeline, $0 budget, and no developer handoff.',
          },
          {
            status: 'GUARDRAIL',
            decision: "Grounded in CBT, DBT, and Yale's RULER framework",
            driver:
              'Clinical input set a clear line: daily support companion, not a therapy replacement.',
          },
        ],
      },
      {
        id: 'the-process',
        kicker: '06. The Process',
        heading: 'Building a calm cross-device loop',
        lead: 'I built WELLBE+ around one simple rule: make logging effortless on your wrist, and save deeper reflection for bigger screens when you actually want it.',
        paragraphs: [
          "On Wear OS, the watch quietly syncs sleep, resting heart rate, and recovery trends in the background without asking you to type anything in. When you feel like checking in—or tap after a gentle watch buzz—you see a stripped-down version of Yale's RULER Mood Meter: four energy-and-pleasantness quadrants that open into 16 clear feeling words.",
          'Logging on the watch takes less than three seconds. Pick a quadrant, tap a word, and get back to your day. Later, on mobile, tablet, or desktop, those quick check-ins line up automatically on a simple timeline next to your physical habits—giving you and your therapist clear context without feeling like extra homework.',
        ],
        livePrototypes: {
          mobile: {
            label: 'INTERACTIVE MOBILE PROTOTYPE',
            src: 'https://wellbe-mobile.micahsamter.com/',
            title: 'WELLBE+ interactive mobile prototype',
            loadingLabel: 'Loading live prototype...',
            caption:
              'Interactive build — tap check-ins, routines, and tabs directly inside the frame.',
            fallbackCaption:
              'Static app mockup shown — live embed did not connect. Use Reset Demo or Open Fullscreen above.',
            fallbackImage: {
              src: 'assets/wellbe-prototype-mobile-fallback.webp',
              alt: 'WELLBE+ mobile Today screen showing Quick Check-In emotions and bottom navigation bar',
              width: 332,
              height: 695,
            },
          },
          watch: {
            label: 'INTERACTIVE WATCH PROTOTYPE',
            src: 'https://wellbe-watch.micahsamter.com/?tile=1',
            title: 'WELLBE+ interactive watch prototype',
            loadingLabel: 'Loading watch prototype...',
            caption:
              'Interactive Wear OS build — tap directly inside the circular watch face to test quick check-ins and timers.',
            fallbackCaption:
              'Static watch mockup shown — live embed did not connect. Use Reset Demo or Open Fullscreen above.',
            fallbackImage: {
              src: 'assets/wellbe-prototype-watch-fallback.webp',
              alt: 'WELLBE+ Wear OS circular emotion grid watch screen',
              width: 364,
              height: 364,
            },
          },
        },
      },
      {
        id: 'lessons-learned',
        kicker: '07. Lessons Learned',
        heading: 'Designing for overwhelmed users and learning where to narrow scope.',
        lead: 'Testing clickable prototypes across the watch and companion screens made one thing clear: simple everyday tools beat standalone meditation apps when people are stressed.',
        paragraphs: [
          'The 5-week sprint hit its goal. I turned 50 survey responses, 7 interviews, and a 22-app audit into a WCAG AA/AAA prototype across Wear OS, mobile, tablet, and desktop that later grew into a working WELLBE+ build.',
          "Since this was a solo concept sprint with no live release, I don't have production retention numbers yet. Instead, the real wins came from usability fixes—cutting AI chatbots and mandatory journaling so check-ins only take a few seconds.",
          "If I did this again, I'd test the core mobile and Wear OS loop first before building four screens. I'd also pair guerrilla testing with a multi-week diary study to see if habits actually stick, and bring clinicians back in during mid-fidelity reviews. The biggest takeaway for me was restraint: when someone is already burned out, removing steps helps way more than adding another feature.",
        ],
        findings: [
          {
            title: 'Basic tools beat meditation apps',
            detail:
              'People reached for Google Calendar, alarms, music, podcasts, and fitness trackers before opening dedicated mindfulness apps.',
          },
          {
            title: 'Phones: a lifeline and trigger',
            detail:
              'Participants leaned on their phones to stay connected, yet the same screen pulled them into doomscrolling and burnout. One interviewee called it a "harbinger of bad mental health."',
          },
          {
            title: 'Hard days break long flows',
            detail:
              'As one participant put it, depression "doesn\'t let you care enough to do anything about it." Any flow that required heavy typing or daily streaks fell apart on hard days.',
          },
        ],
        phoneCarousel: WELLBE_SLIDES,
      },
    ],
  },
];

export interface QaItem {
  question: string;
  answer: string | string[];
}

export const QA_ITEMS: QaItem[] = [
  {
    question: 'How I got started in user research',
    answer: [
      "My route into UX wasn't a straight line, and I'm glad it worked out that way. I started out doing freelance digital art and visual design. Making things look good was fun, yet I kept wondering about the people on the other side of the screen—what caught their eye, what slowed them down, and how they actually made choices.",
      "That curiosity pushed me to study psychology and anthropology at Georgia State University. Psychology helped me understand how people think and process information. Anthropology got me out into real spaces to watch everyday routines and ask open-ended questions. Instead of guessing what people wanted, I learned how to spot the gap between what they say they do and what they actually do.",
    ],
  },
  {
    question: "What I've been working on",
    answer:
      "Along with product design, I'm working on The Mindfulness Method—a hands-on field guide pulling ethnographic fieldwork, psychology, and UX research into one practical approach to human-centered work. When I'm between projects, I write about qualitative methods and try out new software. I'm also looking for my next full-time UX research or product design role.",
  },
  {
    question: "What I'm curious about",
    answer:
      "I care most about tech that helps people out without fighting for their attention. A lot of my time goes into accessible design and seeing how tools like AI fit into normal daily habits. When I step away from research, I still tinker—putting together and fixing custom PCs or messing around with new design software.",
  },
];


