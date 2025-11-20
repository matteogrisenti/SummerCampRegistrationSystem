/**
 * Secure preload script for Electron
 * Exposes only necessary IPC methods to renderer process
 * Maintains security boundaries with contextIsolation
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposed API object - only these methods are available in renderer
 */
const api = {
  /**
   * Process an uploaded file
   * @param {ArrayBuffer} fileBuffer - File data
   * @param {string} fileName - File name
   * @returns {Promise<Object>} Processing results
   */
  processFile: (fileBuffer, fileName) =>
    ipcRenderer.invoke('process-file', fileBuffer, fileName),

  /**
   * Process a file that already exists on disk
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Processing results
   */
  processFileRaw: (filePath) =>
    ipcRenderer.invoke('process-file-raw', filePath),

  /**
   * Show file open dialog
   * @returns {Promise<Object>} Dialog result
   */
  showOpenDialog: () =>
    ipcRenderer.invoke('show-open-dialog'),

  /**
   * Show file save dialog
   * @param {string} defaultFileName - Default file name
   * @returns {Promise<Object>} Dialog result
   */
  showSaveDialog: (defaultFileName) =>
    ipcRenderer.invoke('show-save-dialog', defaultFileName),

  /**
   * Read a file from disk
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File buffer and name
   */
  readFile: (filePath) =>
    ipcRenderer.invoke('read-file', filePath),

  /**
   * Get application information
   * @returns {Promise<Object>} App info
   */
  getAppInfo: () =>
    ipcRenderer.invoke('app-info'),

  /**
   * Quit the application
   */
  quit: () =>
    ipcRenderer.send('app-quit'),
};

/**
 * Expose API to renderer process
 * This is the ONLY bridge between renderer and main process
 */
contextBridge.exposeInMainWorld('electronApi', api);

console.log('Preload script loaded - API exposed to renderer');

