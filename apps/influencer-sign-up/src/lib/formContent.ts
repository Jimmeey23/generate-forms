// Landing-page content for generated forms, ported from the one-click-signup reference site.
import { TrendingUp, Fingerprint, Zap, Star, Trophy, UserCheck, ListChecks, Users, type LucideIcon } from 'lucide-react';
import { HERO_IMAGES } from './constants';

export type City = 'mumbai' | 'bengaluru';

export const METHOD_FEATURES = [
  { image: HERO_IMAGES[8], tag: 'Sculpt', title: 'Isometric holds + dynamic reps', body: 'Tiny, precise movements that sculpt deep muscle - the Physique 57 signature.' },
  { image: HERO_IMAGES[5], tag: 'Burn', title: 'Interval-style class structure', body: 'Sequenced segments hit every muscle group with zero downtime, no impact.' },
  { image: HERO_IMAGES[1], tag: 'Recover', title: 'Stretch to lengthen, every class', body: 'We finish long and lean - every session ends with deep stretching to reset.' },
];

export const KEY_BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: TrendingUp, title: 'Proven, Visible Results in Weeks', body: 'Physique 57 is known for delivering fast, visible transformation - leaner arms, lifted glutes, stronger core, and improved posture - within just a few weeks.' },
  { icon: Fingerprint, title: 'Proprietary, Globally Proven Method', body: 'This signature method was developed in New York and refined over years, giving members a system that feels premium, polished, and internationally trusted.' },
  { icon: Zap, title: 'High-Intensity Yet Low-Impact', body: 'The workout deeply fatigues muscles without putting stress on joints, making it intense enough for results and sustainable enough for long-term consistency.' },
  { icon: Star, title: 'Celebrity-Endorsed and Loved', body: "The brand's strong aspirational value comes from its premium reputation and longstanding association with visible, physique-focused results." },
  { icon: Trophy, title: 'Award-Winning Fitness Method', body: "Global recognition and premium studio positioning reinforce the method's credibility, quality, and consistency across locations." },
  { icon: UserCheck, title: 'Expert-Led, Hands-On Coaching', body: 'Highly trained & certified instructors actively correct form, guide alignment, and ensure every movement is effective and safe.' },
  { icon: ListChecks, title: 'Structured, Progressive Programming', body: 'Each class follows a designed structure that builds strength, endurance, and control over time - no random workouts, just consistent progress.' },
  { icon: Users, title: 'Strong Community and Accountability', body: 'A supportive boutique environment helps members stay motivated, consistent, and emotionally connected to their fitness routine.' },
];

export const NEXT_STEPS = [
  { title: 'You receive a guided confirmation', body: 'You hear back with the best-fit option, next steps, and booking details needed to secure your first class.' },
  { title: 'We help you prepare', body: "You'll know what to wear, when to arrive, and what to expect so your first visit feels effortless." },
  { title: 'Arrive ready for your first session', body: 'Walk in with clarity, confidence, and a format that suits your schedule, goals, and energy.' },
  { title: 'Feel the signature finish', body: 'Expect expert coaching, boutique energy, and the unmistakable shake that makes the method memorable from class one.' },
];

export const MARQUEE_FORMATS: Record<City, string[]> = {
  mumbai: ['Barre 57', 'FIT', 'Strength Lab', 'Mat 57', 'HIIT', 'powerCycle', 'Cardio Barre'],
  bengaluru: ['Barre 57', 'FIT', 'Mat 57', 'HIIT', 'Cardio Barre'],
};

export type ClassFormatInfo = { name: string; image: string; intensity: string; bestFor: string; description: string; duration: string; equipment: string };

// Keyed by the class formats forms can be built around.
export const CLASS_FORMAT_INFO: Record<string, ClassFormatInfo> = {
  Barre: {
    name: 'Barre', image: HERO_IMAGES[2], intensity: 'Beginner to intermediate', bestFor: 'All fitness levels, and your very first class', duration: '57 minutes',
    description: 'The signature fundamental barre class and cornerstone of the Physique 57 experience. Muscle-defining arm work, intense thigh and seat sequences, waist-chiseling ab work, and fluid stretches, built on the proprietary Interval Overload method - work a muscle group to fatigue, then immediately stretch it for relief and recovery.',
    equipment: 'Ballet barre, light dumbbells, resistance bands and loops, body weight',
  },
  'Strength Lab': {
    name: 'Strength Lab', image: HERO_IMAGES[4], intensity: 'Advanced (newcomer-friendly with prior strength experience)', bestFor: 'Building lean muscle and boosting metabolism', duration: '57 minutes',
    description: 'A comprehensive circuit format blending strength, core, mobility, and stretch work, built on principles of progressive overload. Can be done by a newcomer with relevant strength training experience from the past; otherwise start with barre or Studio FIT first.',
    equipment: 'Dumbbells, kettlebells, plyo boxes, pull-up bars, resistance bands',
  },
  powerCycle: {
    name: 'powerCycle', image: HERO_IMAGES[7], intensity: 'Open level, rider controlled', bestFor: 'Low-impact cardio, endurance, and strong lean legs', duration: '30 or 45 minutes',
    description: 'Rhythm-driven indoor cycling on Stages SC3 bikes that maps the beat of the music to the pedal stroke and emphasises meaningful resistance over pure speed. Tracks your watts, RPM, and kilometres ridden for measurable progress - low-impact cardio that builds cardiac and lung capacity without bulking your legs.',
    equipment: 'Stages SC3 indoor bikes with power meters; SPD cleat shoes provided',
  },
};

export type StudioInfo = { name: string; neighborhood: string; phone: string; hours: string; address: string };

// Keyed by the studio names used on forms and in Momence routing.
export const STUDIO_INFO: Record<string, StudioInfo> = {
  'Kwality House, Kemps Corner': { name: 'Kwality House, Kemps Corner', neighborhood: 'Grant Road, Mumbai', phone: '97696 65757', hours: 'Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM', address: 'Kwality House, August Kranti Rd, below Kemps Corner, Grant Road, Mumbai 400036' },
  'Supreme HQ, Bandra': { name: 'Supreme HQ, Bandra', neighborhood: 'Bandra West, Mumbai', phone: '97696 65757', hours: 'Mon-Sat: 6:00 AM - 9:00 PM | Sun: 7:00 AM - 7:00 PM', address: '203, Supreme Headquarters, Junction of 14th & 33rd Rd, opposite Monkey Bar, Bandra West, Mumbai 400050' },
  'Kenkere House, Bengaluru': { name: 'Kenkere House, Lavelle Road', neighborhood: 'Shanthala Nagar, Bengaluru', phone: '97696 65757', hours: 'Daily: 6:00 AM - 8:30 PM', address: '1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001' },
  'The Studio by Copper & Cloves, Bengaluru': { name: 'The Studio by Copper & Cloves, Indiranagar', neighborhood: 'Domlur, Bengaluru', phone: '97696 65757', hours: 'Daily: 6:00 AM - 8:00 PM', address: '4th Floor, 167, 2nd Stage, 2nd Cross, Shankarnag Rd, Domlur, Bengaluru, Karnataka 560071' },
  'Plash Pilates, Bengaluru': { name: 'Plash Pilates, Sadashivnagar', neighborhood: 'Vyalikaval, Bengaluru', phone: '97696 65757', hours: 'See the live schedule for current class timings', address: '72/14, 2nd Main Rd, next to namdharis fresh, Vyalikaval, Kodandarampura, Malleshwaram, Bengaluru, Karnataka 560003' },
};

export type FaqCategory = { title: string; items: { q: string; a: string }[] };

export const FAQS: Record<City, FaqCategory[]> = {
  "mumbai": [
    {
      "title": "Brand & Legacy",
      "items": [
        {
          "q": "What is Physique 57 and where did it come from?",
          "a": "Physique 57 is a boutique barre fitness brand founded in New York City in 2006 by Jennifer Vaughan Maanavi and Tanya Becker, reinventing the legendary Lotte Berk Method for a new generation. The studio debuted at 24 W. 57th Street in Manhattan, which is how the brand got its name."
        },
        {
          "q": "When did Physique 57 come to Mumbai?",
          "a": "Physique 57 India launched in Mumbai in January 2017, with the studio officially opening in April 2018, making it India's first barre workout studio."
        },
        {
          "q": "What awards has Physique 57 India won?",
          "a": "Physique 57 India was recognised in the Vogue Beauty Awards as one of the \"6 Best Brands in the Beauty Business\" in 2022, and has been featured across Vogue India, Architectural Digest, GQ India, and Grazia."
        },
        {
          "q": "What is the brand's philosophy?",
          "a": "\"Workout because you love your body, not because you hate it.\" Physique 57 exists to sculpt bodies and change lives through a welcoming, science-backed method - for every fitness level."
        }
      ]
    },
    {
      "title": "The Method",
      "items": [
        {
          "q": "What is the Physique 57 method?",
          "a": "A barre-based workout blending cardio, strength, and stretching using a ballet barre, light weights, and resistance bands to sculpt and tone the entire body in 57 minutes."
        },
        {
          "q": "What is Interval Overload?",
          "a": "Physique 57's proprietary, scientifically proven technique - isometric, repetitive movements taken to fatigue, immediately followed by a deep stretch for relief and recovery. It's repeated across every muscle group each class."
        },
        {
          "q": "Do I need any dance or barre experience?",
          "a": "No. The barre is used purely as a fitness apparatus, not a ballet tool - zero dance background is required. Every movement is taught from scratch by your instructor."
        },
        {
          "q": "Is Physique 57 a low-impact workout?",
          "a": "Yes. There's no jumping or high-impact movement, so it's easy on joints, while isometric holds and resistance still work muscles deeply for a genuinely high-intensity effect."
        },
        {
          "q": "Why are classes 57 minutes long?",
          "a": "Long enough for a complete, effective full-body workout, and short enough to fit a real schedule - every minute is choreographed with a purpose, right down to the final stretch."
        }
      ]
    },
    {
      "title": "Classes & Formats",
      "items": [
        {
          "q": "What class formats are offered in Mumbai?",
          "a": "Barre 57, Cardio Barre, Cardio Barre Plus, Studio FIT, HIIT, Mat 57, StrengthLab, Back Body Blaze, Recovery, and powerCycle - a full spread across cardio, strength, and recovery formats."
        },
        {
          "q": "What is Barre 57?",
          "a": "The signature fundamental barre class and the cornerstone of the Physique 57 experience - muscle-defining arm work, intense thigh and seat sequences, waist-chiselling ab work, and fluid stretches, all in 57 minutes."
        },
        {
          "q": "What is powerCycle?",
          "a": "Physique 57's rhythm-driven indoor cycling class on state-of-the-art bikes, mapping the beat of the music to the pedal stroke. It tracks your watts, RPM, and distance for measurable progress."
        },
        {
          "q": "Is there a class for children?",
          "a": "Yes - Physique 57 Juniors runs at the Kemps Corner and Bandra studios for ages 8-12, with 45-minute classes twice a week across a 12-week semester."
        },
        {
          "q": "What's the best class to start with?",
          "a": "Barre 57 is the ideal first class - it teaches the foundational barre moves and the Interval Overload method that every other format builds on. Mat 57 and Recovery are gentle alternatives if you'd rather ease in."
        }
      ]
    },
    {
      "title": "Trainers, Safety & Results",
      "items": [
        {
          "q": "How are Physique 57 instructors trained?",
          "a": "Instructors go through one of the most rigorous training programmes in Indian fitness - competitive auditions, intensive choreography training, and technical critiques, certified over 3 months directly by the brand's team."
        },
        {
          "q": "Can instructors modify for injuries or pregnancy?",
          "a": "Yes. Instructors are trained to provide modifications for spinal, knee, shoulder, and joint concerns, as well as prenatal and postnatal adaptations, from the very first class."
        },
        {
          "q": "How quickly will I see results?",
          "a": "Most clients notice visible changes within 8 classes. A 2010 Adelphi University Human Performance Laboratory study found significant body composition improvements in participants training four times a week over a month."
        },
        {
          "q": "Is the method scientifically validated?",
          "a": "Yes - the Adelphi University training study evaluated the Physique 57 method directly, confirming meaningful gains in fitness and body composition within just weeks of consistent attendance."
        },
        {
          "q": "How often should I attend to see results?",
          "a": "We recommend 3-4 classes a week. Even on consecutive days, the built-in stretching helps recovery, so there's no need to worry about overtraining."
        }
      ]
    },
    {
      "title": "Getting Started & Community",
      "items": [
        {
          "q": "What is the Newcomers offer in Mumbai?",
          "a": "First-time members can book the Newcomers 2-for-1 package - two classes for the price of one - a great way to try the method before committing to a larger package."
        },
        {
          "q": "What is the cancellation policy?",
          "a": "Cancellations must be made via email, WhatsApp, or the Physique 57 app at least 12 hours before the scheduled class start time. Late cancellations may deduct the class from your package."
        },
        {
          "q": "How early should I arrive?",
          "a": "Arrive before the scheduled start time so there's enough time for check-in and setup - instructors like to greet you before class begins."
        },
        {
          "q": "What should I bring?",
          "a": "Bring water, grip socks if you prefer them, and comfortable activewear that lets you move freely. All other equipment is provided at the studio."
        },
        {
          "q": "How do I stay connected with the studio?",
          "a": "Follow @physique57india on Instagram and Facebook, and subscribe to the newsletter for class updates, offers, and events like Self Care Saturday."
        },
        {
          "q": "How can I contact the studio?",
          "a": "Email info@physique57india.com, call or WhatsApp +91 97696 65757, or visit one of the Mumbai studios directly - the team is always happy to help."
        }
      ]
    }
  ],
  "bengaluru": [
    {
      "title": "Brand & Legacy",
      "items": [
        {
          "q": "What is Physique 57 and where did it come from?",
          "a": "Physique 57 is a boutique barre fitness brand founded in New York City in 2006 by Jennifer Vaughan Maanavi and Tanya Becker, reinventing the legendary Lotte Berk Method for a new generation. The studio debuted at 24 W. 57th Street in Manhattan, which is how the brand got its name."
        },
        {
          "q": "When did Physique 57 come to Bengaluru?",
          "a": "Physique 57 expanded to Bengaluru in 2021, bringing India's first barre workout format to the city across the Lavelle Road and Indiranagar studios."
        },
        {
          "q": "What awards has Physique 57 India won?",
          "a": "Physique 57 India was recognised in the Vogue Beauty Awards as one of the \"6 Best Brands in the Beauty Business\" in 2022, and has been featured across Vogue India, Architectural Digest, GQ India, and Grazia."
        },
        {
          "q": "What is the brand's philosophy?",
          "a": "\"Workout because you love your body, not because you hate it.\" Physique 57 exists to sculpt bodies and change lives through a welcoming, science-backed method - for every fitness level."
        }
      ]
    },
    {
      "title": "The Method",
      "items": [
        {
          "q": "What is the Physique 57 method?",
          "a": "A barre-based workout blending cardio, strength, and stretching using a ballet barre, light weights, and resistance bands to sculpt and tone the entire body in 57 minutes."
        },
        {
          "q": "What is Interval Overload?",
          "a": "Physique 57's proprietary, scientifically proven technique - isometric, repetitive movements taken to fatigue, immediately followed by a deep stretch for relief and recovery. It's repeated across every muscle group each class."
        },
        {
          "q": "Do I need any dance or barre experience?",
          "a": "No. The barre is used purely as a fitness apparatus, not a ballet tool - zero dance background is required. Every movement is taught from scratch by your instructor."
        },
        {
          "q": "Is Physique 57 a low-impact workout?",
          "a": "Yes. There's no jumping or high-impact movement, so it's easy on joints, while isometric holds and resistance still work muscles deeply for a genuinely high-intensity effect."
        },
        {
          "q": "Why are classes 57 minutes long?",
          "a": "Long enough for a complete, effective full-body workout, and short enough to fit a real schedule - every minute is choreographed with a purpose, right down to the final stretch."
        }
      ]
    },
    {
      "title": "Classes & Formats",
      "items": [
        {
          "q": "What class formats are offered in Bengaluru?",
          "a": "Bengaluru studios are Barre-first - every class is built around Physique 57's signature Barre format, so every booking gives you the full sculpting, toning method from your very first visit."
        },
        {
          "q": "What is Barre?",
          "a": "Barre is the signature Physique 57 workout with precise, controlled movements, isometric holds, and targeted strength exercises to sculpt, tone, and strengthen the whole body - no dance experience required."
        },
        {
          "q": "Is Bengaluru Barre-only?",
          "a": "Yes, for now - Lavelle Road and Indiranagar both focus on Barre-first bookings, giving new members a consistent, deep introduction to the method before other formats roll out."
        },
        {
          "q": "What's the best class to start with?",
          "a": "Your first Barre class doubles as your introduction to the Interval Overload method - instructors will walk you through every position, so there\\'s no separate \"beginner\" class needed."
        }
      ]
    },
    {
      "title": "Trainers, Safety & Results",
      "items": [
        {
          "q": "How are Physique 57 instructors trained?",
          "a": "Instructors go through one of the most rigorous training programmes in Indian fitness - competitive auditions, intensive choreography training, and technical critiques, certified over 3 months directly by the brand's team."
        },
        {
          "q": "Can instructors modify for injuries or pregnancy?",
          "a": "Yes. Instructors are trained to provide modifications for spinal, knee, shoulder, and joint concerns, as well as prenatal and postnatal adaptations, from the very first class."
        },
        {
          "q": "How quickly will I see results?",
          "a": "Most clients notice visible changes within 8 classes. A 2010 Adelphi University Human Performance Laboratory study found significant body composition improvements in participants training four times a week over a month."
        },
        {
          "q": "Is the method scientifically validated?",
          "a": "Yes - the Adelphi University training study evaluated the Physique 57 method directly, confirming meaningful gains in fitness and body composition within just weeks of consistent attendance."
        },
        {
          "q": "How often should I attend to see results?",
          "a": "We recommend 3-4 classes a week. Even on consecutive days, the built-in stretching helps recovery, so there's no need to worry about overtraining."
        }
      ]
    },
    {
      "title": "Getting Started & Community",
      "items": [
        {
          "q": "What is the Bengaluru intro offer?",
          "a": "New members get 50% off their first class at Lavelle Road, or the Copper + Cloves single-class package at Indiranagar - the easiest way to feel the method before booking a full package."
        },
        {
          "q": "What is the cancellation policy?",
          "a": "Cancellation rules follow the studio's standard booking policy - check the app or ask the front desk to confirm the notice window before your class."
        },
        {
          "q": "How early should I arrive?",
          "a": "Arrive before class starts so there's time for check-in, studio guidance, and a calm start - especially important for your very first Barre class."
        },
        {
          "q": "What should I bring?",
          "a": "Wear comfortable activewear and bring water. Grip socks can help if you like extra stability during class; everything else is provided at the studio."
        },
        {
          "q": "How do I stay connected with the studio?",
          "a": "Follow @physique57india on Instagram and Facebook, and subscribe to the newsletter for class updates, offers, and studio events."
        },
        {
          "q": "How can I contact the studio?",
          "a": "Email info@physique57bengaluru.com, call or WhatsApp +91 97696 65757, or visit Lavelle Road or Indiranagar directly - the team is always happy to help."
        }
      ]
    }
  ]
};

// Live Momence reviews widget feed (public, signed by Momence). Mumbai has no feed configured yet.
export const REVIEWS_FEEDS: Partial<Record<City, string>> = {
  bengaluru: 'https://api.momence.com/host-plugins/host/33905/reviews?pageSize=12&page=0&isFullLastNameVisible=false&isTextOnlyEnabled=true&isSessionAndTeacherInfoEnabled=true&s=959604fd4a03ccec0aaf901acf989c81a4ce3ab9a7e4e4325f0dc469ac918f94',
};
