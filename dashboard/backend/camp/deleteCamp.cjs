// backend/camp/deleteCamp.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const { authorize } = require('../services/google/auth.cjs');

/**
 * Delete a camp by removing its Google Form, Google Sheet, local files, and metadata
 * @param {string} campSlug - The slug identifier of the camp to delete
 * @returns {Object} Summary of deletion operations
 */
async function deleteCamp(campSlug) {
  if (!campSlug) throw new Error('campSlug is required');

  const auth = await authorize();
  const dataDir = path.join(process.cwd(), 'backend/data', campSlug);
  const metadataPath = path.join(dataDir, 'metadata.json');

  // Check if camp exists
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Camp with slug "${campSlug}" not found`);
  }

  // Read metadata
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const { form_id: formId, sheet_id: sheetId, camp_name: campName } = metadata;

  const deletionSummary = {
    camp_name: campName,
    camp_slug: campSlug,
    deleted_form: false,
    deleted_sheet: false,
    deleted_local_files: false,
    updated_index: false,
    errors: []
  };

    // 1) Delete Google Form (via Drive API, not Forms API)
    if (formId) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        await drive.files.delete({
        fileId: formId
        });
        deletionSummary.deleted_form = true;
        console.log(`✓ Deleted Google Form: ${formId}`);
    } catch (err) {
        console.error(`Error deleting form ${formId}:`, err.message);
        deletionSummary.errors.push(`Form deletion failed: ${err.message}`);
    }
    }

  // 2) Delete Google Sheet
  if (sheetId) {
    try {
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.delete({
        fileId: sheetId
      });
      deletionSummary.deleted_sheet = true;
      console.log(`✓ Deleted Google Sheet: ${sheetId}`);
    } catch (err) {
      console.error(`Error deleting sheet ${sheetId}:`, err.message);
      deletionSummary.errors.push(`Sheet deletion failed: ${err.message}`);
    }
  }

  // 3) Delete local directory and files
  try {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
      deletionSummary.deleted_local_files = true;
      console.log(`✓ Deleted local files: ${dataDir}`);
    }
  } catch (err) {
    console.error(`Error deleting local files:`, err.message);
    deletionSummary.errors.push(`Local file deletion failed: ${err.message}`);
  }

  // 4) Update camps.json index
  try {
    const campsIndexPath = path.join(process.cwd(), 'backend/data', 'camps.json');
    if (fs.existsSync(campsIndexPath)) {
      let camps = JSON.parse(fs.readFileSync(campsIndexPath, 'utf8'));
      camps = camps.filter(c => c.camp_slug !== campSlug);
      fs.writeFileSync(campsIndexPath, JSON.stringify(camps, null, 2));
      deletionSummary.updated_index = true;
      console.log(`✓ Updated camps index`);
    }
  } catch (err) {
    console.error(`Error updating camps index:`, err.message);
    deletionSummary.errors.push(`Index update failed: ${err.message}`);
  }

  return deletionSummary;
}

module.exports = { deleteCamp };