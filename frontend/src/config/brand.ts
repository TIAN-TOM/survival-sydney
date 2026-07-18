// Single source of truth for user-visible product identity and copy.
// Survival Sydney is a quiz that helps international students handle real life
// in Sydney. Rename it (or set VITE_APP_NAME at build time) to white-label.

const envName = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_APP_NAME
  : undefined;

export const BRAND = {
  // The one product name that renders in the tab title, nav wordmark, and hero.
  name: envName || 'Survival Sydney',

  // Guest landing (/quiz gate).
  gateTagline: "New to Sydney? Find out if you're ready for real life here.",
  gateFooter: 'The things nobody tells international students before they land.',
  registerHint: 'New in town? Register',

  // Authenticated start screen.
  startTagline: 'Ten questions on surviving Sydney. Ready when you are.',
  startFooter: 'Ten real situations: transport, renting, work rights, safety. Learn from every miss.',

  // Question screen.
  questionLabel: 'Question',
  hintPhrases: [
    'One right answer — pick the safest move.',
    'Only one option is correct. Think like a local.',
  ],

  // Result screen.
  resultTopicsSubline: 'Where you would cope, and where Sydney might catch you out.',

  // Fallback category label when a question has no topic.
  defaultTopicLabel: 'General',
};

/** One result-screen rank tier: applies when the percentage score is >= `min`. */
export interface ResultRankBand {
  min: number;
  title: string;
  tagline: string;
  lines: string[];
}

// Result-screen rank bands, highest threshold first. Sydney-survival tiers;
// only the copy is themed — the score thresholds stay fixed.
export const RESULT_RANK_BANDS: ResultRankBand[] = [
  {
    min: 85,
    title: 'Local Legend',
    tagline: 'You could write the survival guide yourself.',
    lines: [
      'Transport, tenancy, work rights — you have the lot down.',
      'Skim the debrief to lock in the last few edge cases.',
    ],
  },
  {
    min: 65,
    title: 'Settled In',
    tagline: 'You know your way around Sydney.',
    lines: [
      'A strong run with a couple of gaps to tidy up.',
      'Each miss points at exactly what to check next.',
    ],
  },
  {
    min: 45,
    title: 'Getting By',
    tagline: 'You would manage, with a few close calls.',
    lines: [
      'The basics are there; the details still trip you up.',
      'Read the debrief while the questions are fresh.',
    ],
  },
  {
    min: 25,
    title: 'Fresh Off the Plane',
    tagline: 'Sydney still has plenty of surprises for you.',
    lines: [
      'Plenty to learn before the city stops catching you out.',
      'Walk through the explanations slowly, one by one.',
    ],
  },
  {
    min: 0,
    title: 'Just Landed',
    tagline: 'Everyone starts somewhere. Welcome to Sydney.',
    lines: [
      'The debrief has every answer you just missed.',
      'Reset and run it again when you are ready.',
    ],
  },
];

/** Pick the rank band for a percentage score (0-100). */
export function resultRankBand(pct: number): ResultRankBand {
  return (
    RESULT_RANK_BANDS.find((band) => pct >= band.min) ||
    RESULT_RANK_BANDS[RESULT_RANK_BANDS.length - 1]
  );
}
