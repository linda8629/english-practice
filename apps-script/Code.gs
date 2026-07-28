/**
 * Code.gs
 * -----------------------------------------------------------------------
 * Paste this into a Google Sheet's "Extensions > Apps Script" editor.
 * It turns the Sheet into a tiny append-only event log that the
 * English Practice app can push finished quiz sessions to, and pull
 * them back from to restore on another device.
 *
 * SETUP
 *  1. Create a new Google Sheet (any name).
 *  2. Extensions > Apps Script. Delete the default content and paste
 *     this whole file in.
 *  3. Change SYNC_KEY below to a password only you know.
 *  4. Deploy > New deployment > type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  5. Copy the deployment URL (ends in /exec) and the SYNC_KEY into
 *     the app's Settings page ("雲端同步"). Nothing here needs editing
 *     again unless you change SYNC_KEY.
 *
 * SECURITY NOTE
 *  This is a shared-secret check, not real authentication — anyone who
 *  obtains SYNC_KEY and the URL can read/write this sheet. That's an
 *  accepted trade-off for a free, serverless, single-user backend. Do
 *  not store sensitive information in this sheet.
 * -----------------------------------------------------------------------
 */

const SYNC_KEY = 'CHANGE_ME_TO_YOUR_OWN_SECRET';
const EVENTS_SHEET_NAME = 'Events';
const WORDS_SHEET_NAME = 'Words';

// Column order for the Words sheet. Multi-value fields (synonyms,
// antonyms, collocations, derivedWords, tags, syllables) are entered as
// comma-separated text in a single cell, e.g. "kind, generous, warm".
// example / exampleTranslation hold one sentence each — the app wraps
// them into single-item arrays to match its normal schema.
const WORDS_COLUMNS = [
  'id', 'word', 'meaning', 'pronunciation', 'syllables', 'partOfSpeech',
  'synonyms', 'antonyms', 'collocations', 'example', 'exampleTranslation',
  'derivedWords', 'level', 'tags', 'difficulty',
];

/**
 * GET /exec?key=SYNC_KEY&resource=events|words
 *  - resource=events (default): every session event, for "restore from cloud".
 *  - resource=words: the word list, read from the "Words" sheet, in the
 *    exact shape English Practice expects (see README "雲端同步" section
 *    for the column format).
 */
function doGet(e) {
  if (!e || e.parameter.key !== SYNC_KEY) {
    return jsonResponse({ error: 'unauthorized' });
  }

  const resource = e.parameter.resource || 'events';
  if (resource === 'words') {
    return jsonResponse({ words: getWords() });
  }

  const sheet = getOrCreateEventsSheet();
  const rows = sheet.getDataRange().getValues();
  const events = rows.slice(1).map((row) => ({
    timestamp: row[0],
    type: row[1],
    payload: safeParse(row[2]),
  }));

  return jsonResponse({ events });
}

/**
 * POST /exec
 * Body (as text/plain, parsed manually as JSON to avoid CORS preflight):
 *   { "key": SYNC_KEY, "type": "session", "payload": { ... } }
 * Appends one row to the Events sheet.
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'invalid_json' });
  }

  if (body.key !== SYNC_KEY) {
    return jsonResponse({ error: 'unauthorized' });
  }

  const sheet = getOrCreateEventsSheet();
  sheet.appendRow([new Date().toISOString(), body.type, JSON.stringify(body.payload || {})]);

  return jsonResponse({ ok: true });
}

/** Gets the Events sheet, creating it with a header row if missing. */
function getOrCreateEventsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(EVENTS_SHEET_NAME);
    sheet.appendRow(['timestamp', 'type', 'payload']);
  }
  return sheet;
}

/**
 * Gets the Words sheet, creating it with a header row + one example row
 * if missing, so opening the Sheet for the first time shows the user
 * exactly what format to fill in.
 */
function getOrCreateWordsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(WORDS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(WORDS_SHEET_NAME);
    sheet.appendRow(WORDS_COLUMNS);
    sheet.appendRow([
      'w0001', 'diligent', '勤勉的；勤奮的', '/ˈdɪl.ɪ.dʒənt/', 'dil,i,gent', 'adjective',
      'hardworking, industrious', 'lazy, idle', 'diligent student, diligent effort',
      'He is a diligent student who studies every night.', '他是個每晚都讀書的勤勉學生。',
      'diligence, diligently', 'B1', 'personality, school', 2,
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Reads the Words sheet and converts each row into the word object
 * shape English Practice expects.
 * @returns {Array<Object>}
 */
function getWords() {
  const sheet = getOrCreateWordsSheet();
  const rows = sheet.getDataRange().getValues();
  const dataRows = rows.slice(1).filter((row) => String(row[1]).trim() !== ''); // skip rows with no "word"

  return dataRows.map((row, index) => {
    const get = (col) => row[WORDS_COLUMNS.indexOf(col)];
    const splitList = (value) => String(value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const word = String(get('word')).trim();
    const id = String(get('id')).trim() || `sheet_${index + 1}`;

    return {
      id,
      word,
      meaning: String(get('meaning') || '').trim(),
      pronunciation: String(get('pronunciation') || '').trim(),
      syllables: splitList(get('syllables')),
      partOfSpeech: String(get('partOfSpeech') || '').trim(),
      synonyms: splitList(get('synonyms')),
      antonyms: splitList(get('antonyms')),
      collocations: splitList(get('collocations')),
      examples: [String(get('example') || '').trim()].filter(Boolean),
      exampleTranslation: [String(get('exampleTranslation') || '').trim()].filter(Boolean),
      derivedWords: splitList(get('derivedWords')),
      level: String(get('level') || '').trim(),
      tags: splitList(get('tags')),
      difficulty: Number(get('difficulty')) || 1,
    };
  });
}

/** Parses a JSON cell value, returning {} if it's empty or malformed. */
function safeParse(value) {
  try {
    return JSON.parse(value || '{}');
  } catch (err) {
    return {};
  }
}

/** Wraps an object as a JSON HTTP response. */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
