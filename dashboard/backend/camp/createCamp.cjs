// backend/camp/createCamp.js
const fs = require('fs');
const path = require('path');
const { slugify } = require('../utils/slugify.cjs');
const { authorize } = require('../services/google/auth.cjs');
const { createForm, addQuestions } = require('../services/google/form.cjs');
const { createSheet, setSheetHeaders } = require('../services/google/sheets.cjs');
const { exportSheetAsXlsx } = require('../services/google/drive.cjs');

const COLUMNS = {
  timestamp: 'Timestamp',
  child_name: 'Child Full Name',
  child_age: 'Child Age',
  parent_name: 'Parent/Guardian Name',
  parent_email: 'Parent Email',
  phone: 'Phone Number',
  allergies: 'Allergies/Medical Info',
  emergency_contact: 'Emergency Contact',
};

const REQUIRED = ['child_name', 'parent_email', 'phone'];

async function createCamp(campName, options = {}) {
  if (!campName) throw new Error('campName is required');
  const auth = await authorize();

  const campSlug = slugify(campName);
  const dataDir = path.join(process.cwd(), 'data', campSlug);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1) Create Google Form
  const form = await createForm(auth, campName);
  // form.name is like "forms/FORM_ID"
  const formResourceName = form.name;
  const formId = formResourceName.includes('/') ? formResourceName.split('/')[1] : formResourceName;
  const formUrl = form.responderUri || `https://forms.google.com/d/e/${formId}`;

  // 2) Build fields array
  const fields = Object.keys(COLUMNS).map((k) => ({ key: k, label: COLUMNS[k] }));
  await addQuestions(auth, formId, fields, REQUIRED);

  // 3) Create Google Sheet
  const sheetTitle = `${campName} - Responses`;
  const { sheetId, sheetUrl } = await createSheet(auth, sheetTitle);

  // 4) Link form -> sheet (Forms API supports responseDestination update)
  // We'll use forms.responses.append? Better to use forms.update with responseDestination.
  // Use forms API via googleapis low-level call:
  const { google } = require('googleapis');
  const formsApi = google.forms({ version: 'v1', auth });
  await formsApi.forms.update({
    formId,
    requestBody: {
      responseDestination: {
        // destination_type must be "SPREADSHEET" and the spreadsheetId
        // BUT forms.update doesn't accept responseDestination directly in googleapis v1 as of some versions.
        // We'll use the batchUpdate method with "setResponseDestination" request (supported).
      }
    }
  }).catch(async () => {
    // fallback: use batchUpdate with setResponseDestination
    await formsApi.forms.batchUpdate({
      formId,
      requestBody: {
        requests: [
          {
            setResponseDestination: {
              destination: {
                // provide spreadsheet id
                spreadsheetId: sheetId
              }
            }
          }
        ]
      }
    });
  });

  // 5) Optionally set headers in sheet to match form fields
  const headers = Object.values(COLUMNS);
  await setSheetHeaders(auth, sheetId, headers);

  // 6) Export sheet to xlsx and save locally
  const xlsxPath = path.join(dataDir, 'registrations.xlsx');
  await exportSheetAsXlsx(auth, sheetId, xlsxPath);

  // 7) Write metadata.json
  const metadata = {
    camp_name: campName,
    camp_slug: campSlug,
    form_id: formId,
    form_resource: formResourceName,
    form_url: formUrl,
    sheet_id: sheetId,
    sheet_url: sheetUrl,
    xlsx_path: xlsxPath,
    created_at: new Date().toISOString()
  };
  fs.writeFileSync(path.join(dataDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // 8) Update /data/camps.json index
  const campsIndexPath = path.join(process.cwd(), 'data', 'camps.json');
  let camps = [];
  if (fs.existsSync(campsIndexPath)) {
    camps = JSON.parse(fs.readFileSync(campsIndexPath, 'utf8'));
  }
  camps.push(metadata);
  fs.writeFileSync(campsIndexPath, JSON.stringify(camps, null, 2));

  return metadata;
}

module.exports = { createCamp };
