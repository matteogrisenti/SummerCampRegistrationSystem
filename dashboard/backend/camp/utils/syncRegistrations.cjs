const { readRegistrations } = require('./utils.cjs');
const XLSX = require('xlsx');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { authorize } = require('../../services/google/auth.cjs');
const { downloadSheetAsExcel } = require('../../services/google/sheets.cjs');

/**
 * Syncs local registrations with Google Sheets
 * Downloads new data, merges with existing local data, updates metadata,
 * and ensures the local Excel file has the required structure.
 */
async function syncRegistrations(campSlug) {
    const auth = await authorize();
    const dataDir = path.join(process.cwd(), 'backend/data', campSlug);
    const metadataPath = path.join(dataDir, 'metadata.json');
    const localRegistrationsPath = path.join(dataDir, 'registrations.xlsx');

    let sheetID = null;
    let registrations = [];
    let lastRowProcessed = 0;
    let metadata = {};

    // Load metadata if exists
    if (fs.existsSync(metadataPath)) {
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            sheetID = metadata.sheet_id;
            lastRowProcessed = metadata.last_row_processed || 0;
        } catch (e) {
            console.warn("Failed to read metadata, starting fresh.");
        }
    }

    // Download the latest sheet and get the sheet title and rows
    // The sheet id is 0 because we are downloading the first sheet
    // We do this BEFORE checking for local file existence because we need the data in both cases
    const { sheetTitle, rows } = await downloadSheetAsExcel(auth, sheetID);

    // Extract headers and data
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Convert to objects
    const allDownloadedRegistrations = dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });

    // Prepare "Original Registrations" data (Full copy with IDs)
    // Also initialize acceptance_status to 'pending' for all new registrations
    const originalRegistrationsWithIds = allDownloadedRegistrations.map((reg, index) => ({
        ID: index + 1,
        ...reg,
        acceptance_status: reg.acceptance_status || 'pending'  // Initialize if not present
    }));

    // Check if the file exists locally
    const localFileExists = fileExists(localRegistrationsPath);
    console.log("[SYNC] Local Excel exist: ", localFileExists);

    let workbook;

    if (!localFileExists) {
        // CASE 1: No local history yet. Initialize with downloaded data.
        console.log("[SYNC] Initializing new workbook — no existing registrations.xlsx found.");

        registrations = originalRegistrationsWithIds;
        lastRowProcessed = registrations.length;

        // Initialize empty arrays for other sheets
        const addedSheetData = [];
        const deletedSheetData = [];
        const modifiedSheetData = [];

        // Construct the Workbook
        workbook = XLSX.utils.book_new();

        // Sheet 1: Original Registrations (Source of Truth)
        const originalSheet = XLSX.utils.json_to_sheet(originalRegistrationsWithIds);
        XLSX.utils.book_append_sheet(workbook, originalSheet, 'Original Registrations');

        // Sheet 2: All Registrations (Historical Accumulation)
        const allSheet = XLSX.utils.json_to_sheet(registrations);
        XLSX.utils.book_append_sheet(workbook, allSheet, 'All Registrations');

        // Sheet 3: Added Registrations
        const addedSheet = XLSX.utils.json_to_sheet(addedSheetData, { header: headers });
        XLSX.utils.book_append_sheet(workbook, addedSheet, 'Added Registrations');

        // Sheet 4: Deleted Registrations
        const deletedSheet = XLSX.utils.json_to_sheet(deletedSheetData, { header: headers });
        XLSX.utils.book_append_sheet(workbook, deletedSheet, 'Deleted Registrations');

        // Sheet 5: Modified Registrations
        const modifiedSheet = XLSX.utils.json_to_sheet(modifiedSheetData, { header: headers });
        XLSX.utils.book_append_sheet(workbook, modifiedSheet, 'Modified Registrations');

        // Write to file
        XLSX.writeFile(workbook, localRegistrationsPath);

    } else {
        // CASE 2: Local history exists. Merge new rows and preserve other sheets.
        console.log("[SYNC] Merging with existing workbook — registrations.xlsx found.");

        try {
            const existingWorkbook = XLSX.readFile(localRegistrationsPath);

            // Read existing "All Registrations"
            // Try to get by name, fallback to first sheet if name doesn't match (though it should)
            const allRegSheet = existingWorkbook.Sheets['All Registrations'] || existingWorkbook.Sheets[existingWorkbook.SheetNames[0]];
            const oldRegistrations = XLSX.utils.sheet_to_json(allRegSheet);

            // Determine which rows are new
            // Use lastRowProcessed to avoid duplicates if metadata is out of sync
            const newRawRegistrations = allDownloadedRegistrations.slice(lastRowProcessed);
            console.log('[SYNC] new registrations count: ', newRawRegistrations.length);

            // Concat new rows to old ones
            // We need to ensure new rows also have IDs and acceptance_status
            // The IDs for new rows should continue from where the old ones left off.
            const startingId = oldRegistrations.length + 1;
            const newRegistrationsWithIds = newRawRegistrations.map((reg, index) => ({
                ID: startingId + index,
                ...reg,
                acceptance_status: reg.acceptance_status || 'pending'  // Initialize if not present
            }));

            registrations = oldRegistrations.concat(newRegistrationsWithIds);
            lastRowProcessed = allDownloadedRegistrations.length;

            // Update "Original Registrations" sheet (Always a fresh copy of what's currently in the source)
            const newOriginalSheet = XLSX.utils.json_to_sheet(originalRegistrationsWithIds);
            existingWorkbook.Sheets['Original Registrations'] = newOriginalSheet;

            // Update "All Registrations" sheet (The merged history)
            const newAllSheet = XLSX.utils.json_to_sheet(registrations);
            existingWorkbook.Sheets['All Registrations'] = newAllSheet;

            // Write the updated workbook back to file
            XLSX.writeFile(existingWorkbook, localRegistrationsPath);

        } catch (error) {
            console.error("[SYNC] Error reading existing workbook, falling back to overwrite:", error);
        }
    }

    // Update metadata
    metadata.last_row_processed = lastRowProcessed;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return { registrations, outputPath: localRegistrationsPath };
}

function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
}


module.exports = {
    syncRegistrations
}