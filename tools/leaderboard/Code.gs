/** @OnlyCurrentDoc */
// ^ the script can only open the Sheet it belongs to, not the owner's other files.

// Barriera Babylon leaderboard: a Google Sheet behind an Apps Script web app.
// Not part of the build. The game reads and writes it from src/leaderboard.js.
//
// Setup, once:
// 1. New Google Sheet → Extensions → Apps Script, paste this file, save.
// 2. Run `setup` from the editor (creates the `records` sheet; asks for permissions).
// 3. Deploy → New deployment → Web app: execute as Me, access Anyone. Copy the /exec URL.
// 4. Paste it into ENDPOINT in src/leaderboard.js and publish the game.
// After changing this file: Manage deployments → Edit → New version (same URL).
//
// GET  → { contrabbando: { "0": { nickname, score }, ... }, ... }  best per level
// POST → body (text/plain, JSON) { game, level, nickname, score }; returns the same as GET
//
// The web app URL is public (it's in the game's code), so anyone can POST to
// it. To keep the Sheet small whatever they send: one row per level, replaced
// only when the record is beaten, scores capped per game, and a daily limit on
// writes. Fixing a fake record = editing (or deleting) its row in the Sheet;
// the change shows in the game within CACHE_SECONDS.

// Highest believable score per game. A fake record can't go above it, so a
// real player can always beat it. Raise it if a game's scoring changes.
var MAX_SCORE = {
  contrabbando: 20000, // ~15 per vegetable + combos + 5 per second left
  muro: 40000, // ~1 per cell of Muro, up to x4 for big cuts, + end bonuses
  ferri: 1000000,
  ruspe: 1000000,
};
var MAX_LEVEL = 50;
var MAX_WRITES_PER_DAY = 300; // all games together; real records are a few a day
var NICKNAME = /^[A-Z0-9 _.\-!']{1,12}$/; // same rule as cleanNickname() in the game
var SHEET = 'records';
var CACHE_SECONDS = 600;

// Run once from the editor: creates the sheet with its header.
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  sheet.getRange(1, 1, 1, 5).setValues([['time', 'game', 'level', 'nickname', 'score']]).setFontWeight('bold');
  sheet.getRange('D:D').setNumberFormat('@'); // nicknames like 007 stay text
  sheet.setFrozenRows(1);
}

function doGet() {
  return json(best());
}

function doPost(e) {
  var r;
  try {
    r = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ error: 'bad json' });
  }
  var nickname = String(r.nickname || '').trim().toUpperCase();
  var valid =
    MAX_SCORE.hasOwnProperty(r.game) &&
    Number.isInteger(r.level) && r.level >= 0 && r.level < MAX_LEVEL &&
    Number.isInteger(r.score) && r.score > 0 && r.score <= MAX_SCORE[r.game] &&
    NICKNAME.test(nickname);
  if (!valid) return json({ error: 'invalid' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
    var rows = sheet.getDataRange().getValues();
    var at = -1; // sheet row of this level's record, 1-based
    var current = 0;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === r.game && Number(rows[i][2]) === r.level) {
        var score = Number(rows[i][4]);
        if (at < 0 || score > current) {
          at = i + 1;
          current = score;
        }
      }
    }
    // Not a record (someone beat it in the meantime): just answer with the
    // up-to-date records. Strictly greater: on a tie the first one keeps it.
    if (r.score <= current || !countWrite()) return json(best());

    var row = [new Date(), r.game, r.level, nickname, r.score];
    if (at > 0) sheet.getRange(at, 1, 1, 5).setValues([row]);
    else sheet.appendRow(row);
    CacheService.getScriptCache().remove('best');
  } finally {
    lock.releaseLock();
  }
  return json(best());
}

// Counts today's writes; false once the daily limit is reached.
function countWrite() {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd');
  var count = props.getProperty('writes-day') === today ? Number(props.getProperty('writes-count')) : 0;
  if (count >= MAX_WRITES_PER_DAY) return false;
  props.setProperties({ 'writes-day': today, 'writes-count': String(count + 1) });
  return true;
}

function best() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('best');
  if (hit) return JSON.parse(hit);

  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET).getDataRange().getValues().slice(1);
  var out = {};
  rows.forEach(function (row) {
    var game = row[1], level = row[2], nickname = String(row[3]), score = Number(row[4]);
    if (!game || !(score > 0)) return;
    var g = (out[game] = out[game] || {});
    if (!g[level] || score > g[level].score) g[level] = { nickname: nickname, score: score };
  });
  cache.put('best', JSON.stringify(out), CACHE_SECONDS);
  return out;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
