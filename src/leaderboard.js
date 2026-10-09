// Barriera records: the best score of each level of each minigame, with the
// player's nickname, kept in a Google Sheet (tools/leaderboard/Code.gs).
// The game never waits for it: records are fetched in the background, the last
// ones received are kept on the device, and submissions are fire-and-forget.
// Every failure is silent: the game just shows what it knows, or nothing.

// Apps Script web app URL (README, "Classifica"). Empty: no online records.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbywCMQx6oQ10iugHzDAeDaCuhg2fb-37tZscWSbL-LNNpSCxWWFFtsxjzMfgpQj41_w-w/exec';

const CACHE_KEY = 'barriera-babylon-records';
const REFRESH_MS = 30_000; // don't ask again more often than this
const TIMEOUT_MS = 20_000; // Apps Script often takes 5-10 s; nobody waits for it

export const NICKNAME_MAX = 12;

// { [game]: { [level]: { nickname, score } } }, or null until known.
let records = readCache();
let lastFetch = 0;
let fetching = false;
let version = 0; // bumped by every local change: older fetches don't overwrite it
const listeners = new Set();

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function update(data) {
  records = data;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // keep them in memory only
  }
  listeners.forEach((fn) => fn());
}

function isRecords(data) {
  return data && typeof data === 'object' && !Array.isArray(data) && !data.error;
}

// Starts a background refresh, unless one ran in the last few seconds.
export function refreshRecords() {
  if (!ENDPOINT || fetching || Date.now() - lastFetch < REFRESH_MS) return;
  fetching = true;
  lastFetch = Date.now();
  const v = version;
  fetch(ENDPOINT, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    .then((res) => res.json())
    .then((data) => {
      if (isRecords(data) && v === version) update(data);
    })
    .catch(() => {})
    .finally(() => (fetching = false));
}

// { nickname, score } for a level; null if nobody holds it yet;
// undefined if the records aren't known (offline on the first launch).
export function getRecord(game, level) {
  if (!records) return undefined;
  return records[game]?.[level] ?? null;
}

// Whether a score would become the new Barriera record. Only when the records
// are known: offline we can't tell, and the submission would fail anyway.
export function beatsRecord(game, level, score) {
  const r = getRecord(game, level);
  return r !== undefined && score > (r?.score ?? 0);
}

// Called with no arguments whenever the records change. Returns the unsubscribe.
export function onRecords(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Shows the new record right away, then sends it in the background. The
// server's answer (the up-to-date records) replaces the local guess.
export function submitRecord(game, level, nickname, score) {
  if (!ENDPOINT || !records) return;
  const v = ++version;
  update({ ...records, [game]: { ...records[game], [level]: { nickname, score } } });
  fetch(ENDPOINT, {
    method: 'POST',
    // text/plain keeps it a "simple" request: Apps Script can't answer a CORS preflight.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ game, level, nickname, score }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((res) => res.json())
    .then((data) => {
      if (isRecords(data) && v === version) update(data);
    })
    .catch(() => {});
}

// What the arcade cabinet accepts: unaccented capitals, digits and a few signs
// (the font draws accented capitals like lowercase). Same rule as Code.gs.
export function cleanNickname(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 _.\-!']/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, NICKNAME_MAX);
}
