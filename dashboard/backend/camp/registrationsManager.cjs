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

        // Add the new registration to the array
        registrationsData.push({ ...new_registration, ID: regId });

        // Validate the new set of registrations
        let validationData = validatedRegistration(registrationsData)

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

        return { success: true, data: registrationsData, validationData: validationData };
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

        // Update 'All Registrations' sheet
        const newAllSheet = XLSX.utils.json_to_sheet(registrationsData);
        workbook.Sheets['All Registrations'] = newAllSheet;

        // Write the file back
        XLSX.writeFile(workbook, filePath);

        return { success: true, data: registrationsData, validationData: validationData };
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

        return { success: true, data: registrationsData, validationData: validationData };
    } catch (error) {
        console.error('Error modifying registration:', error);
        return { success: false, error: error.message, data: [] };
    }
}





module.exports = {
    getRegistrations,
    postRegistration,
    deleteRegistration,
    modifyRegistration
};
