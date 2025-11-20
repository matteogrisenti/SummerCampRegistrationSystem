/**
 * Data validators for registration data
 */

const CONFIG = require('./config.cjs');

/**
 * Validate a single registration entry
 */
function validateRegistration(row) {
  const errors = [];

  // Check required fields
  CONFIG.validation.requiredFields.forEach(field => {
    if (!row[field] || String(row[field]).trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate email format
  if (row['Parent Email'] && !CONFIG.validation.emailPattern.test(row['Parent Email'])) {
    errors.push(`Invalid email format: ${row['Parent Email']}`);
  }

  // Validate phone format
  if (row['Parent Phone'] && !CONFIG.validation.phonePattern.test(row['Parent Phone'])) {
    errors.push(`Invalid phone format: ${row['Parent Phone']}`);
  }

  // Validate date of birth format and age
  if (row['Date of Birth']) {
    try {
      const dob = new Date(row['Date of Birth']);
      if (isNaN(dob.getTime())) {
        errors.push(`Invalid date format: ${row['Date of Birth']}`);
      } else {
        const age = calculateAge(dob);
        if (age < CONFIG.validation.minAge) {
          errors.push(`Child too young: ${age} years old (minimum: ${CONFIG.validation.minAge})`);
        }
        if (age > CONFIG.validation.maxAge) {
          errors.push(`Child too old: ${age} years old (maximum: ${CONFIG.validation.maxAge})`);
        }
      }
    } catch (e) {
      errors.push(`Invalid date format: ${row['Date of Birth']}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    row: { ...row, _validationErrors: errors.join('; ') }
  };
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validate all registrations
 */
function validateRegistrations(rows) {
  const validated = rows.map(row => validateRegistration(row));
  
  return {
    valid: validated.filter(v => v.isValid).map(v => v.row),
    invalid: validated.filter(v => !v.isValid).map(v => v.row),
    summary: {
      total: rows.length,
      valid: validated.filter(v => v.isValid).length,
      invalid: validated.filter(v => !v.isValid).length,
    }
  };
}

module.exports = {
  validateRegistration,
  validateRegistrations,
  calculateAge,
};
