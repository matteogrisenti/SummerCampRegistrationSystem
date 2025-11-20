/**
 * IPC Handlers for Electron main process
 * Handles all communication between renderer and backend logic
 */

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const processor = require('./modules/processor.cjs');

/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {
  /**
   * IPC Handler: process-file
   * Processes an uploaded file through the complete pipeline
   */
  ipcMain.handle('process-file', async (event, fileBuffer, fileName) => {
    try {
      // Save buffer to temporary file
      const tempDir = require('os').tmpdir();
      const tempFilePath = path.join(tempDir, fileName);

      fs.writeFileSync(tempFilePath, Buffer.from(fileBuffer));

      // Process the file
      const results = await processor.processRegistrations(tempFilePath, tempFilePath);

      // Return results and temp file path
      return {
        success: true,
        data: results,
        filePath: tempFilePath,
        message: 'File processed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error processing file: ${error.message}`
      };
    }
  });

  /**
   * IPC Handler: process-file-raw
   * Process a file that already exists on disk
   */
  ipcMain.handle('process-file-raw', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const results = await processor.processRegistrations(filePath, filePath);

      return {
        success: true,
        data: results,
        filePath,
        message: 'File processed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error processing file: ${error.message}`
      };
    }
  });

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

  console.log('IPC handlers registered successfully');
  
}

module.exports = {
  registerIpcHandlers,
};
