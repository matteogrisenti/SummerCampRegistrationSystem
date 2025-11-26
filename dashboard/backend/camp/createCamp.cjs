// backend/camp/createCamp.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { slugify } = require('../utils/slugify.cjs');
const { authorize } = require('../services/google/auth.cjs');
const { createForm, addQuestions } = require('../services/google/form.cjs');
const { createSheet, setSheetHeaders } = require('../services/google/sheets.cjs');
const { exportSheetAsXlsx } = require('../services/google/drive.cjs');

WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw2WGpjUcHGd4hCNPlcqjUDKg1aExfaaGtBttX5ZfQRb-vQEHX_7EQHT5x0JvlaxJksYQ/exec';

// Main function to create a camp with Google Form and Sheet
async function createCamp(campName, fields) {
  if (!campName) throw new Error('campName is required');
  const auth = await authorize(); // Autenticazione Google

  // Prepare data directory
  const campSlug = slugify(campName);
  const dataDir = path.join(process.cwd(), 'backend/data', campSlug);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1) Create Google Form
  const form = await createForm(auth, campName);
  console.log("FORM OBJECT:", form);
  if (!form || (!form.name && !form.formId)) {
    console.error("Unexpected createForm() response:", form);
    throw new Error("Google Forms API did not return a valid form ID");
  }
  // form.name is like "forms/FORM_ID"
  const formId = form.formId 
  const formUrl = form.responderUri || `https://forms.google.com/d/e/${formId}`;

  // 2) Prepare requests from your custom fields state
  // We filter out 'timestamp' because Google Forms adds this automatically to responses.
  const questionsToAdd = fields.filter(f => f.name !== 'timestamp');
  // Pass the array directly. We no longer need a separate 'REQUIRED' array
  // because the 'required' boolean is now inside each field object.
  await addQuestions(auth, formId, questionsToAdd);

  
  // 3) Create Google Sheet
  const sheetTitle = `${campName} - Responses`;
  const { sheetId, sheetUrl } = await createSheet(auth, sheetTitle);


  // 4) Link form -> sheet (via custom Web App)
  await axios.post(WEB_APP_URL, {
    token: auth.credentials.access_token,    
    formId,
    sheetId
  }).catch(err => {
    console.error("Error linking form to sheet:", err.response ? err.response.data : err.message);
  });


  // 5) Optionally set headers in sheet to match form fields
  const headers = Object.values(fields).map(f => f.label);
  await setSheetHeaders(auth, sheetId, headers);


  // 6) Export sheet to xlsx
  await exportSheetAsXlsx(auth, sheetId, xlsxPath);


  // 7) Write metadata.json
  const metadata = {
    camp_name: campName,
    camp_slug: campSlug,
    form_id: formId,
    form_url: formUrl,
    sheet_id: sheetId,
    sheet_url: sheetUrl,
    xlsx_path: xlsxPath,
    created_at: new Date().toISOString()
  };
  fs.writeFileSync(path.join(dataDir, 'metadata.json'), JSON.stringify(metadata, null, 2));


  // 8) Update /data/camps.json index
  const campsIndexPath = path.join(process.cwd(), 'backend/data', 'camps.json');
  let camps = [];
  if (fs.existsSync(campsIndexPath)) {
    camps = JSON.parse(fs.readFileSync(campsIndexPath, 'utf8'));
  }
  camps.push(metadata);
  fs.writeFileSync(campsIndexPath, JSON.stringify(camps, null, 2));

  return metadata;
}

module.exports = { createCamp };
