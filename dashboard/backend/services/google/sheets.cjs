// backend/services/google/sheets.js
const XLSX = require('xlsx');
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

async function readSheetAsExcel(auth, sheetId, pageId = 0, startRow = 0) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch the full spreadsheet data including grid data
  const res = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true,
  });

  const registration_sheet = res.data.sheets[pageId];

  if (!registration_sheet || !registration_sheet.data || !registration_sheet.data[0].rowData) {
    return [];
  }

  // Extract rows starting from startRow
  const rows = registration_sheet.data[0].rowData.slice(startRow - 1).map(row => {
    return row.values ? row.values.map(cell => (cell.formattedValue || '')) : [];
  });

  return rows;
}

async function downloadSheetAsExcel(auth, sheetId, destPath) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    includeGridData: true
  });
  const workbook = XLSX.utils.book_new();

  registration_sheet = res.data.sheets[0];
  
  const sheetTitle = registration_sheet.properties.title;
  const rows = registration_sheet.data[0].rowData.map(row => {
    return row.values ? row.values.map(cell => cell.formattedValue || '') : [];
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);
  
  XLSX.writeFile(workbook, destPath); 
  console.log(`[DOWNLOAD] Sheet downloaded as XLSX to ${destPath}`);
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

module.exports = { createSheet, setSheetHeaders, downloadSheetAsExcel, readSheetAsExcel};
