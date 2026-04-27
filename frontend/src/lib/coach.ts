// Coach Bot motivational lines computed locally — no LLM call.
// The voice is grounded, not gimmicky: data-aware, brief, encouraging.

interface CoachInputs {
  pendingCount: number;
  doneCount: number;
  totalToday: number;
  currentStreak: number;
  bestStreak: number;
  hourOfDay: number;
}

export interface CoachQuote {
  headline: string;
  body: string;
}

const HEADLINES_DONE = [
  "All clear today.",
  "That's the day. Done.",
  "Streak protected.",
  "Discipline showed up.",
];

const HEADLINES_HALF = [
  "Halfway done. Keep going.",
  "Momentum is with you.",
  "You're on the wagon today.",
  "Showing up. Stay with it.",
];

const HEADLINES_PENDING = [
  "The day's not over.",
  "Still time to ship.",
  "Show up before you're tired.",
  "Don't let perfect kill it.",
];

const HEADLINES_NIGHT = [
  "Last call before midnight.",
  "Fifteen minutes can save the streak.",
];

const HEADLINES_NO_CHANNELS = [
  "Welcome aboard.",
  "Let's get rolling.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function computeCoachQuote(inputs: CoachInputs): CoachQuote {
  const { pendingCount, doneCount, totalToday, currentStreak, bestStreak, hourOfDay } = inputs;

  // Stable across the same minute so the quote doesn't shuffle on every render
  const seed = Math.floor(Date.now() / 60_000);

  if (totalToday === 0) {
    return {
      headline: pick(HEADLINES_NO_CHANNELS, seed),
      body: "Join a server or create one to start tracking a daily habit with your crew.",
    };
  }

  if (pendingCount === 0) {
    let body = "All your check-ins are in.";
    if (currentStreak >= 30) body = `${currentStreak} days running. You've made this a habit.`;
    else if (currentStreak >= 7) body = `${currentStreak} days in a row. Don't underestimate this.`;
    else if (currentStreak >= 3) body = `${currentStreak}-day streak going. Keep showing up tomorrow.`;
    else body = "Now go rest. Tomorrow's the next checkpoint.";
    return { headline: pick(HEADLINES_DONE, seed), body };
  }

  // Late evening pressure
  if (hourOfDay >= 21 && pendingCount > 0) {
    return {
      headline: pick(HEADLINES_NIGHT, seed),
      body:
        currentStreak >= 3
          ? `Don't lose a ${currentStreak}-day streak to a busy day. One quick check-in is enough.`
          : `One quick check-in is all the streak needs.`,
    };
  }

  // Half done
  if (doneCount > 0 && doneCount >= Math.ceil(totalToday / 2)) {
    return {
      headline: pick(HEADLINES_HALF, seed),
      body: `${doneCount} of ${totalToday} down. Knock out the rest before the day slips.`,
    };
  }

  // Mostly pending
  let body = `${pendingCount} of ${totalToday} channel${totalToday === 1 ? "" : "s"} still need a check-in today.`;
  if (currentStreak >= 7) {
    body = `${pendingCount} pending. Don't break a ${currentStreak}-day streak today.`;
  } else if (bestStreak >= 7 && currentStreak < 3) {
    body = `${pendingCount} pending. You hit ${bestStreak} days before — you can do it again.`;
  } else if (hourOfDay < 11) {
    body = `${pendingCount} pending. Quietest part of the day is the best time to start.`;
  }

  return {
    headline: pick(HEADLINES_PENDING, seed),
    body,
  };
}
