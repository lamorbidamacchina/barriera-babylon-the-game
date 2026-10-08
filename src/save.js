// Progress saved in the browser. Storage can be unavailable (private mode,
// blocked site data): every access is guarded and the game works without it.
const KEY = 'barriera-babylon';

export function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore: progress just won't persist
  }
}
