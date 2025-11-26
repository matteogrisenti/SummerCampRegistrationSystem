/**
 * Registration Data Processor
 * Processes Excel registration data, validates entries, and identifies sibling groups
 */
const { syncRegistrations } = require('./utils/syncRegistrations.cjs');
const { validateRegistrations, identifyDuplicateRegistrations, identifySiblingGroups} = require('./utils/utils.cjs');  


/**
 * Main processing function
 * Reads the registration Excel file and performs all analysis
 */
async function processRegistrations(campSlug, xlsxPath, sheetId) {
  try {
    // 1. Sync and merge registrations (download new, merge with old, save to file)
    const { registrations, outputPath } = await syncRegistrations(campSlug, xlsxPath, sheetId);

    // 2. Validate and categorize registrations
    const { validRegistrations, invalidRegistrations } = validateRegistrations(registrations);

    // 3. Identify duplicated registrations
    const duplicateRegistrations = identifyDuplicateRegistrations(validRegistrations);

    // 4. Identify possible sibling groups
    const siblingGroups = identifySiblingGroups(validRegistrations);

    // 5. Prepare results object
    const results = {
      validRegistrations,
      invalidRegistrations,
      duplicateRegistrations,
      duplicateCount: duplicateRegistrations.length,
      siblingGroups,
      validCount: validRegistrations.length,
      invalidCount: invalidRegistrations.length,
      siblingGroupsCount: siblingGroups.length,
      totalCount: registrations.length,
      processedAt: new Date().toISOString(),
    };

    // Note: We no longer write the results to Excel here. 
    // The "workable" file is managed by syncRegistrations.

    return {
      success: true,
      data: {
        validCount: results.validCount,
        invalidCount: results.invalidCount,
        siblingGroupsCount: results.siblingGroupsCount,
        totalCount: results.totalCount,
        processedAt: results.processedAt,
        outputPath,
        // Return the full analysis results if needed by the caller
        results
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

module.exports = {
  processRegistrations
};
