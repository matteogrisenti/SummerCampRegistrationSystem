/**
 * Registration Data Processor
 * Processes Excel registration data, validates entries, and identifies sibling groups
 */
const XLSX = require('xlsx');
const { syncRegistrations } = require('./utils/syncRegistrations.cjs');
const { validateRegistrations, identifyDuplicateRegistrations, identifySiblingGroups } = require('./utils/utils.cjs');


/**
 * Main processing function
 * Reads the registration Excel file and performs all analysis
 */
async function processRegistrations(campSlug, xlsxPath, sheetId) {
  try {
    // 1. Sync and merge registrations (download new, merge with old, save to file)
    const { registrations, outputPath } = await syncRegistrations(campSlug, xlsxPath, sheetId);

    // 2. Validate the registrations
    let { validRegistrations, invalidRegistrations, duplicateRegistrations, siblingGroups } = validatedRegistration(registrations)

    // 3. Add the processing tag to the All Registrations sheet
    // Open existing workbook
    const workbook = XLSX.readFile(outputPath);

    // Remove the existing 'All Registrations' sheet if it exists
    if (workbook.Sheets['All Registrations']) {
      delete workbook.Sheets['All Registrations'];
      const index = workbook.SheetNames.indexOf('All Registrations');
      if (index !== -1) workbook.SheetNames.splice(index, 1);
    }

    // Add updated 'All Registrations' sheet
    const processedAllSheet = XLSX.utils.json_to_sheet(registrations);
    XLSX.utils.book_append_sheet(workbook, processedAllSheet, 'All Registrations');

    // Write back to the same file
    XLSX.writeFile(workbook, outputPath);

    return {
      success: true,
      data: {
        validCount: validRegistrations.length,
        invalidCount: invalidRegistrations.length,
        siblingGroupsCount: siblingGroups.length,
        duplicateCount: duplicateRegistrations.length,
        totalCount: registrations.length,
        processedAt: new Date().toISOString(),
        registrations: registrations
      }
    };

  } catch (error) {
    console.error('Processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


function validatedRegistration(registrations) {
  /* This function validate a set of registration and update them adding validation tag and eventuali
  validation errors */

  // 1. Validate and categorize registrations
  const { validRegistrations, invalidRegistrations } = validateRegistrations(registrations);

  // 2. Identify duplicated registrations
  const duplicateRegistrations = identifyDuplicateRegistrations(registrations);

  // 3. Identify possible sibling groups
  const siblingGroups = identifySiblingGroups(registrations);

  return {
    validRegistrations,
    invalidRegistrations,
    duplicateRegistrations,
    siblingGroups
  }

}

module.exports = {
  processRegistrations,
  validatedRegistration
};
