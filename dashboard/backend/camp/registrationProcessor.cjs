/**
 * Registration Data Processor
 * Processes Excel registration data, validates entries, and identifies sibling groups
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const { authorize } = require('../services/google/auth.cjs');
const { downloadSheetAsExcel } = require('../services/google/sheets.cjs');

/**
 * Main processing function
 * Reads the registration Excel file and performs all analysis
 */
async function processRegistrations(campSlug, xlsxPath, sheetId) {
  try {
    // 1) Download the Registration Sheet as Excel
    const auth = await authorize();
    await downloadSheetAsExcel(auth, sheetId, xlsxPath);

    // 2) Process the Excel file
    // Read the Excel file
    const registrations = readRegistrations(xlsxPath);
    
    // Validate and categorize registrations
    const { validRegistrations, invalidRegistrations } = validateRegistrations(registrations);
    
    // Identify possible sibling groups
    const siblingGroups = identifySiblingGroups(validRegistrations);
    
    // Prepare results
    const results = {
      validRegistrations,
      invalidRegistrations,
      siblingGroups,
      validCount: validRegistrations.length,
      invalidCount: invalidRegistrations.length,
      siblingGroupsCount: siblingGroups.length,
      totalCount: registrations.length,
      processedAt: new Date().toISOString(),
    };
    
    // Write processed results to a new Excel file
    const outputPath = path.join(path.dirname(xlsxPath), 'processed_registrations.xlsx');
    writeResultsToExcel(outputPath, results);
    
    return {
      success: true,
      data: {
        validCount: results.validCount,
        invalidCount: results.invalidCount,
        siblingGroupsCount: results.siblingGroupsCount,
        totalCount: results.totalCount,
        processedAt: results.processedAt,
        outputPath,
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

/**
 * Read registrations from Excel file
 */
function readRegistrations(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

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
 * Validate registrations
 * Categorizes entries as valid or invalid based on required fields
 */
function validateRegistrations(registrations) {
  const validRegistrations = [];
  const invalidRegistrations = [];
  
  // Required fields (adjust based on your form structure)
  const requiredFields = [
    'Timestamp',
    // Add your actual required field names here
  ];
  
  registrations.forEach((registration, index) => {
    const errors = [];
    
    // Check for required fields
    requiredFields.forEach(field => {
      if (!registration[field] || registration[field].toString().trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Add validation rules
    // Example: Email validation
    const emailFields = Object.keys(registration).filter(key => 
      key.toLowerCase().includes('email')
    );
    emailFields.forEach(field => {
      const email = registration[field];
      if (email && !isValidEmail(email)) {
        errors.push(`Invalid email format: ${field}`);
      }
    });
    
    if (errors.length === 0) {
      validRegistrations.push({
        ...registration,
        _rowNumber: index + 2, // +2 because Excel is 1-indexed and has header row
      });
    } else {
      invalidRegistrations.push({
        ...registration,
        _rowNumber: index + 2,
        _errors: errors.join('; '),
      });
    }
  });
  
  return { validRegistrations, invalidRegistrations };
}

/**
 * Identify possible sibling groups
 * Groups registrations by parent email/contact information
 */
function identifySiblingGroups(validRegistrations) {
  const familyMap = new Map();
  
  validRegistrations.forEach(registration => {
    // Try to find parent email/contact fields
    const parentEmailKey = Object.keys(registration).find(key => 
      key.toLowerCase().includes('email') && 
      (key.toLowerCase().includes('parent') || key.toLowerCase().includes('genitore'))
    );
    
    const parentNameKey = Object.keys(registration).find(key =>
      key.toLowerCase().includes('parent') || 
      key.toLowerCase().includes('genitore') ||
      key.toLowerCase().includes('cognome')
    );
    
    const childNameKey = Object.keys(registration).find(key =>
      key.toLowerCase().includes('nome') && 
      key.toLowerCase().includes('bambino')
    );
    
    if (!parentEmailKey) return;
    
    const parentEmail = registration[parentEmailKey]?.toString().trim().toLowerCase();
    if (!parentEmail) return;
    
    const parentName = registration[parentNameKey]?.toString().trim() || 'Unknown';
    const childName = registration[childNameKey]?.toString().trim() || 'Unknown';
    
    if (!familyMap.has(parentEmail)) {
      familyMap.set(parentEmail, {
        familyId: parentEmail,
        parentEmail: parentEmail,
        parentName: parentName,
        children: 0,
        childrenNames: [],
      });
    }
    
    const family = familyMap.get(parentEmail);
    family.children++;
    family.childrenNames.push(childName);
  });
  
  // Filter to only show families with multiple children (potential siblings)
  const siblingGroups = Array.from(familyMap.values())
    .filter(family => family.children > 1)
    .map(family => ({
      ...family,
      childrenNames: family.childrenNames.join(', ')
    }));
  
  return siblingGroups;
}

/**
 * Write results to Excel file with multiple sheets
 */
function writeResultsToExcel(filePath, results) {
  try {
    const workbook = XLSX.utils.book_new();

    // Add valid registrations sheet
    if (results.validRegistrations && results.validRegistrations.length > 0) {
      const validSheet = XLSX.utils.json_to_sheet(results.validRegistrations);
      XLSX.utils.book_append_sheet(workbook, validSheet, 'Valid_Registrations');
    }

    // Add invalid registrations sheet
    if (results.invalidRegistrations && results.invalidRegistrations.length > 0) {
      const invalidSheet = XLSX.utils.json_to_sheet(results.invalidRegistrations);
      XLSX.utils.book_append_sheet(workbook, invalidSheet, 'Invalid_Registrations');
    }

    // Add sibling groups sheet
    if (results.siblingGroups && results.siblingGroups.length > 0) {
      const siblingSheet = XLSX.utils.json_to_sheet(results.siblingGroups);
      XLSX.utils.book_append_sheet(workbook, siblingSheet, 'Possible_Siblings');
    }

    // Add summary sheet
    const summary = [{
      'Total Registrations': results.totalCount,
      'Valid Registrations': results.validCount,
      'Invalid Registrations': results.invalidCount,
      'Sibling Groups': results.siblingGroupsCount,
      'Processed At': results.processedAt,
    }];
    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    XLSX.writeFile(workbook, filePath);
    return true;
  } catch (error) {
    throw new Error(`Failed to write Excel file: ${error.message}`);
  }
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    mapping[normalized] = header;
  });

  return mapping;
}

module.exports = {
  processRegistrations,
  readRegistrations,
  writeResultsToExcel,
  getColumnMapping,
};