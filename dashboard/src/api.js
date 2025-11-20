/**
 * API client for communicating with backend via IPC
 * No HTTP requests - everything runs locally in Electron
 */

/**
 * Check if we're running in Electron
 */
const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.electronApi !== 'undefined';
};

/**
 * Mock API for testing when electronApi is not available
 */
const mockApi = {
  processFile: async () => ({
    success: false,
    message: 'electronApi not available - try reloading'
  }),
  processFileRaw: async () => ({
    success: false,
    message: 'electronApi not available'
  }),
  showOpenDialog: async () => ({ success: false }),
  showSaveDialog: async () => ({ success: false }),
  readFile: async () => ({ success: false }),
  getAppInfo: async () => ({ mode: 'unknown' }),
  quit: () => console.log('Would quit')
};

/**
 * API client using IPC bridge
 */
export const api = {
  /**
   * Process an uploaded file
   * @param {File} file - The Excel file to upload
   * @returns {Promise<Object>} Processing results
   */
  async processFile(file) {
    if (!isElectron()) {
      throw new Error('Application must run in Electron for file processing');
    }

    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Send to main process via IPC
      const result = await window.electronApi.processFile(arrayBuffer, file.name);

      if (!result.success) {
        throw new Error(result.message || 'Failed to process file');
      }

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
   * Process a file that already exists on disk
   * @param {string} filePath - Path to the file on disk
   * @returns {Promise<Object>} Processing results
   */
  async processFileRaw(filePath) {
    if (!isElectron()) {
      throw new Error('Application must run in Electron');
    }

    try {
      const result = await window.electronApi.processFileRaw(filePath);

      if (!result.success) {
        throw new Error(result.message || 'Failed to process file');
      }

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
   * Show file open dialog
   * @returns {Promise<string|null>} Selected file path or null
   */
  async showOpenDialog() {
    if (!isElectron()) {
      throw new Error('Application must run in Electron');
    }

    try {
      const result = await window.electronApi.showOpenDialog();
      return result.success ? result.filePath : null;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  },

  /**
   * Show file save dialog
   * @param {string} defaultFileName - Default file name
   * @returns {Promise<string|null>} Save path or null
   */
  async showSaveDialog(defaultFileName) {
    if (!isElectron()) {
      throw new Error('Application must run in Electron');
    }

    try {
      const result = await window.electronApi.showSaveDialog(defaultFileName);
      return result.success ? result.filePath : null;
    } catch (error) {
      console.error('Error opening save dialog:', error);
      return null;
    }
  },

  /**
   * Read a file from disk
   * @param {string} filePath - Path to file
   * @returns {Promise<{buffer: ArrayBuffer, fileName: string}>} File data
   */
  async readFile(filePath) {
    if (!isElectron()) {
      throw new Error('Application must run in Electron');
    }

    try {
      const result = await window.electronApi.readFile(filePath);

      if (!result.success) {
        throw new Error(result.error || 'Failed to read file');
      }

      return {
        buffer: new Uint8Array(result.buffer).buffer,
        fileName: result.fileName
      };
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },

  /**
   * Get application info
   * @returns {Promise<Object>} App information
   */
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

  /**
   * Check backend health (always returns true since no backend server)
   * @returns {Promise<boolean>} Always true in local mode
   */
  async checkHealth() {
    return isElectron();
  },

  /**
   * Quit the application
   */
  quit() {
    if (isElectron()) {
      window.electronApi.quit();
    }
  }
};
