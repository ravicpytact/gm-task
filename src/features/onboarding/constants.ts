// The welcome tour's steps, on the Dashboard (docs/08-frontend/README.md §4b). Each points at a part
// of the screen by a stable attribute; a step whose target is not on screen is left out.

export type TourStep = {
  /** CSS selector of the part to point at; the first visible match is used. */
  target: string;
  title: string;
  description: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="kpis"]',
    title: "Your pending Todos",
    description:
      "One card per frequency shows what is still to do for the day. Tap a card to see only those Todos.",
  },
  {
    target: '[data-tour="todo-list"]',
    title: "Answer your Todos",
    description:
      "Answer each Todo right here: tap Yes or No, a choice, or enter a value. Answers can't be changed afterwards.",
  },
  {
    target: '[data-tour="date-pill"]',
    title: "Pick another day",
    description:
      "Open the calendar to see any day. Missed days are red, so you can catch up on them.",
  },
  {
    target: '[data-nav="/history"]',
    title: "History and Report",
    description: "See what you have answered in History, and how you are doing in Report.",
  },
  {
    target: '[aria-label^="Account menu"]',
    title: "Your account",
    description:
      "Your profile and password, and Appearance: light or dark mode and your colour theme.",
  },
];
