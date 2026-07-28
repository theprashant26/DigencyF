/**
 * Digency – website form handler
 * ---------------------------------------------------------------
 * Receives submissions from the contact form (contact.html) and the
 * lead form (index.html, testimonial.html) and appends them to the
 * "Contacts" and "Leads" sheets in this spreadsheet.
 *
 * SETUP
 *  1. Open your Google Sheet > Extensions > Apps Script
 *  2. Delete anything in Code.gs and paste this file in
 *  3. Update NOTIFY_EMAIL below (or set it to '' to disable emails)
 *  4. Deploy > New deployment > type "Web app"
 *       Execute as:      Me
 *       Who has access:  Anyone        <-- must be "Anyone", not
 *                                          "Anyone with a Google account"
 *  5. Authorise when prompted, then copy the /exec URL
 *  6. Paste that URL into GOOGLE_SHEET_ENDPOINT in js/submit-form.js
 *
 * NOTE: after ANY edit to this file you must run
 *       Deploy > Manage deployments > edit > Version: New version,
 *       otherwise the live URL keeps serving the old code.
 */

// Email address that gets notified on each submission. Set to '' to turn off.
var NOTIFY_EMAIL = 'hellodigency@gmail.com';

// An identical submission arriving again inside this window is treated as a
// retry of the first one, not as a new lead.
var DEDUPE_WINDOW_SECONDS = 120;

var FORMS = {
  contact: {
    sheetName: 'Contacts',
    headers: ['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Subject', 'Message', 'Page URL'],
    toRow: function (p, now) {
      return [now, p.firstName || '', p.lastName || '', p.email || '', p.phone || '',
              p.subject || '', p.message || '', p.pageUrl || ''];
    }
  },
  lead: {
    sheetName: 'Leads',
    headers: ['Timestamp', 'Name', 'Email', 'Phone', 'Service', 'Message', 'Page URL'],
    toRow: function (p, now) {
      return [now, p.name || '', p.email || '', p.phone || '',
              p.service || '', p.message || '', p.pageUrl || ''];
    }
  }
};

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    // Stops two simultaneous submissions from writing to the same row.
    lock.waitLock(30000);

    var params = (e && e.parameter) || {};
    var formType = String(params.formType || '').toLowerCase();
    var config = FORMS[formType];

    if (!config) {
      return jsonOutput({ result: 'error', message: 'Unknown formType: ' + formType });
    }

    var email = String(params.email || '').trim();
    if (!isValidEmail_(email)) {
      return jsonOutput({ result: 'error', message: 'Invalid email address' });
    }
    params.email = email;

    // The frontend retries in no-cors mode when it cannot read our response,
    // so the same submission can legitimately arrive twice. Ignore a repeat of
    // identical content within DEDUPE_WINDOW_SECONDS instead of duplicating it.
    var fingerprint = makeFingerprint_(formType, params);
    var cache = CacheService.getScriptCache();

    if (cache.get(fingerprint)) {
      return jsonOutput({ result: 'success', duplicate: true });
    }
    cache.put(fingerprint, '1', DEDUPE_WINDOW_SECONDS);

    var sheet = getOrCreateSheet_(config);
    var row = config.toRow(params, new Date());
    sheet.appendRow(row);

    sendNotification_(formType, config.headers, row);

    return jsonOutput({ result: 'success', row: sheet.getLastRow() });

  } catch (err) {
    console.error(err);
    return jsonOutput({ result: 'error', message: String(err && err.message || err) });

  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/** Lets you open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return jsonOutput({ result: 'success', message: 'Digency form endpoint is live' });
}

function getOrCreateSheet_(config) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(config.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    writeHeaders_(sheet, config.headers);
    return sheet;
  }

  // The Phone column was added to the contact form after this sheet may have
  // been created. If the sheet only holds headers, it is safe to rewrite them;
  // if it already holds leads, say so rather than silently misaligning columns.
  var current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].join('|');

  if (current !== config.headers.join('|')) {
    if (sheet.getLastRow() === 1) {
      writeHeaders_(sheet, config.headers);
    } else {
      console.warn('Header mismatch on "' + config.sheetName + '". Expected [' +
                   config.headers.join(', ') + '] but found [' + current +
                   ']. Existing rows were kept; fix the header row manually.');
    }
  }

  return sheet;
}

function writeHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function sendNotification_(formType, headers, row) {
  if (!NOTIFY_EMAIL) return;

  try {
    var lines = headers.map(function (header, i) {
      return header + ': ' + row[i];
    });

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New ' + formType + ' submission – digency.in',
      body: lines.join('\n')
    });
  } catch (err) {
    // A failed notification must never fail the submission itself.
    console.error('Notification email failed: ' + err);
  }
}

function makeFingerprint_(formType, params) {
  var basis = [formType, params.email, params.name || '', params.phone || '',
               params.subject || '', params.message || ''].join('|');
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, basis);

  return 'sub_' + bytes.map(function (b) {
    return ((b & 0xFF) + 0x100).toString(16).slice(1);
  }).join('');
}

function isValidEmail_(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
