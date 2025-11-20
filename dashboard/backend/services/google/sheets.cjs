// backend/services/google/sheets.js
const { google } = require('googleapis');

async function createSheet(auth, title) {
  const drive = google.drive({ version: 'v3', auth });
  // Create an empty Google Sheet file via Drive API
  const fileMetadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.spreadsheet'
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name'
  });

  const sheetId = res.data.id;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
  return { sheetId, sheetUrl };
}

async function setSheetHeaders(auth, sheetId, headers) {
  const sheets = google.sheets({ version: 'v4', auth });
  const values = [headers];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'A1:Z1',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

module.exports = { createSheet, setSheetHeaders };
