/* This file implements all the base manager methods for camp registrations */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { validatedRegistration } = require('./registrationProcessor.cjs')

// Base directory for camps data
const CAMPS_DIR = path.join(process.cwd(), 'backend/data');


function getRegistrations(campSlug) {
    // Read the local registrations.xlsx file and return the registration data
    const campDir = path.join(CAMPS_DIR, campSlug);
    const filePath = path.join(campDir, 'registrations.xlsx');

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Registrations file not found', data: [] };
    }
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['All Registrations'];
        const registrationsData = XLSX.utils.sheet_to_json(sheet);
        return { success: true, data: registrationsData };
    } catch (error) {
        console.error('Error reading registrations file:', error);
        return { success: false, error: error.message, data: [] };
    }
}


function postRegistration(campSlug, new_registration) {
    // Read the local registrations.xlsx file and return the registration data
    const campDir = path.join(CAMPS_DIR, campSlug);
    const filePath = path.join(campDir, 'registrations.xlsx');

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Registrations file not found', data: [] };
    }
    try {
        const workbook = XLSX.readFile(filePath);
        const allSheet = workbook.Sheets['All Registrations'];
        const registrationsData = XLSX.utils.sheet_to_json(allSheet);

        // Find the registration by ID (handle both id and ID)
        const regId = registrationsData.length + 1;

        // Get the Timestamp in format: DD/MM/YYYY HH.MM.SS
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${day}/${month}/${year} ${hours}.${minutes}.${seconds}`;
        new_registration.Timestamp = timestamp;

        // Set acceptance status to 'pending' for new registrations
        new_registration.acceptance_status = 'pending';

        // Add the new registration to the array
        registrationsData.push({ ...new_registration, ID: regId });

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrationsData)
        let processedData = {
            validCount: validationData.validRegistrations.length,
            invalidCount: validationData.invalidRegistrations.length,
            siblingGroupsCount: validationData.siblingGroups.length,
            duplicateCount: validationData.duplicateRegistrations.length,
            totalCount: registrationsData.length,
        }

        // Update 'All Registrations' sheet
        const newAllSheet = XLSX.utils.json_to_sheet(registrationsData);
        workbook.Sheets['All Registrations'] = newAllSheet;

        // Write in the Added Registrations sheet
        const addedSheet = workbook.Sheets['Added Registrations'];
        const addedData = XLSX.utils.sheet_to_json(addedSheet);
        addedData.push(new_registration);
        const newAddedSheet = XLSX.utils.json_to_sheet(addedData);
        workbook.Sheets['Added Registrations'] = newAddedSheet;

        // Write the file back
        XLSX.writeFile(workbook, filePath);

        return { success: true, data: registrationsData, processedData: processedData };
    } catch (error) {
        console.error('Error modifying registration:', error);
        return { success: false, error: error.message, data: [] };
    }
}



function deleteRegistration(campSlug, registration_id) {
    // Read the local registrations.xlsx file and return the registration data
    const campDir = path.join(CAMPS_DIR, campSlug);
    const filePath = path.join(campDir, 'registrations.xlsx');

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Registrations file not found', data: [] };
    }
    try {
        const workbook = XLSX.readFile(filePath);
        const allSheet = workbook.Sheets['All Registrations'];
        const removedSheet = workbook.Sheets['Deleted Registrations'];
        const registrationsData = XLSX.utils.sheet_to_json(allSheet);

        // Find the registration by ID (handle both id and ID)
        const index = registrationsData.findIndex(r => r.ID == registration_id);
        const registration = registrationsData[index];

        // Add the registration to the Deleted Registrations sheet
        const deletedData = XLSX.utils.sheet_to_json(removedSheet);
        deletedData.push(registration);
        const newDeletedSheet = XLSX.utils.json_to_sheet(deletedData);
        workbook.Sheets['Deleted Registrations'] = newDeletedSheet;

        if (index === -1) {
            return { success: false, error: `Registration with ID ${registration_id} not found`, data: [] };
        }

        // Remove the registration from the array
        registrationsData.splice(index, 1);

        // Regenerate the registration IDs
        for (let i = 0; i < registrationsData.length; i++) {
            registrationsData[i].ID = i + 1;
        }

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrationsData)
        let processedData = {
            validCount: validationData.validRegistrations.length,
            invalidCount: validationData.invalidRegistrations.length,
            siblingGroupsCount: validationData.siblingGroups.length,
            duplicateCount: validationData.duplicateRegistrations.length,
            totalCount: registrationsData.length,
        }

        // Update 'All Registrations' sheet
        const newAllSheet = XLSX.utils.json_to_sheet(registrationsData);
        workbook.Sheets['All Registrations'] = newAllSheet;

        // Write the file back
        XLSX.writeFile(workbook, filePath);

        return { success: true, data: registrationsData, processedData: processedData };
    } catch (error) {
        console.error('Error deleting registration:', error);
        return { success: false, error: error.message, data: [] };
    }
}


function modifyRegistration(campSlug, modified_registration) {
    // Read the local registrations.xlsx file and return the registration data
    const campDir = path.join(CAMPS_DIR, campSlug);
    const filePath = path.join(campDir, 'registrations.xlsx');

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Registrations file not found', data: [] };
    }
    try {
        const workbook = XLSX.readFile(filePath);
        const allSheet = workbook.Sheets['All Registrations'];
        const registrationsData = XLSX.utils.sheet_to_json(allSheet);

        // Find the registration by ID (handle both id and ID)
        const regId = modified_registration.id || modified_registration.ID;
        const index = registrationsData.findIndex(r => r.ID == regId);

        if (index === -1) {
            return { success: false, error: `Registration with ID ${regId} not found`, data: [] };
        }

        // Extract the original registration
        const original_registration = { ...registrationsData[index] };

        // Update the original registration with the new one
        // We merge the modified fields into the original registration
        const updated_registration = { ...original_registration, ...modified_registration };
        // Ensure ID is preserved and correct
        updated_registration.ID = original_registration.ID;

        // Update the array
        registrationsData[index] = updated_registration;

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrationsData)
        let processedData = {
            validCount: validationData.validRegistrations.length,
            invalidCount: validationData.invalidRegistrations.length,
            siblingGroupsCount: validationData.siblingGroups.length,
            duplicateCount: validationData.duplicateRegistrations.length,
            totalCount: registrationsData.length,
        }

        // Update 'All Registrations' sheet
        const newAllSheet = XLSX.utils.json_to_sheet(registrationsData);
        workbook.Sheets['All Registrations'] = newAllSheet;

        // Save the couple of original and modified registration in the Modified Registration sheet
        let modifiedSheet = workbook.Sheets['Modified Registrations'];
        let modifiedData = [];
        if (modifiedSheet) {
            modifiedData = XLSX.utils.sheet_to_json(modifiedSheet);
        }

        // Create the arrow row
        const arrowRow = { "ID": "->" };

        modifiedData.push(original_registration);
        modifiedData.push(arrowRow);
        modifiedData.push(updated_registration);

        const newModifiedSheet = XLSX.utils.json_to_sheet(modifiedData);

        // Update or append the sheet
        if (workbook.Sheets['Modified Registrations']) {
            workbook.Sheets['Modified Registrations'] = newModifiedSheet;
        } else {
            XLSX.utils.book_append_sheet(workbook, newModifiedSheet, 'Modified Registrations');
        }

        // Write the file back
        XLSX.writeFile(workbook, filePath);

        return { success: true, data: registrationsData, processedData: processedData };
    } catch (error) {
        console.error('Error modifying registration:', error);
        return { success: false, error: error.message, data: [] };
    }
}


function updateAcceptanceStatus(campSlug, registrationIds, status) {
    // Update the acceptance status of multiple registrations
    const campDir = path.join(CAMPS_DIR, campSlug);
    const filePath = path.join(campDir, 'registrations.xlsx');

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Registrations file not found', data: [] };
    }

    try {
        const workbook = XLSX.readFile(filePath);
        const allSheet = workbook.Sheets['All Registrations'];
        const registrationsData = XLSX.utils.sheet_to_json(allSheet);

        // Update the acceptance status for the specified registrations
        let updatedCount = 0;
        registrationsData.forEach(reg => {
            if (registrationIds.includes(reg.ID)) {
                reg.acceptance_status = status;
                updatedCount++;
            }
        });

        if (updatedCount === 0) {
            return { success: false, error: 'No matching registrations found', data: registrationsData };
        }

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrationsData);
        let processedData = {
            validCount: validationData.validRegistrations.length,
            invalidCount: validationData.invalidRegistrations.length,
            siblingGroupsCount: validationData.siblingGroups.length,
            duplicateCount: validationData.duplicateRegistrations.length,
            totalCount: registrationsData.length,
        };

        // Update 'All Registrations' sheet
        const newAllSheet = XLSX.utils.json_to_sheet(registrationsData);
        workbook.Sheets['All Registrations'] = newAllSheet;

        // Update or create 'Acceptance Status' sheet with only accepted/rejected registrations
        const acceptanceData = registrationsData
            .filter(reg => reg.acceptance_status && reg.acceptance_status !== 'pending')
            .map(reg => ({
                ID: reg.ID,
                Name: reg['Nome del bambino'] || reg.Name || 'N/A',
                Surname: reg['Cognome del bambino'] || reg.Surname || 'N/A',
                Status: reg.acceptance_status,
                Updated: new Date().toLocaleString('it-IT')
            }));

        if (acceptanceData.length > 0) {
            const acceptanceSheet = XLSX.utils.json_to_sheet(acceptanceData);

            // Apply colors to the sheet based on status
            const range = XLSX.utils.decode_range(acceptanceSheet['!ref']);
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                const statusCell = acceptanceSheet[XLSX.utils.encode_cell({ r: R, c: 3 })]; // Status column
                if (statusCell && statusCell.v) {
                    const status = statusCell.v;
                    // Set background color for the entire row
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!acceptanceSheet[cellAddress]) continue;

                        if (!acceptanceSheet[cellAddress].s) acceptanceSheet[cellAddress].s = {};
                        if (!acceptanceSheet[cellAddress].s.fill) acceptanceSheet[cellAddress].s.fill = {};

                        if (status === 'accepted') {
                            // Light blue for accepted
                            acceptanceSheet[cellAddress].s.fill = {
                                patternType: 'solid',
                                fgColor: { rgb: 'D1ECF1' }
                            };
                        } else if (status === 'rejected') {
                            // Light purple-red for rejected
                            acceptanceSheet[cellAddress].s.fill = {
                                patternType: 'solid',
                                fgColor: { rgb: 'F8D7DA' }
                            };
                        }
                    }
                }
            }

            if (workbook.Sheets['Acceptance Status']) {
                workbook.Sheets['Acceptance Status'] = acceptanceSheet;
            } else {
                XLSX.utils.book_append_sheet(workbook, acceptanceSheet, 'Acceptance Status');
            }
        }

        // Write the file back
        XLSX.writeFile(workbook, filePath);

        return { success: true, data: registrationsData, processedData: processedData };
    } catch (error) {
        console.error('Error updating acceptance status:', error);
        return { success: false, error: error.message, data: [] };
    }
}



module.exports = {
    getRegistrations,
    postRegistration,
    deleteRegistration,
    modifyRegistration,
    updateAcceptanceStatus
};
