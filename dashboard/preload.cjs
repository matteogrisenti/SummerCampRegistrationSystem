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
   * Create a new camp with Google Form and Sheet
   * @param {Object} args - Camp creation arguments
   * @returns {Promise<Object>} Camp metadata
   */
  createCamp: (args) =>
    ipcRenderer.invoke('camp:create', args),

  /**
   * Check if Google credentials exist
   * @returns {Promise<Object>} Credentials status
   */
  checkGoogleAuth: () =>
    ipcRenderer.invoke('auth:check-google'),

  /**
   * Get Google OAuth login URL
   * @returns {Promise<Object>} Auth URL
   */
  getGoogleLoginUrl: () =>
    ipcRenderer.invoke('auth:get-login-url'),

  /**
   * Handle OAuth callback with authorization code
   * @param {string} code - Authorization code from Google
   * @returns {Promise<Object>} Result
   */
  handleOAuthCallback: (code) =>
    ipcRenderer.invoke('auth:oauth-callback', code),

  /**
   * Initiate Google OAuth login flow
   * @returns {Promise<Object>} Auth result
   */
  googleLogin: () =>
    ipcRenderer.invoke('auth:google-login'),

  /**
   * Quit the application
   */
  quit: () =>
    ipcRenderer.send('app-quit'),

  /**
   * Listen for OAuth code from deep link
   * @param {Function} callback - Called when OAuth code is received
   */
  onOAuthCode: (callback) =>
    ipcRenderer.on('oauth-code', (event, code) => callback(code)),

  /**
   * Listen for OAuth errors
   * @param {Function} callback - Called when OAuth error occurs
   */
  onOAuthError: (callback) =>
    ipcRenderer.on('oauth-error', (event, error) => callback(error)),

  // Camp methods
  listCamps: () => ipcRenderer.invoke('camp:list'),
  getCamp: (slug) => ipcRenderer.invoke('camp:get', slug),
  updateCamp: (slug, updates) => ipcRenderer.invoke('camp:update', slug, updates),
  deleteCamp: (slug) => ipcRenderer.invoke('camp:delete', slug),
};

/**
 * Expose API to renderer process
 * This is the ONLY bridge between renderer and main process
 */
contextBridge.exposeInMainWorld('electronApi', api);


console.log('Preload script loaded - API exposed to renderer');

