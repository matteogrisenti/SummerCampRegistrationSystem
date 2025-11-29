/* This file implements all the base manager methods for camp registrations */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { validatedRegistration } = require('./utils/utils.cjs')
const { syncRegistrations } = require('./utils/syncRegistrations.cjs');

// Base directory for camps data
const CAMPS_DIR = path.join(process.cwd(), 'backend/data');


async function getRegistrations(campSlug) {
    try {
        // Read the local registrations.xlsx file and return the registration data
        const campDir = path.join(CAMPS_DIR, campSlug);
        const xlsxPath = path.join(campDir, 'registrations.xlsx');

        // 1. Sync and merge registrations (download new, merge with old, save to file)
        const { registrations, _ } = await syncRegistrations(campSlug);
        console.log('[SYNC] Registrations synced successfully');

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrations)
        let processedData = {
            validCount: validationData.validRegistrations.length,
            invalidCount: validationData.invalidRegistrations.length,
            siblingGroupsCount: validationData.siblingGroups.length,
            duplicateCount: validationData.duplicateRegistrations.length,
            totalCount: registrations.length,
        }
        // 3. Add the processing tag to the All Registrations sheet
        // Open existing workbook
        const workbook = XLSX.readFile(xlsxPath);

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
        XLSX.writeFile(workbook, xlsxPath);

        return {
            success: true,
            data: registrations,
            processedData: processedData,
        };
    }
    catch (error) {
        console.error('Processing error:', error);
        return {
            success: false,
            error: error.message
        };
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

    //Check if the modified_registration is an array, if not convert it to an array
    if (!Array.isArray(modified_registration)) {
        modified_registration = [modified_registration];
    }

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

        // Update each registration
        for (let i = 0; i < modified_registration.length; i++) {
            const new_registration = modified_registration[i];
            // Find the registration by ID (handle both id and ID)
            const regId = new_registration.id || new_registration.ID;
            const index = registrationsData.findIndex(r => r.ID == regId);

            if (index === -1) {
                return { success: false, error: `Registration with ID ${regId} not found`, data: [] };
            }

            // Extract the original registration
            const original_registration = { ...registrationsData[index] };

            // Update the original registration with the new one
            // We merge the modified fields into the original registration
            const updated_registration = { ...original_registration, ...new_registration };
            // Ensure ID is preserved and correct
            updated_registration.ID = original_registration.ID;

            // Update the array
            registrationsData[index] = updated_registration;

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
        console.error('Error modifying registration:', error);
        return { success: false, error: error.message, data: [] };
    }
}



module.exports = {
    getRegistrations,
    postRegistration,
    deleteRegistration,
    modifyRegistration,
};
