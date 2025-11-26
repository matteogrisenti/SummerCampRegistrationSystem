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
async function syncRegistrations(campSlug, xlsxPath, sheetId) {
    const auth = await authorize();
    const dataDir = path.join(process.cwd(), 'backend/data', campSlug);
    const metadataPath = path.join(dataDir, 'metadata.json');
    const localRegistrationsPath = path.join(dataDir, 'registrations.xlsx');

    let registrations = [];
    let lastRowProcessed = 0;
    let metadata = {};

    // Load metadata if exists
    if (fs.existsSync(metadataPath)) {
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            lastRowProcessed = metadata.last_row_processed || 0;
        } catch (e) {
            console.warn("Failed to read metadata, starting fresh.");
        }
    }

    // Prepare the workbook to write
    let workbook;
    let addedSheetData = [];
    let deletedSheetData = [];
    let modifiedSheetData = [];

    let originalRegistrationsWithIds = [];

    // Check if the file exists locally
    console.log("[SYNC] Local Excel exist: ", fileExists(localRegistrationsPath));

    // CASE 1: No local history yet. Initialize with downloaded data.
    if (!fileExists(localRegistrationsPath)) {
        // DEBUG PRINT
        console.log("[SYNC] Initializing new workbook — no existing registrations.xlsx found.");
        
        // Download the latest sheet
        await downloadSheetAsExcel(auth, sheetId, xlsxPath);

        // Read the newly downloaded raw data
        const allDownloadedRegistrations = readRegistrations(xlsxPath);
        // Prepare "Original Registrations" data (Full copy with IDs)
        originalRegistrationsWithIds = allDownloadedRegistrations.map((reg, index) => ({
            ...reg,
            ID: index + 1
        }));

        registrations = originalRegistrationsWithIds;
        lastRowProcessed = registrations.length + 1;

        // Initialize empty arrays for other sheets
        addedSheetData = [];
        deletedSheetData = [];
        modifiedSheetData = [];

        workbook = XLSX.utils.book_new();
    } else {
        // CASE 2: Local history exists. Merge new rows and preserve other sheets.
        // DEBUG PRINT
        console.log("[SYNC] Merging with existing workbook — registrations.xlsx found.");
        
        // Download the latest sheet
        await downloadSheetAsExcel(auth, sheetId, xlsxPath);

        // Read the newly downloaded raw data
        const allDownloadedRegistrations = readRegistrations(xlsxPath);
        // Prepare "Original Registrations" data (Full copy with IDs)
        originalRegistrationsWithIds = allDownloadedRegistrations.map((reg, index) => ({
            ...reg,
            ID: index + 1
        }));


        // Read existing workbook to preserve other sheets
        try {
            const existingWorkbook = XLSX.readFile(localRegistrationsPath);

            // Read existing "All Registrations"
            const oldRegistrations = XLSX.utils.sheet_to_json(existingWorkbook.Sheets['All Registrations'] || existingWorkbook.Sheets[existingWorkbook.SheetNames[0]]);

            // Read existing "Added Registrations", "Deleted Registrations", "Modified Registrations"
            addedSheetData = XLSX.utils.sheet_to_json(existingWorkbook.Sheets['Added Registrations'], { defval: "" });
            console.log("Added Sheet Data:", addedSheetData);
            deletedSheetData = XLSX.utils.sheet_to_json(existingWorkbook.Sheets['Deleted Registrations'], { defval: "" });
            modifiedSheetData = XLSX.utils.sheet_to_json(existingWorkbook.Sheets['Modified Registrations'], { defval: "" });
            
            // Determine which rows are new
            const previousCount = lastRowProcessed > 1 ? lastRowProcessed - 1 : 0;
            const newRawRegistrations = allDownloadedRegistrations.slice(previousCount + 1);

            // Assign IDs to new registrations
            let nextId = oldRegistrations.length > 0
                ? Math.max(...oldRegistrations.map(r => r._rowNumber || 0)) + 1
                : 2;

            const newRegistrationsWithIds = newRawRegistrations.map(reg => {
                const r = { ...reg, _rowNumber: nextId };
                nextId++;
                return r;
            });

            registrations = oldRegistrations.concat(newRegistrationsWithIds);
            lastRowProcessed = allDownloadedRegistrations.length + 1;

            workbook = XLSX.utils.book_new();

        } catch (error) {
            console.error("[SYNC] Error reading existing workbook, falling back to overwrite:", error);
            // Fallback: treat as new
            registrations = [...originalRegistrationsWithIds];
            lastRowProcessed = registrations.length + 1;
            workbook = XLSX.utils.book_new();
        }
    }

    // Update metadata
    metadata.last_row_processed = lastRowProcessed;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Construct the Workbook
    // Add the headers even if there is no data yet
    const headers = Object.keys(originalRegistrationsWithIds[0] || {});

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