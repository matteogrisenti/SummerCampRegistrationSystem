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

        // Add status based on validation
        if (errors.length == 0) {
            // console.log('[REG] Registration: ' + registration.name + ' is valid')
            registration.status = 'valid';
            registration._errors = '';
            validRegistrations.push(registration);
        } else {
            registration.status = 'invalid';
            registration._errors = errors.join('; ');
            invalidRegistrations.push(registration);
        }
    });

    return { validRegistrations, invalidRegistrations };
}

// Identify duplicate registrations
function identifyDuplicateRegistrations(validRegistrations) {
    const seen = new Map();
    const duplicates = [];
    const normalize = (str) => str ? str.toString().toLowerCase().replace(/\s+/g, '') : '';

    validRegistrations.forEach(reg => {
        // Find keys for child name, parent name, and phone
        // Look for a child name column. It may be called "Nome Cognome Ragazzo" or similar.
        const childKey = Object.keys(reg).find(k => {
            const low = k.toLowerCase();
            // Must contain "nome" and not refer to a parent/guardian
            const isChild = low.includes('nome') && !low.includes('genitore') && (low.includes('bambino') || low.includes('ragazzo') || low.includes('cognome'));
            return isChild;
        });
        // Prefer a parent name column (contains both 'genitore' and 'nome' or 'parent' and 'nome')
        const parentKey = Object.keys(reg).find(k => {
            const low = k.toLowerCase();
            const isParentName = (low.includes('genitore') || low.includes('parent')) && low.includes('nome');
            if (isParentName) return true;
            // fallback to any column that mentions parent or genitore (e.g., email)
            return low.includes('genitore') || low.includes('parent');
        });
        const phoneKey = Object.keys(reg).find(k => k.toLowerCase().includes('telefono') || k.toLowerCase().includes('phone'));
        if (!childKey) {
            console.log('[REG] Registration: ' + reg.name + ' is invalid: missing child name');
            return; // cannot evaluate without child name
        }

        const child = normalize(reg[childKey]);
        const parent = parentKey ? normalize(reg[parentKey]) : '';
        const phone = phoneKey ? normalize(reg[phoneKey]) : '';

        if (!child) {
            console.log('[REG] Registration: ' + reg.name + ' is invalid: missing child name');
            return;
        }
        // Need at least one additional identifier to compare (parent name or phone)
        if (!parent && !phone) {
            console.log('[REG] Registration: ' + reg.name + ' is invalid: missing parent name or phone');
            return;
        }
        // Build composite keys for matching
        const keys = [];
        if (parent) keys.push(`${child}__${parent}`);
        if (phone) keys.push(`${child}__${phone}`);
        let isDup = false;
        let original = null;
        for (const k of keys) {
            if (seen.has(k)) {
                isDup = true;
                original = seen.get(k);
                break;
            }
        }
        if (isDup) {
            if (reg.status !== 'invalid') {
                reg.status = 'duplicate';
                reg.isDuplicate = true;
            }
            if (original && original._rowNumber) {
                reg._duplicateOf = original._rowNumber;
            }
            duplicates.push(reg);
        } else {
            // Store each key mapping to this registration
            keys.forEach(k => seen.set(k, reg));
        }
    });
    return duplicates;
}
function identifySiblingGroups(registrations) {
    const familyMap = new Map();

    registrations.forEach(registration => {
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
    readRegistrations,
    getColumnMapping,
    validateRegistrations,
    identifyDuplicateRegistrations,
    identifySiblingGroups,
    validatedRegistration
};