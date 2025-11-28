/**
 * IPC Handlers for Electron main process
 * Handles all communication between renderer and backend logic
 */

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');


/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {

  /**
   * IPC Handler: show-open-dialog
   * Show file picker dialog
   */
  ipcMain.handle('show-open-dialog', async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      return {
        success: !result.canceled,
        filePath: result.filePaths[0] || null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * IPC Handler: show-save-dialog
   * Show save file dialog
   */
  ipcMain.handle('show-save-dialog', async (event, defaultFileName) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultFileName,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      return {
        success: !result.canceled,
        filePath: result.filePath || null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * IPC Handler: read-file
   * Read file from disk and return as buffer
   */
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      return {
        success: true,
        buffer: Array.from(fileBuffer),
        fileName: path.basename(filePath)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * IPC Handler: app-info
   * Get application information
   */
  ipcMain.handle('app-info', async (event) => {
    return {
      version: require('../package.json').version,
      electron: process.version,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      mode: process.env.NODE_ENV || 'production'
    };
  });


  /**   
   * IPC Handler: create-camp
   * Trigger creation of a new camp (creates form, sheet, downloads xlsx)
   */
  const { createCamp } = require('./camp/createCamp.cjs');
  ipcMain.handle('camp:create', async (event, args) => {
    try {
      const campName = args?.campName;
      const result = await createCamp(campName, args.options || {});
      return { success: true, data: result };
    } catch (err) {
      console.error('createCamp error:', err);
      return { success: false, error: err.message || String(err) };
    }
  });

  /**
   * IPC Handler: auth:check-google
   * Check if Google credentials exist
   */
  ipcMain.handle('auth:check-google', async (event) => {
    try {
      const { hasToken } = require('./services/google/auth.cjs');
      const fs = require('fs');
      const path = require('path');
      const tokenPath = path.join(__dirname, 'token.json');

      return {
        success: true,
        hasCredentials: true, // We don't need credentials file
        hasToken: hasToken()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  /**
   * IPC Handler: auth:get-login-url
   * Get the Google OAuth login URL and start callback server
   */
  ipcMain.handle('auth:get-login-url', async (event) => {
    try {
      console.log('AUTH DEBUG: Starting OAuth flow...');
      console.log('  CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING');
      console.log('  CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'LOADED' : 'MISSING');

      const { getAuthUrl, startCallbackServer, REDIRECT_URI } = require('./services/google/auth.cjs');

      // Start the localhost callback server
      await startCallbackServer();
      console.log('Callback server started');

      const authUrl = await getAuthUrl();
      console.log('Auth URL generated:', authUrl.substring(0, 50) + '...');

      return {
        success: true,
        authUrl,
        redirectUri: REDIRECT_URI
      };
    } catch (err) {
      console.error('AUTH ERROR:', err);
      return { success: false, error: err.message };
    }
  });

  /**
   * IPC Handler: auth:handle-oauth-callback
   * Process OAuth callback with authorization code
   */
  ipcMain.handle('auth:oauth-callback', async (event, code) => {
    try {
      const { handleAuthCallback, stopCallbackServer } = require('./services/google/auth.cjs');
      await handleAuthCallback(code);

      // Stop the callback server after successful auth
      stopCallbackServer();

      return {
        success: true,
        message: 'Authentication successful'
      };
    } catch (err) {
      console.error('OAuth callback error:', err);
      return { success: false, error: err.message };
    }
  });

  /**
   * IPC Handler: auth:google-login
   * Initiate Google OAuth flow
   */
  ipcMain.handle('auth:google-login', async (event) => {
    try {
      const { authorize } = require('./services/google/auth.cjs');
      const auth = await authorize();
      return {
        success: true,
        message: 'Google authentication successful'
      };
    } catch (err) {
      console.error('Google auth error:', err);
      return { success: false, error: err.message || String(err) };
    }
  });

  console.log('IPC handlers registered successfully');

}

module.exports = {
  registerIpcHandlers,
};


/////////////////////////////////////////////////////////////////////////////////////////////////////
// IPC Handlers for Camp Management
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Path to camps.json (adjust based on your project structure)
const campsJsonPath = path.join(__dirname, './data/camps.json');
if (!fs.existsSync(campsJsonPath)) {
  throw new Error('camps.json not found', campsJsonPath);
}

/**
 * IPC Handler: camp:list
 * Get list of all camps from camps.json
 */
ipcMain.handle('camp:list', async (event) => {
  try {
    const fs = require('fs');

    // Check if file exists
    if (!fs.existsSync(campsJsonPath)) {
      console.log('camps.json not found, returning empty array');
      return {
        success: true,
        data: []
      };
    }

    // Read and parse camps.json
    const campsData = fs.readFileSync(campsJsonPath, 'utf8');
    const camps = JSON.parse(campsData);

    console.log('Loaded camps:', camps.length);
    return {
      success: true,
      data: camps
    };
  } catch (err) {
    console.error('Error reading camps.json:', err);
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
});

/**
 * IPC Handler: camp:get
 * Get a specific camp by slug
 */
ipcMain.handle('camp:get', async (event, campSlug) => {
  try {
    const fs = require('fs');

    if (!fs.existsSync(campsJsonPath)) {
      throw new Error('camps.json not found');
    }

    const campsData = fs.readFileSync(campsJsonPath, 'utf8');
    const camps = JSON.parse(campsData);

    const camp = camps.find(c => c.camp_slug === campSlug);

    if (!camp) {
      throw new Error(`Camp not found: ${campSlug}`);
    }

    console.log('Found camp:', camp.camp_name);
    return {
      success: true,
      data: camp
    };
  } catch (err) {
    console.error('Error getting camp:', err);
    return {
      success: false,
      error: err.message
    };
  }
});

/**
 * IPC Handler: camp:delete
 * Delete a camp from camps.json
 */
const { deleteCamp } = require('./camp/deleteCamp.cjs');
ipcMain.handle('camp:delete', async (event, campSlug) => {
  try {
    deleteCamp(campSlug);

    return {
      success: true,
      message: 'Camp deleted successfully'
    };
  } catch (err) {
    console.error('Error deleting camp:', err);
    return {
      success: false,
      error: err.message
    };
  }
});


/* =================================================================================================
     REGISTRATIONS
================================================================================================ */
const { processRegistrations } = require('./camp/registrationProcessor.cjs');
const { getRegistrations, postRegistration, deleteRegistration, modifyRegistration } = require('./camp/registrationsManager.cjs');

// camp:registrations:get
ipcMain.handle('camp:registrations:get', async (event, slug) => {
  try {
    const result = getRegistrations(slug);
    return result;
  } catch (error) {
    console.error('Error getting registrations:', error);
    return { success: false, error: error.message, data: [] };
  }
});

// camp:registrations:post
ipcMain.handle('camp:registrations:post', async (event, slug, registration) => {
  try {
    const result = postRegistration(slug, registration);
    return result;
  } catch (error) {
    console.error('Error posting registration:', error);
    return { success: false, error: error.message, data: [] };
  }
});

// camp:registrations:delete
ipcMain.handle('camp:registrations:delete', async (event, slug, registration_id) => {
  try {
    const result = deleteRegistration(slug, registration_id);
    return result;
  } catch (error) {
    console.error('Error deleting registration:', error);
    return { success: false, error: error.message, data: [] };
  }
});

// camp:registrations:modify
ipcMain.handle('camp:registrations:modify', async (event, slug, registration) => {
  try {
    const result = modifyRegistration(slug, registration);
    return result;
  } catch (error) {
    console.error('Error modifying registration:', error);
    return { success: false, error: error.message, data: [] };
  }
});

// camp:process
ipcMain.handle('camp:process', async (event, slug) => {
  try {
    const fs = require('fs');

    if (!fs.existsSync(campsJsonPath)) {
      return {
        success: false,
        error: `Camp not found: ${slug}`
      };
    }

    const campsData = fs.readFileSync(campsJsonPath, 'utf8');
    const camps = JSON.parse(campsData);

    const camp = camps.find(c => c.camp_slug === slug);

    if (!camp) {
      return {
        success: false,
        error: `Camp not found: ${slug}`
      };
    }

    // Process the registrations
    const result = await processRegistrations(slug, camp.xlsx_path, camp.sheet_id);

    return result;

  } catch (error) {
    console.error('Processing handler error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// camp:registrations:update-acceptance-status
ipcMain.handle('camp:registrations:update-acceptance-status', async (event, slug, registrationIds, status) => {
  try {
    const { updateAcceptanceStatus } = require('./camp/registrationsManager.cjs');
    const result = updateAcceptanceStatus(slug, registrationIds, status);
    return result;
  } catch (error) {
    console.error('Error updating acceptance status:', error);
    return { success: false, error: error.message, data: [] };
  }
});

