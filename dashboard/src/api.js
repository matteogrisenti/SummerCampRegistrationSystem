/**
 * API client to communicate with the Electron main process via IPC.
 * When running outside Electron, uses a mock API.
 *
 * No HTTP requests are used when running in Electron.
 */

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------------------------------- */

/**
 * Detect if the app is running inside Electron.
 */
const isElectron = () =>
  typeof window !== 'undefined' && typeof window.electronApi !== 'undefined';



/* -------------------------------------------------------------------------------------------------
 * API Client
 * ------------------------------------------------------------------------------------------------- */

export const api = {
  /* -----------------------------------------------------------------------------------------------
   * General Utilities
   * ----------------------------------------------------------------------------------------------- */

  async getAppInfo() {
    if (!isElectron()) {
      return {
        version: 'unknown',
        mode: 'web',
        message: 'Not running in Electron'
      };
    }

    try {
      return await window.electronApi.getAppInfo();
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  },

  async checkHealth() {
    return isElectron();
  },

  quit() {
    if (isElectron()) window.electronApi.quit();
  },




  /* -----------------------------------------------------------------------------------------------
   * File Processing
   * ----------------------------------------------------------------------------------------------- */

  /**
   * Process an uploaded file.
   * @param {File} file
   */
  async processFile(file) {
    if (!isElectron()) {
      throw new Error('Application must run in Electron for file processing');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.electronApi.processFile(arrayBuffer, file.name);

      if (!result.success) throw new Error(result.message || 'Failed to process file');

      return {
        success: true,
        data: result.data,
        filePath: result.filePath,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error processing file: ${error.message}`
      };
    }
  },

  /**
   * Process a file already on disk.
   * @param {string} filePath
   */
  async processFileRaw(filePath) {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.processFileRaw(filePath);

      if (!result.success) throw new Error(result.message || 'Failed to process file');

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error processing file: ${error.message}`
      };
    }
  },

  /**
   * Read a file from disk.
   * @param {string} filePath
   */
  async readFile(filePath) {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.readFile(filePath);

      if (!result.success) throw new Error(result.error || 'Failed to read file');

      return {
        buffer: new Uint8Array(result.buffer).buffer,
        fileName: result.fileName
      };
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },


  /* -----------------------------------------------------------------------------------------------
   * File Dialogs
   * ----------------------------------------------------------------------------------------------- */

  async showOpenDialog() {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.showOpenDialog();
      return result.success ? result.filePath : null;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  },

  async showSaveDialog(defaultFileName) {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.showSaveDialog(defaultFileName);
      return result.success ? result.filePath : null;
    } catch (error) {
      console.error('Error opening save dialog:', error);
      return null;
    }
  },




  /* -----------------------------------------------------------------------------------------------
   * Google OAuth
   * ----------------------------------------------------------------------------------------------- */

  async checkGoogleAuth() {
    if (!isElectron()) {
      return { success: false, hasCredentials: false, hasToken: false };
    }

    try {
      return await window.electronApi.checkGoogleAuth();
    } catch (error) {
      console.error('Error checking Google auth:', error);
      return { success: false, error: error.message };
    }
  },

  async getGoogleLoginUrl() {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.getGoogleLoginUrl();

      if (!result.success) throw new Error(result.error || 'Failed to get login URL');

      return result.authUrl;
    } catch (error) {
      console.error('Error getting Google login URL:', error);
      throw error;
    }
  },

  async handleOAuthCallback(code) {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.handleOAuthCallback(code);

      if (!result.success) throw new Error(result.error || 'OAuth callback failed');

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return {
        success: false,
        error: error.message,
        message: `OAuth callback failed: ${error.message}`
      };
    }
  },

  async googleLogin() {
    if (!isElectron()) throw new Error('Application must run in Electron');

    try {
      const result = await window.electronApi.googleLogin();

      if (!result.success) throw new Error(result.error || 'Google login failed');

      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      console.error('Error during Google login:', error);
      return {
        success: false,
        error: error.message,
        message: `Google login failed: ${error.message}`
      };
    }
  },




  /* -----------------------------------------------------------------------------------------------
   * Camps
   * ----------------------------------------------------------------------------------------------- */

  async listCamps() {
    try {
      return await window.electronApi.listCamps();
    } catch (error) {
      console.error('Error listing camps:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async getCamp(campSlug) {
    try {
      return await window.electronApi.getCamp(campSlug);
    } catch (error) {
      console.error('Error getting camp:', error);
      return { success: false, error: error.message };
    }
  },

  async createCamp(campName, options = {}) {
    try {
      return await window.electronApi.createCamp(campName, options);
    } catch (error) {
      console.error('Error creating camp:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCamp(campSlug) {
    try {
      return await window.electronApi.deleteCamp(campSlug);
    } catch (error) {
      console.error('Error deleting camp:', error);
      return { success: false, error: error.message };
    }
  }
};
