// Editable public-site content. Every text is { ta, en }.
export const tx = (o, lang) => (o && (o[lang] ?? o.en ?? o.ta)) || '';

const HOME = { to: '/', end: true, icon: 'home', ta: 'முகப்பு', en: 'Home' };
const COMMUNITY = { to: '/community', ta: 'சமூகம்', en: 'Community' };
const SANGAM = { to: '/about', ta: 'சங்கம்', en: 'Sangam' };
const EVENTS_NAV = { to: '/events', ta: 'நிகழ்வுகள்', en: 'Events & Activities' };
export const MS_NAV = { to: '/ms2026', hl: true, ta: 'மங்கல சந்திப்பு', en: 'Mangala Santhippu' };
const MEMBERSHIP_NAV = { to: '/membership', ta: 'உறுப்பினர்', en: 'Membership' };
const CONTACT = { to: '/contact', ta: 'தொடர்புக்கு', en: 'Contact Us' };

export const NAV = [HOME, COMMUNITY, SANGAM, EVENTS_NAV, MS_NAV, MEMBERSHIP_NAV, CONTACT];

// Menu of the application page (apply.html)
export const APPLY_NAV = [HOME, SANGAM, COMMUNITY, EVENTS_NAV, MS_NAV, MEMBERSHIP_NAV, CONTACT];

// Footer: column 2 links, column 3 contact (column 1 is the logo)
export const FOOTER_LINKS = [COMMUNITY, SANGAM, EVENTS_NAV, MS_NAV];
export const FOOTER_CONTACT = CONTACT;

export const COMMUNITY_SECTIONS = [
  { icon: '🏅', title: { ta: 'உறுப்பினர் சாதனைகள்', en: 'Member achievements' }, text: { ta: 'கல்வி, தொழில், கலை மற்றும் சமூகப் பணிகளில் சாதித்த உறுப்பினர்கள்.', en: 'Members who have excelled in education, profession, arts and service.' } },
  { icon: '👴', title: { ta: 'மூத்தோர்', en: 'Senior citizens' }, text: { ta: 'மூத்த குடிமக்களுக்கான உதவி, சந்திப்புகள் மற்றும் ஆதரவு.', en: 'Assistance, gatherings and support for senior citizens.' } },
  { icon: '🎓', title: { ta: 'இளைஞர் & மாணவர்', en: 'Youth & students' }, text: { ta: 'வழிகாட்டுதல், கல்வி உதவித்தொகை மற்றும் தொடர்பு வலையமைப்பு.', en: 'Career guidance, scholarships, mentoring and networking.' } },
  { icon: '💼', title: { ta: 'தொழில் & வல்லுநர்', en: 'Business & professionals' }, text: { ta: 'சமூகத் தொழில்முனைவோர் மற்றும் வல்லுநர்களின் விருப்பப் பட்டியல்.', en: 'A voluntary listing of community entrepreneurs and professionals.' } },
];

export const UI = {
  tagline: { ta: 'பாரம்பரியம் • ஒற்றுமை • நலன் • முன்னேற்றம்', en: 'Tradition • Unity • Welfare • Progress' },
  member_login: { ta: 'உறுப்பினர் உள்நுழைவு', en: 'Member Login' },
  menu: { ta: 'பட்டி', en: 'Menu' },
  welcome: { ta: 'குரோம்பேட்டை கார்காத்தார் சமூகத்திற்கு வரவேற்கிறோம்', en: 'Welcome to the Chromepet Karkathar community' },
  welcome_sub: {
    ta: 'சமூகத்தின் அடையாளத்தைக் காத்து, குடும்பங்களிடையே உறவை வலுப்படுத்தி, சங்கப் பணிகளை ஒருங்கிணைக்கிறோம்.',
    en: 'Preserving our identity, strengthening bonds between families and running the work of the Sangam together.',
  },
  apply_ms: { ta: 'மங்கல சந்திப்பு – விண்ணப்பம்', en: 'Mangala Santhippu – Apply' },
  see_events: { ta: 'நிகழ்வுகளைக் காண்க', en: 'See events' },
  prev: { ta: 'முந்தைய படம்', en: 'Previous image' },
  next: { ta: 'அடுத்த படம்', en: 'Next image' },
  go_slide: { ta: 'படம் {n}', en: 'Image {n}' },
  pause: { ta: 'நிறுத்து', en: 'Pause' },
  play: { ta: 'இயக்கு', en: 'Play' },
  upcoming: { ta: 'வரவிருக்கும் நிகழ்வு', en: 'Upcoming event' },
  more: { ta: 'மேலும் அறிக', en: 'Learn more' },
  more_short: { ta: 'மேலும்', en: 'More' },
  details: { ta: 'விவரங்கள்', en: 'Details' },
  service_title: { ta: 'சமூக சேவை', en: 'Community service' },
  service_sub: { ta: 'கல்வி, மருத்துவம் மற்றும் தேவையுள்ள குடும்பங்களுக்கான உதவி.', en: 'Education, medical support and help for families in need.' },
  our_community: { ta: 'நம் சமூகம்', en: 'Our community' },
  our_community_text: {
    ta: 'உறுப்பினர்களின் சாதனைகள், மூத்தோர் மற்றும் கடந்த கூடுகைகளின் படங்கள் – உரிய ஒப்புதலுடன் மட்டுமே இங்கு பகிரப்படும்.',
    en: 'Member achievements, senior citizens and photographs from past gatherings – shared here only with consent.',
  },
  view_gallery: { ta: 'மேலும் அறிக', en: 'Learn more' },
  copyright: { ta: 'குரோம்பேட்டை கார்காத்தார் சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.', en: 'Chromepet Karkathar Sangam. All rights reserved.' },
  home: { ta: 'முகப்பு', en: 'Home' },
  footer_menu: { ta: 'அடிக்குறிப்பு பட்டி', en: 'Footer' },
  community_consent: { ta: 'உறுப்பினர்களின் விவரங்கள் மற்றும் படங்கள் அவர்களின் ஒப்புதலுடன் மட்டுமே பகிரப்படும்.', en: 'Member details and photographs are shared only with their consent.' },
  footer_message: { ta: 'குரோம்பேட்டை கார்காத்தார் சங்கம் சமூக மேம்பாட்டிற்காகப் பாடுபடும் சுயாதீனமான, இலாப நோக்கற்ற அமைப்பாகும்.', en: 'Chromepet Karkathar Association is an independent, not-for-profit organisation working towards the upliftment of the community.' },
  footer_meet: { ta: 'நாங்கள் சந்திக்குமிடம்', en: 'We meet at' },
  footer_location: { ta: 'இடம்', en: 'Location' },
  footer_follow: { ta: 'எங்களைப் பின்தொடருங்கள்', en: 'Follow us' },
  contact_office: { ta: 'நிர்வாகிகள்', en: 'Office bearers' },
  contact_call: { ta: 'அழைக்க', en: 'Call' },
  footer_privacy: {
    ta: 'திருமண விவரங்கள், தொலைபேசி எண்கள் மற்றும் குடும்ப விவரங்கள் பொதுவில் வெளியிடப்படுவதில்லை.',
    en: 'Matrimonial records, phone numbers and family details are never published openly.',
  },
};

export const MS_FEATURE = {
  title: { ta: 'மங்கல சந்திப்பு', en: 'Mangala Santhippu' },
  text: {
    ta: 'கார்காத்தார் சமூகத்தினருக்கான திருமணத் தகவல் சந்திப்பு. இணையத்தில் விண்ணப்பித்து, தனிப்பட்ட தகவல் பாதுகாப்புடன் பதிவு எண் பெறலாம்.',
    en: 'The marriage information meet for the Karkathar community. Apply online and receive a unique registration number – your details stay private.',
  },
};

export const OBJECTIVES = [
  { ta: 'கார்காத்தார் சமூகத்தின் அடையாளத்தையும் பாரம்பரியத்தையும் பாதுகாத்தல்.', en: 'Preserve the identity and heritage of the Karkathar community.' },
  { ta: 'குடும்பங்களிடையே உறவுகளை வலுப்படுத்துதல்.', en: 'Strengthen relationships among families.' },
  { ta: 'உறுப்பினர் சேர்க்கை, மங்கல சந்திப்பு, நிகழ்வுகள், நலத்திட்டங்கள் போன்ற சங்கப் பணிகளை நிர்வகித்தல்.', en: 'Manage Sangam activities – membership, matrimonial introductions, events and welfare.' },
];

// Add the Sangam's own history text here; the About page shows it when filled in.
export const HISTORY = { ta: '', en: '' };

export const WELFARE = [
  { icon: '🎓', title: { ta: 'கல்வி உதவி', en: 'Education assistance' }, text: { ta: 'மாணவர்களின் கல்விக்கான ஆதரவு மற்றும் வழிகாட்டுதல்.', en: 'Support and guidance for students’ education.' } },
  { icon: '🩺', title: { ta: 'மருத்துவ உதவி', en: 'Medical support' }, text: { ta: 'மருத்துவத் தேவையுள்ள குடும்பங்களுக்கு உதவி.', en: 'Help for families with medical needs.' } },
  { icon: '🤝', title: { ta: 'தேவையுள்ள குடும்பங்களுக்கு உதவி', en: 'Families in need' }, text: { ta: 'இக்கட்டான நேரங்களில் சமூகத்தின் துணை.', en: 'The community standing by in difficult times.' } },
  { icon: '🌱', title: { ta: 'சமூக முயற்சிகள்', en: 'Community initiatives' }, text: { ta: 'தன்னார்வலர்களுடன் இணைந்த சமூகப் பணிகள்.', en: 'Community projects together with volunteers.' } },
];

// Extra events/announcements. The Mangala Santhippu event is added automatically from Admin > Settings.
// Event: { title:{ta,en}, date:{ta,en}, venue:{ta,en}, text:{ta,en} }
export const EVENTS = [];

// Past events (newest first). Each entry: { date, title, venue, text } with { ta, en } text.
export const PAST_EVENTS = [
  {
    date: { ta: '28 மார்ச் 2026', en: '28 March 2026' },
    title: { ta: 'நெல்லையப்பர் நினைவு நாள்', en: 'Nellaiyappar Memorial Day' },
    venue: {
      ta: 'நெல்லையப்பர் சிலை, தபால் நிலையம் அருகில், குரோம்பேட்டை, சென்னை',
      en: 'Nelliappar Statue, Near Post Office, Chromepet, Chennai',
    },
    text: {
      ta: 'ஒவ்வோர் ஆண்டும் கொண்டாடப்படும் இந்த நாள், கார்காத்தார் சுதந்திரப் போராட்ட வீரரும் குரோம்பேட்டைக்காக தன் அனைத்தையும் அர்ப்பணித்தவருமான பரலி சு. நெல்லையப்பர் அவர்களின் நினைவாக அனுசரிக்கப்படுகிறது.',
      en: 'Celebrated every year in fond memory of Parali Su. Nellaiyappar, a Karkathar freedom fighter who lived and gave his everything to Chromepet.',
    },
  },
];
// News: { title:{ta,en}, date:'DD-MM-YYYY', text:{ta,en} }
export const NEWS = [];

// Home hero: 5 slides. `image` = file name (without extension) to drop into public/hero/
// e.g. public/hero/spiritual.jpg  (phones: public/hero/mobile/spiritual.jpg). Without a file the slide shows a colour background.
export const HERO_SLIDES = [
  { image: 'spiritual', icon: '🛕', to: '/events', tint: ['#4a2a00', '#8a4b08'],
    title: { ta: 'ஆன்மீகம்', en: 'Spirituality' },
    text: { ta: 'சிறப்பு பூஜைகள், கூட்டு பிரார்த்தனைகள், ஆன்மீக வகுப்புகள், யோக சைவ சித்தாந்த வகுப்புகள் என இறைவழியில் நம் சங்கம்', en: 'Special poojas, collective prayers, spiritual classes, and Yoga and Saiva Siddhanta classes: our Sangam walks the path of devotion.' } },
  { image: 'leadership', icon: '🌟', to: '/about', tint: ['#08294a', '#14538c'],
    title: { ta: 'தலைமைத்துவம்', en: 'Leadership' },
    text: { ta: 'சமூகத்தை வழிநடத்தும் பொறுப்புள்ள தலைவர்களை உருவாக்கி, இளைஞர்களுக்கு போட்டிகள், பரிசுகள் வழங்குகிறோம்', en: 'We nurture responsible leaders who guide the community, and offer our youth competitions and prizes.' } },
  { image: 'welfare', icon: '🤝', to: '/welfare', tint: ['#0b4a1f', '#1b7a37'],
    title: { ta: 'சமூக நலன்', en: 'Community Welfare' },
    text: { ta: 'குரோம்பேட்டை மங்கல சந்திப்பு கார்குல நிகழ்வுகளில் ஒரு சிறப்பு, இன்ப சுற்றுலா, ஆலய தரிசனம், மருத்துவ முகாம்கள்', en: 'A special part of the Chromepet Mangala Santhippu and Karkathar community events, with joyful outings, temple visits and medical camps.' } },
  { image: 'education', icon: '🎓', to: '/community', tint: ['#3b0a4a', '#74148c'],
    title: { ta: 'கல்வி', en: 'Education' },
    text: { ta: 'சங்க உறுப்பினர்கள், CREW TRUST, KBF உறுப்பினர்கள் என பலரின் உதவியால் பலருக்கு கல்வி உதவித்தொகை வழங்குகிறோம்', en: 'With the help of Sangam members, CREW TRUST and KBF members, we provide education scholarships to many students.' } },
  { image: 'employment', icon: '💼', to: '/community', tint: ['#4a0a14', '#8c1428'],
    title: { ta: 'வேலைவாய்ப்பு', en: 'Employment' },
    text: { ta: 'திறன் வளர்ப்பு, வழிகாட்டுதல் மற்றும் தொடர்புகள் மூலம் வேலைவாய்ப்பிற்கு உறுதுணையாக இருக்கிறோம்.', en: 'Supporting employment through skill-building, guidance and networking.' } },
];
