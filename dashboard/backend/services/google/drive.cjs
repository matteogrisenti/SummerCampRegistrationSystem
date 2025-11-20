// backend/services/google/drive.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function exportSheetAsXlsx(auth, sheetId, outPath) {
  const drive = google.drive({ version: 'v3', auth });

  const dest = fs.createWriteStream(outPath);
  // export as xlsx
  const res = await drive.files.export(
    {
      fileId: sheetId,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    { responseType: 'stream' }
  );

  await new Promise((resolve, reject) => {
    res.data
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .pipe(dest);
  });

  return outPath;
}

module.exports = { exportSheetAsXlsx };
