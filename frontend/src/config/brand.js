// Single source of truth for user-visible product identity and copy.
// White-labelling / de-branding = edit this file (or set VITE_APP_NAME at build time).
//
// The strings below are intentionally generic so the app ships brand-neutral.
// Replace `name` (and, if you like, the copy blocks) to make it yours.

const envName = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_APP_NAME
  : undefined;

export const BRAND = {
  // The one product name that renders in the tab title, nav wordmark, and hero.
  name: envName || 'OpenAssess',

  // Guest landing (/quiz gate).
  gateTagline: 'How well do you know the material? Put it to the test.',
  gateFooter: 'Test your knowledge. Track your progress.',
  registerHint: 'New here? Register',

  // Authenticated start screen.
  startTagline: 'Ready when you are. Ten questions, one run.',
  startFooter: 'Ten questions, one run — choose carefully and learn from every miss.',

  // Question screen.
  questionLabel: 'Question',
  hintPhrases: [
    'Choose carefully — only one option is correct.',
    'Take your time; there is exactly one right answer.',
  ],

  // Result screen.
  resultTopicsSubline: 'Where you were confident — and where to focus next.',

  // Fallback category label when a question has no topic.
  defaultTopicLabel: 'General',
};

// Result-screen rank bands, highest threshold first. Neutral, configurable tiers.
export const RESULT_RANK_BANDS = [
  {
    min: 85,
    title: 'Expert',
    tagline: 'You have a firm command of the material.',
    lines: [
      'Your recall and instincts are well aligned.',
      'Review the debrief to lock in the edges.',
    ],
  },
  {
    min: 65,
    title: 'Proficient',
    tagline: 'A strong run with room to sharpen.',
    lines: [
      'Each miss is a clear signal for what to revisit.',
      'The debrief will close the remaining gaps.',
    ],
  },
  {
    min: 45,
    title: 'Developing',
    tagline: 'You are building the right habits.',
    lines: [
      'Open the debrief while the attempt is still fresh.',
      'Consistency comes from returning with questions.',
    ],
  },
  {
    min: 25,
    title: 'Beginner',
    tagline: 'Early attempts are meant to stretch you.',
    lines: [
      'Let the explanations settle before the next run.',
      'Speed follows clarity — walk the cards slowly once.',
    ],
  },
  {
    min: 0,
    title: 'Getting Started',
    tagline: 'Everyone starts somewhere.',
    lines: [
      'The debrief holds every correction you need.',
      'When you are ready, reset and try again.',
    ],
  },
];

/** Pick the rank band for a percentage score (0-100). */
export function resultRankBand(pct) {
  return (
    RESULT_RANK_BANDS.find((band) => pct >= band.min) ||
    RESULT_RANK_BANDS[RESULT_RANK_BANDS.length - 1]
  );
}
