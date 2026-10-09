// Runs tools/leaderboard/Code.gs in Node, with in-memory stand-ins for the
// Apps Script services it uses: a Sheet, the script cache, the script
// properties and the lock. Each call gives a fresh, empty "spreadsheet".
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../tools/leaderboard/Code.gs', import.meta.url), 'utf8');

function fakeSheet() {
  const rows = [];
  return {
    rows,
    getRange(row, col, numRows, numCols) {
      return {
        setValues(values) {
          values.forEach((v, i) => (rows[row - 1 + i] = [...v]));
          return this;
        },
        setFontWeight() {
          return this;
        },
        setNumberFormat() {
          return this;
        },
      };
    },
    getDataRange() {
      return { getValues: () => rows.map((r) => [...r]) };
    },
    appendRow(row) {
      rows.push([...row]);
    },
    setFrozenRows() {},
  };
}

export function loadCodeGs({ today = '2026-10-09' } = {}) {
  const sheets = {};
  const cache = new Map();
  const props = new Map();
  const ss = {
    getSheetByName: (name) => sheets[name] ?? null,
    insertSheet: (name) => (sheets[name] = fakeSheet()),
  };
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => cache.get(k) ?? null,
        put: (k, v) => cache.set(k, v),
        remove: (k) => cache.delete(k),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props.get(k) ?? null,
        setProperties: (o) => Object.entries(o).forEach(([k, v]) => props.set(k, v)),
      }),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (body) => ({ body, setMimeType() { return this; } }),
    },
    Utilities: { formatDate: () => today },
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  context.setup();

  const parse = (out) => JSON.parse(out.body);
  return {
    gs: context, // the script's globals: NICKNAME, MAX_SCORE, best...
    sheet: sheets[context.SHEET],
    props,
    get: () => parse(context.doGet()),
    post: (body) => parse(context.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } })),
  };
}
