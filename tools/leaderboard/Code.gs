// Barriera Babylon leaderboard: a Google Sheet behind an Apps Script web app.
// Not part of the build: paste it into the Sheet's Apps Script editor (see the
// README, "Classifica"). The game reads and writes it from src/leaderboard.js.
//
// GET  → { contrabbando: { "0": { nickname, score }, ... }, ... }  best per level
// POST → body (text/plain, JSON) { game, level, nickname, score }; returns the same as GET
//
// Every submission is a row (time, game, level, nickname, score); the best per
// level is the highest score, the earliest on a tie. Deleting a row in the
// Sheet removes it from the leaderboard within CACHE_SECONDS.

var GAMES = ['contrabbando', 'muro', 'ferri', 'ruspe'];
var MAX_LEVEL = 50;
var MAX_SCORE = 1000000;
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
    GAMES.indexOf(r.game) >= 0 &&
    Number.isInteger(r.level) && r.level >= 0 && r.level < MAX_LEVEL &&
    Number.isInteger(r.score) && r.score > 0 && r.score <= MAX_SCORE &&
    NICKNAME.test(nickname);
  if (!valid) return json({ error: 'invalid' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET).appendRow([new Date(), r.game, r.level, nickname, r.score]);
    CacheService.getScriptCache().remove('best');
  } finally {
    lock.releaseLock();
  }
  return json(best());
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
    // Rows are in time order: strictly greater keeps the first to reach a score.
    if (!g[level] || score > g[level].score) g[level] = { nickname: nickname, score: score };
  });
  cache.put('best', JSON.stringify(out), CACHE_SECONDS);
  return out;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
