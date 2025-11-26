const XLSX = require('xlsx');
const fs = require('fs');


/**
 * Read registrations from Excel file
 */
function readRegistrations(filePath, sheetId = 0) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[sheetId];
        const sheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        return data || [];
    } catch (error) {
        throw new Error(`Failed to read Excel file: ${error.message}`);
    }
}

/**
 * Validate registrations
 */
function validateRegistrations(registrations) {
    const validRegistrations = [];
    const invalidRegistrations = [];

    // Required fields
    const requiredFields = ['Timestamp'];

    registrations.forEach((registration) => {
        const errors = [];

        // Check required fields
        requiredFields.forEach(field => {
            if (!registration[field] || registration[field].toString().trim() === '') {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Email validation
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
            validRegistrations.push(registration);
        } else {
            invalidRegistrations.push({
                ...registration,
                _errors: errors.join('; '),
            });
        }
    });

    return { validRegistrations, invalidRegistrations };
}

/**
 * Identify duplicate registrations
 */
function identifyDuplicateRegistrations(validRegistrations) {
    const seen = new Map();
    const duplicates = [];

    validRegistrations.forEach(reg => {
        const childNameKey = Object.keys(reg).find(k =>
            k.toLowerCase().includes("nome") && k.toLowerCase().includes("bambino")
        );
        const parentNameKey = Object.keys(reg).find(k =>
            k.toLowerCase().includes("parent") || k.toLowerCase().includes("genitore")
        );
        const phoneKey = Object.keys(reg).find(k =>
            k.toLowerCase().includes("telefono") || k.toLowerCase().includes("phone")
        );

        if (!childNameKey || !parentNameKey || !phoneKey) return;

        const child = reg[childNameKey]?.toString().trim().toLowerCase();
        const parent = reg[parentNameKey]?.toString().trim().toLowerCase();
        const phone = reg[phoneKey]?.toString().trim();

        if (!child || !parent || !phone) return;

        const key = `${child}__${parent}__${phone}`;

        if (seen.has(key)) {
            duplicates.push({
                ...reg,
                _duplicateOf: seen.get(key)._rowNumber
            });
        } else {
            seen.set(key, reg);
        }
    });

    return duplicates;
}

/**
 * Identify possible sibling groups
 */
function identifySiblingGroups(validRegistrations) {
    const familyMap = new Map();

    validRegistrations.forEach(registration => {
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

    return Array.from(familyMap.values())
        .filter(family => family.children > 1)
        .map(family => ({
            ...family,
            childrenNames: family.childrenNames.join(', ')
        }));
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
 */
function getColumnMapping(data) {
    if (!data || data.length === 0) return {};
    const headers = Object.keys(data[0]);
    const mapping = {};
    headers.forEach(header => {
        mapping[header.toLowerCase().trim()] = header;
    });
    return mapping;
}

module.exports = {
    readRegistrations,
    getColumnMapping,
    validateRegistrations,
    identifyDuplicateRegistrations,
    identifySiblingGroups,
};