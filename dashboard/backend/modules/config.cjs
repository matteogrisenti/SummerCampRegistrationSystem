/**
 * Configuration for registration processing
 */

const CONFIG = {
  // Column names expected in the Excel file
  columns: {
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    email: 'Email',
    phone: 'Phone',
    parentName: 'Parent Name',
    parentEmail: 'Parent Email',
    parentPhone: 'Parent Phone',
    address: 'Address',
    medicalConditions: 'Medical Conditions',
    allergies: 'Allergies',
    emergencyContact: 'Emergency Contact',
    emergencyPhone: 'Emergency Phone',
  },

  // Validation rules
  validation: {
    minAge: 5,
    maxAge: 18,
    requiredFields: ['First Name', 'Last Name', 'Parent Name', 'Parent Email'],
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phonePattern: /^\+?[\d\s\-\(\)]{10,}$/,
  },

  // Sibling detection
  siblings: {
    matchThreshold: 0.8, // 80% similarity to be considered siblings
    considerLastName: true,
    considerDateOfBirth: true,
    considerEmail: true,
    considerPhone: true,
  },

  // Output
  output: {
    sheets: ['Registrations', 'Invalid_Registrations', 'Possible_Siblings'],
  },
};

module.exports = CONFIG;
