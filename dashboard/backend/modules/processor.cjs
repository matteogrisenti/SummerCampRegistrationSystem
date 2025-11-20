/**
 * Main processing pipeline
 * Orchestrates validation and sibling detection
 */

const excelHandler = require('./excelHandler.cjs');
const validators = require('./validators.cjs');
const siblingDetector = require('./siblingDetector.cjs');

/**
 * Complete processing pipeline for camp registrations
 */
async function processRegistrations(filePath, outputPath = null) {
  const output = outputPath || filePath;

  try {
    console.log('=' .repeat(60));
    console.log('CAMP REGISTRATION PROCESSOR');
    console.log('='.repeat(60));

    // Step 1: Load data
    console.log('\n[1/4] Loading registration data...');
    const registrations = excelHandler.readRegistrations(filePath);
    console.log(`  ✓ Loaded ${registrations.length} registrations`);

    // Step 2: Validate registrations
    console.log('\n[2/4] Validating registrations...');
    const { valid: validRegistrations, invalid: invalidRegistrations, summary } = validators.validateRegistrations(registrations);
    console.log(`  ✓ Valid registrations: ${summary.valid}`);
    console.log(`  ✗ Invalid registrations: ${summary.invalid}`);

    // Step 3: Detect siblings (only in valid registrations)
    console.log('\n[3/4] Detecting sibling groups...');
    const siblingGroups = siblingDetector.detectSiblings(validRegistrations);
    const siblingStats = siblingDetector.getSiblingStatistics(siblingGroups);
    console.log(`  ✓ Families with siblings: ${siblingStats.totalFamiliesWithSiblings}`);
    console.log(`  ✓ Children in sibling groups: ${siblingStats.totalChildrenInSiblingGroups}`);

    // Step 4: Write results
    console.log('\n[4/4] Writing results to file...');
    const results = {
      validRegistrations,
      invalidRegistrations,
      siblingGroups,
      processingResults: {
        totalRegistrations: registrations.length,
        validRegistrations: summary.valid,
        invalidRegistrations: summary.invalid,
        siblingStatistics: siblingStats,
        timestamp: new Date().toISOString(),
      }
    };

    excelHandler.writeResultsToExcel(output, results);
    console.log(`  ✓ Results saved to: ${output}`);

    console.log('\n' + '='.repeat(60));
    console.log('Processing complete!');
    console.log('='.repeat(60));

    return results.processingResults;

  } catch (error) {
    console.error(`\nError during processing: ${error.message}`);
    throw error;
  }
}

module.exports = {
  processRegistrations,
};
