/**
 * Excel file handling
 * Read from and write to Excel files using xlsx library
 */

const XLSX = require('xlsx');
const CONFIG = require('./config.cjs');

/**
 * Read registrations from Excel file
 */
function readRegistrations(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet (usually contains registrations)
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      throw new Error('Excel file contains no data');
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
}

/**
 * Write results to Excel file
 */
function writeResultsToExcel(filePath, results) {
  try {
    const workbook = XLSX.utils.book_new();

    // Add registrations sheet
    if (results.validRegistrations && results.validRegistrations.length > 0) {
      const validSheet = XLSX.utils.json_to_sheet(results.validRegistrations);
      XLSX.utils.book_append_sheet(workbook, validSheet, 'Registrations');
    }

    // Add invalid registrations sheet
    if (results.invalidRegistrations && results.invalidRegistrations.length > 0) {
      const invalidSheet = XLSX.utils.json_to_sheet(results.invalidRegistrations);
      XLSX.utils.book_append_sheet(workbook, invalidSheet, 'Invalid_Registrations');
    }

    // Add sibling groups sheet
    if (results.siblingGroups && results.siblingGroups.length > 0) {
      const siblingData = results.siblingGroups.map(group => ({
        'Family ID': group.familyId,
        'Parent Name': group.parentName,
        'Parent Email': group.parentEmail,
        'Number of Children': group.children,
        'Children Names': group.childrenNames,
      }));
      const siblingSheet = XLSX.utils.json_to_sheet(siblingData);
      XLSX.utils.book_append_sheet(workbook, siblingSheet, 'Possible_Siblings');
    }

    XLSX.writeFile(workbook, filePath);
    return true;
  } catch (error) {
    throw new Error(`Failed to write Excel file: ${error.message}`);
  }
}

/**
 * Get column mapping from headers
 * Helps normalize column names
 */
function getColumnMapping(data) {
  if (!data || data.length === 0) return {};

  const headers = Object.keys(data[0]);
  const mapping = {};

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    mapping[header] = header;
  });

  return mapping;
}

module.exports = {
  readRegistrations,
  writeResultsToExcel,
  getColumnMapping,
};
