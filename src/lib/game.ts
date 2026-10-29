import { Country, GameMode, GameSettings } from '../types/game';
import { COUNTRIES } from '../data/countries';

// Accepted alternate spellings for capitals, keyed by country code
const CAPITAL_ALIASES: Record<string, string[]> = {
  UKR: ['Kiev'],
  IND: ['Delhi'],
  USA: ['Washington', 'Washington DC'],
  KAZ: ['Nur-Sultan'],
  MMR: ['Nay Pyi Taw', 'Naypyitaw'],
  LKA: ['Kotte', 'Colombo'],
  BOL: ['La Paz'],
  ZAF: ['Cape Town', 'Bloemfontein'],
};

// Lowercase, strip accents/punctuation, collapse whitespace, drop a leading "the"
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');

export const compact = (s: string) => normalize(s).replace(/\s+/g, '');

export const answerFor = (country: Country, mode: GameMode) =>
  mode === 'capitals' ? country.capital : country.name;

export const isCorrectAnswer = (country: Country, mode: GameMode, input: string) => {
  const query = normalize(input);
  if (!query) return false;
  const compactQuery = compact(input);

  const accepted =
    mode === 'capitals'
      ? [country.capital, ...(CAPITAL_ALIASES[country.code] ?? [])]
      : [country.name, ...country.aliases];

  // 1. Direct or compact match (handles accents, apostrophes, and spacing variants)
  if (accepted.some((a) => normalize(a) === query || compact(a) === compactQuery)) {
    return true;
  }

  // 2. Shorthand prefix/suffix matching for multi-word country names (min 4 chars)
  // e.g. "bosnia" -> "Bosnia and Herz.", "antarctic lands" -> "Fr. S. Antarctic Lands",
  // "trinidad" -> "Trinidad and Tobago", "falkland" -> "Falkland Is."
  if (mode !== 'capitals' && query.length >= 4) {
    for (const a of accepted) {
      const normA = normalize(a);
      if (
        normA.startsWith(query + ' ') ||
        normA.startsWith(query + ' and') ||
        normA.endsWith(' ' + query)
      ) {
        return true;
      }
    }
  }

  return false;
};

// 'Americas' covers both North and South America in the data
export const matchesContinent = (country: Country, continent: string) =>
  continent === 'all' ||
  country.continent === continent ||
  (continent === 'Americas' && country.continent.endsWith('America'));

// Territories that fly another country's flag (N. Cyprus, Somaliland) — ambiguous in flags mode
const SHARED_FLAGS = new Set(['CYN', 'SOL']);

// Countries playable under the given settings
export const getCountryPool = (settings: Pick<GameSettings, 'mode' | 'continent'>) =>
  COUNTRIES.filter(
    (c) =>
      c.continent !== 'Antarctica' &&
      (settings.mode !== 'capitals' || c.capital !== 'None') &&
      (settings.mode !== 'flags' || !SHARED_FLAGS.has(c.code)) &&
      matchesContinent(c, settings.continent)
  );

// Flag emoji is two regional-indicator letters -> ISO 3166 alpha-2 ("🇫🇯" -> "fj")
export const isoCode = (country: Country) =>
  [...country.flag].map((ch) => String.fromCharCode(ch.codePointAt(0)! - 0x1f1e6 + 97)).join('');

// SVG flag image (emoji flags don't render on Windows)
export const flagUrl = (country: Country) => `https://flagcdn.com/${isoCode(country)}.svg`;

// Seeded PRNG (mulberry32) so a run is reproducible from its seed
export const createRng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const newSeed = () => Math.floor(Math.random() * 0xffffffff);

export const formatSeed = (seed: number) => seed.toString(36).toUpperCase().padStart(7, '0');

// Fisher–Yates shuffle (unbiased), returns a new array
export const shuffle = <T>(items: readonly T[], rng: () => number = Math.random): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 3 wrong options, preferring the target's continent so MCQ isn't trivial
export const pickDistractors = (target: Country, mode: GameMode, rng: () => number = Math.random) => {
  const correct = normalize(answerFor(target, mode));
  const candidates = getCountryPool({ mode, continent: 'all' }).filter(
    (c) => c.code !== target.code && normalize(answerFor(c, mode)) !== correct
  );
  const sameContinent = shuffle(candidates.filter((c) => c.continent === target.continent), rng);
  const others = shuffle(candidates.filter((c) => c.continent !== target.continent), rng);
  return [...sameContinent, ...others].slice(0, 3).map((c) => answerFor(c, mode));
};
