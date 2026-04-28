// Coach Bot quote bank — attributed quotes from public-domain / widely-cited
// sources, curated to match the user's current accountability state.
//
// The Coach surfaces a single quote on the dashboard. State buckets are picked
// from the user's data (streak, pending count, time of day) so the quote feels
// responsive instead of random.

interface CoachInputs {
  pendingCount: number;
  doneCount: number;
  totalToday: number;
  currentStreak: number;
  bestStreak: number;
  hourOfDay: number;
}

export interface CoachQuote {
  /** The quote text itself, verbatim. */
  headline: string;
  /** Attribution, in the form "— Author Name". */
  body: string;
}

interface QuoteTemplate {
  headline: string;
  body: string;
}

type CoachState =
  | "no_channels"
  | "all_done_high" // streak ≥ 30
  | "all_done_med" // streak 7–29
  | "all_done_low" // streak 3–6
  | "all_done_basic" // streak 0–2
  | "late_pending" // after 21:00 with pending
  | "half_done" // ≥ 50% done, some pending
  | "morning_fresh" // before 11:00 with pending
  | "streak_protect" // streak ≥ 7 with pending
  | "comeback" // current 0, best ≥ 7
  | "generic_pending"; // fallback

// Q = quick literal helper to keep the data dense.
const Q = (q: string, a: string): QuoteTemplate => ({ headline: q, body: `— ${a}` });

const QUOTES: Record<CoachState, QuoteTemplate[]> = {
  no_channels: [
    Q("A journey of a thousand miles begins with a single step.", "Lao Tzu"),
    Q("Well begun is half done.", "Aristotle"),
    Q("The secret of getting ahead is getting started.", "Mark Twain"),
    Q("Begin, be bold, and venture to be wise.", "Horace"),
    Q("It does not matter how slowly you go, so long as you do not stop.", "Confucius"),
    Q("The best time to plant a tree was twenty years ago. The second best time is now.", "Chinese proverb"),
    Q("Begin at once to live, and count each separate day as a separate life.", "Seneca"),
    Q("You may delay, but time will not.", "Benjamin Franklin"),
  ],

  all_done_high: [
    Q("We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant"),
    Q("First we make our habits, then our habits make us.", "John Dryden"),
    Q("Quality is not an act, it is a habit.", "Aristotle"),
    Q("The chains of habit are too light to be felt until they are too heavy to be broken.", "Samuel Johnson"),
    Q("Discipline is the bridge between goals and accomplishment.", "Jim Rohn"),
    Q("Discipline equals freedom.", "Jocko Willink"),
    Q("Continuous effort — not strength or intelligence — is the key to unlocking our potential.", "Winston Churchill"),
    Q("It is in your power to withdraw yourself whenever you desire. Perfect tranquility consists in good order of the mind.", "Marcus Aurelius"),
    Q("You will never change your life until you change something you do daily.", "John C. Maxwell"),
    Q("Energy and persistence conquer all things.", "Benjamin Franklin"),
    Q("Habits are the compound interest of self-improvement.", "James Clear"),
  ],

  all_done_med: [
    Q("The successful warrior is the average man, with laser-like focus.", "Bruce Lee"),
    Q("Motivation is what gets you started. Habit is what keeps you going.", "Jim Ryun"),
    Q("Persistence is to the character of man as carbon is to steel.", "Napoleon Hill"),
    Q("It's not what we do once in a while that shapes our lives, but what we do consistently.", "Tony Robbins"),
    Q("Small disciplines repeated with consistency every day lead to great achievements.", "John C. Maxwell"),
    Q("Don't measure yourself by what you have accomplished, but by what you should have accomplished with your ability.", "John Wooden"),
    Q("The successful person makes a habit of doing what the failing person doesn't like to do.", "Thomas Edison"),
    Q("Action is the foundational key to all success.", "Pablo Picasso"),
    Q("How we spend our days is, of course, how we spend our lives.", "Annie Dillard"),
    Q("The harder I work, the luckier I get.", "Samuel Goldwyn"),
  ],

  all_done_low: [
    Q("Do what you can, with what you have, where you are.", "Theodore Roosevelt"),
    Q("It always seems impossible until it's done.", "Nelson Mandela"),
    Q("Concentrate every minute on doing what's in front of you with rigorous concentration, with dignity.", "Marcus Aurelius"),
    Q("The journey of a thousand miles begins with a single step.", "Lao Tzu"),
    Q("Don't watch the clock; do what it does. Keep going.", "Sam Levenson"),
    Q("Start where you are. Use what you have. Do what you can.", "Arthur Ashe"),
    Q("Step by step. I can't see any other way of accomplishing anything.", "Michael Jordan"),
    Q("If you fell down yesterday, stand up today.", "H. G. Wells"),
    Q("Patience and perseverance have a magical effect before which difficulties disappear.", "John Quincy Adams"),
  ],

  all_done_basic: [
    Q("Every accomplishment starts with the decision to try.", "John F. Kennedy"),
    Q("The best way out is always through.", "Robert Frost"),
    Q("Either you run the day or the day runs you.", "Jim Rohn"),
    Q("Begin doing what you want to do now.", "Marie Beynon Ray"),
    Q("Action will delineate and define you.", "Thomas Jefferson"),
    Q("Done is better than perfect.", "Sheryl Sandberg"),
    Q("Whether you think you can, or you think you can't — you're right.", "Henry Ford"),
    Q("Whatever you can do, or dream you can, begin it. Boldness has genius, power, and magic in it.", "attributed to Goethe"),
  ],

  half_done: [
    Q("The best way out is always through.", "Robert Frost"),
    Q("Do not stop thinking of life as an adventure. You have no security unless you can live bravely, excitingly.", "Eleanor Roosevelt"),
    Q("It is during our darkest moments that we must focus to see the light.", "Aristotle"),
    Q("Fall seven times, stand up eight.", "Japanese proverb"),
    Q("If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.", "Martin Luther King Jr."),
    Q("Don't quit. Suffer now and live the rest of your life as a champion.", "Muhammad Ali"),
    Q("It does not matter how slowly you go as long as you do not stop.", "Confucius"),
    Q("The journey is the reward.", "Steve Jobs"),
    Q("Never give up, for that is just the place and time that the tide will turn.", "Harriet Beecher Stowe"),
  ],

  late_pending: [
    Q("Lost time is never found again.", "Benjamin Franklin"),
    Q("It is not that we have a short time to live, but that we waste a lot of it.", "Seneca"),
    Q("How long are you going to wait before you demand the best of yourself?", "Epictetus"),
    Q("Time is the most valuable thing a man can spend.", "Theophrastus"),
    Q("You may delay, but time will not.", "Benjamin Franklin"),
    Q("We must use time as a tool, not as a couch.", "John F. Kennedy"),
    Q("Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.", "Mother Teresa"),
    Q("Either I will find a way, or I will make one.", "Philip Sidney"),
    Q("Procrastination is the thief of time.", "Edward Young"),
  ],

  morning_fresh: [
    Q("Lose an hour in the morning, and you will spend all day looking for it.", "Richard Whately"),
    Q("Each morning we are born again. What we do today is what matters most.", "Buddha"),
    Q("When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.", "Marcus Aurelius"),
    Q("Either you run the day or the day runs you.", "Jim Rohn"),
    Q("The early morning has gold in its mouth.", "Benjamin Franklin"),
    Q("First thing every morning, before you arise, say out loud, 'I believe.'", "Ovid"),
    Q("Begin at once to live.", "Marcus Aurelius"),
    Q("The breeze at dawn has secrets to tell you. Don't go back to sleep.", "Rumi"),
  ],

  streak_protect: [
    Q("The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius"),
    Q("We suffer more often in imagination than in reality.", "Seneca"),
    Q("Energy and persistence conquer all things.", "Benjamin Franklin"),
    Q("Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"),
    Q("Patience and perseverance have a magical effect before which difficulties disappear.", "John Quincy Adams"),
    Q("It is not the mountain we conquer, but ourselves.", "Edmund Hillary"),
    Q("He who has a why to live for can bear almost any how.", "Friedrich Nietzsche"),
    Q("Do not let your fire go out, spark by irreplaceable spark.", "Ayn Rand"),
    Q("The greatest weapon against stress is our ability to choose one thought over another.", "William James"),
    Q("Never, never, never give up.", "Winston Churchill"),
  ],

  comeback: [
    Q("You will face many defeats in life, but never let yourself be defeated.", "Maya Angelou"),
    Q("Our greatest glory is not in never falling, but in rising every time we fall.", "Confucius"),
    Q("Fall seven times, stand up eight.", "Japanese proverb"),
    Q("Every strike brings me closer to the next home run.", "Babe Ruth"),
    Q("I have not failed. I've just found 10,000 ways that won't work.", "Thomas Edison"),
    Q("It does not matter how slowly you go, as long as you do not stop.", "Confucius"),
    Q("The phoenix must burn to emerge.", "Janet Fitch"),
    Q("Do not be ashamed of mistakes and thus turn them into crimes.", "Confucius"),
    Q("Success is going from failure to failure without losing your enthusiasm.", "Winston Churchill"),
    Q("When you come to the end of your rope, tie a knot and hang on.", "Franklin D. Roosevelt"),
  ],

  generic_pending: [
    Q("Action is the foundational key to all success.", "Pablo Picasso"),
    Q("If you spend too much time thinking about a thing, you'll never get it done.", "Bruce Lee"),
    Q("It always seems impossible until it's done.", "Nelson Mandela"),
    Q("Start by doing what's necessary; then do what's possible; and suddenly you are doing the impossible.", "Francis of Assisi"),
    Q("Whether you think you can, or you think you can't — you're right.", "Henry Ford"),
    Q("The best way to predict the future is to create it.", "Peter Drucker"),
    Q("In the middle of difficulty lies opportunity.", "Albert Einstein"),
    Q("Done is better than perfect.", "Sheryl Sandberg"),
    Q("The way to get started is to quit talking and begin doing.", "Walt Disney"),
    Q("If not now, when?", "Hillel the Elder"),
    Q("It's not whether you get knocked down, it's whether you get up.", "Vince Lombardi"),
  ],
};

function detectState(inputs: CoachInputs): CoachState {
  const { pendingCount, doneCount, totalToday, currentStreak, bestStreak, hourOfDay } = inputs;

  if (totalToday === 0) return "no_channels";

  if (pendingCount === 0) {
    if (currentStreak >= 30) return "all_done_high";
    if (currentStreak >= 7) return "all_done_med";
    if (currentStreak >= 3) return "all_done_low";
    return "all_done_basic";
  }

  if (hourOfDay >= 21) return "late_pending";
  if (currentStreak >= 7) return "streak_protect";
  if (currentStreak === 0 && bestStreak >= 7) return "comeback";
  if (doneCount > 0 && doneCount >= Math.ceil(totalToday / 2)) return "half_done";
  if (hourOfDay < 11) return "morning_fresh";
  return "generic_pending";
}

// 5-minute seed: rotates often enough to feel alive but stable across quick re-renders.
function timeSeed(): number {
  return Math.floor(Date.now() / 300_000);
}

function quoteAt(state: CoachState, offset: number): CoachQuote {
  const pool = QUOTES[state];
  // Combine the time seed with the state name so different states never collide
  // on the same index — keeps the pool fully utilized.
  const stateSeed = state.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const idx = (timeSeed() + stateSeed + offset) % pool.length;
  const tpl = pool[idx];
  return { headline: tpl.headline, body: tpl.body };
}

export function computeCoachQuote(inputs: CoachInputs, offset = 0): CoachQuote {
  return quoteAt(detectState(inputs), offset);
}

export function poolSizeForInputs(inputs: CoachInputs): number {
  return QUOTES[detectState(inputs)].length;
}

// Total quote count across all states — useful for debug surfaces.
export const TOTAL_QUOTE_COUNT = Object.values(QUOTES).reduce((s, p) => s + p.length, 0);

// Exposed for tests / debugging.
export const _internals = { QUOTES, detectState };
