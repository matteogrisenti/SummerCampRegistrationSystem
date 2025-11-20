# Electron Desktop App - Architecture Refactor

## Overview

This application has been completely refactored from a Flask-based web app to a standalone Electron desktop application. **All processing happens locally - no external servers, no HTTP requests, no Python dependencies.**

## Architecture

### Directory Structure

```
dashboard/
├── backend/                          # Backend logic (runs in main process)
│   ├── modules/
│   │   ├── config.cjs               # Configuration settings
│   │   ├── validators.cjs           # Validation logic
│   │   ├── siblingDetector.cjs      # Sibling detection algorithm
│   │   ├── excelHandler.cjs         # Excel file I/O
│   │   └── processor.cjs            # Main processing pipeline
│   └── ipcHandlers.cjs              # IPC message handlers
├── src/
│   ├── api.js                       # IPC-based API client (replaces HTTP)
│   ├── App.jsx                      # Main React component
│   ├── main.jsx                     # React entry point
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── InvalidTable.jsx
│   │   ├── RegistrationStats.jsx
│   │   └── SiblingsTable.jsx
│   └── App.css
├── main.cjs                         # Electron main process (replaces Flask)
├── preload.cjs                      # Secure IPC bridge
├── vite.config.js                  # Vite configuration
├── package.json
└── dist/                            # Built app (production only)
```

## Data Flow

### Development Mode (`npm run electron-dev`)

```
User Action (React)
    ↓
ipcRenderer (preload bridge)
    ↓
ipcMain handler (main.cjs)
    ↓
Backend modules (no Flask!)
    ↓
IPC response back to React
    ↓
UI Update
```

### Production Mode (`npm start`)

Same as above - no HTTP, no servers.

## Key Changes

### 1. **No Flask Server**
- ❌ Removed: `spawn('python', ['app.py'])`
- ✅ Added: All backend logic in `/backend/modules/`

### 2. **No HTTP Requests**
- ❌ Old: `fetch('http://localhost:5000/api/process')`
- ✅ New: `window.electronApi.processFile(buffer, fileName)`

### 3. **IPC-Based Communication**
All renderer ↔ main process communication uses Electron's IPC:
- **ipcRenderer** in preload.js (renderer process)
- **ipcMain** in main.cjs (main process)
- Safe contextIsolation prevents direct renderer access to main process

### 4. **Backend Logic in Node**
Python modules converted to JavaScript:
- `validators.py` → `validators.cjs`
- `sibling_detector.py` → `siblingDetector.cjs`
- `excel_handler.py` → `excelHandler.cjs`
- `process_registration.py` → `processor.cjs`

## IPC API Reference

### Available Methods (from preload.cjs)

```javascript
window.electronApi.processFile(arrayBuffer, fileName)
  // Processes uploaded file through complete pipeline
  // Returns: { success, data, filePath, message }

window.electronApi.processFileRaw(filePath)
  // Process a file already on disk
  // Returns: { success, data, filePath, message }

window.electronApi.showOpenDialog()
  // Show file picker
  // Returns: { success, filePath }

window.electronApi.showSaveDialog(defaultFileName)
  // Show save dialog
  // Returns: { success, filePath }

window.electronApi.readFile(filePath)
  // Read file from disk
  // Returns: { success, buffer, fileName }

window.electronApi.getAppInfo()
  // Get application info
  // Returns: { version, electron, node, platform, mode }

window.electronApi.quit()
  // Quit the application
```

## Security Features

### ✅ contextIsolation: true
- Renderer process cannot access main process directly
- Only exposed API from preload.cjs is available

### ✅ nodeIntegration: false
- Renderer cannot require() Node modules directly
- All backend logic runs in main process only

### ✅ sandbox: true
- Renderer process runs in sandboxed environment
- Cannot access file system without IPC

### ✅ Secure IPC Bridge
- Only necessary methods exposed via preload.cjs
- All file operations go through main process
- No eval() or dynamic code execution

## How to Run

### Development Mode (with Vite dev server)
```bash
# Terminal 1: Build frontend in watch mode
npm run dev

# Terminal 2: Run Electron app
npm run electron-dev
```

Or run Electron which will load from Vite dev server:
```bash
npm run electron-dev
```

### Production Mode (standalone)
```bash
# Build frontend and run as desktop app
npm start
```

Or manual steps:
```bash
npm run build
npm run electron-prod
```

### Build for Distribution
```bash
npm run electron-build
```
Creates installer in `dist/` folder.

## Backend Modules

### config.cjs
- Application configuration
- Column names, validation rules
- Sibling detection thresholds

### validators.cjs
- `validateRegistration(row)` - Validate single record
- `validateRegistrations(rows)` - Batch validation
- `calculateAge(dob)` - Age calculation
- Checks required fields, email/phone format, age range

### siblingDetector.cjs
- `detectSiblings(registrations)` - Find sibling groups
- `getSiblingStatistics(groups)` - Compute statistics
- `stringSimilarity(str1, str2)` - Levenshtein distance
- Uses last name, parent info, phone, email for matching

### excelHandler.cjs
- `readRegistrations(filePath)` - Read Excel to JSON
- `writeResultsToExcel(filePath, results)` - Write results
- `getColumnMapping(data)` - Normalize column names
- Creates sheets: Registrations, Invalid_Registrations, Possible_Siblings

### processor.cjs
- `processRegistrations(inputPath, outputPath)` - Main pipeline
- Orchestrates: Load → Validate → Detect siblings → Write results
- Returns processing summary

## IPC Handlers (ipcHandlers.cjs)

```javascript
ipcMain.handle('process-file', async (event, fileBuffer, fileName) => {...})
ipcMain.handle('process-file-raw', async (event, filePath) => {...})
ipcMain.handle('show-open-dialog', async (event) => {...})
ipcMain.handle('show-save-dialog', async (event, defaultFileName) => {...})
ipcMain.handle('read-file', async (event, filePath) => {...})
ipcMain.handle('app-info', async (event) => {...})
```

## API Layer (src/api.js)

All React components use the `api` object:

```javascript
import { api } from './api'

// Process file from file input
const result = await api.processFile(file)

// Or use file dialog
const filePath = await api.showOpenDialog()
const result = await api.processFileRaw(filePath)

// Read processed file
const { buffer, fileName } = await api.readFile(filePath)

// Check if running in Electron
const isElectron = window.electronApi !== undefined
```

## Environment Variables

Set `NODE_ENV` to control app behavior:
- `development` - Loads from Vite dev server, opens DevTools
- `production` - Loads from built dist folder, no DevTools

## Offline & Standalone

✅ **Completely offline** - No internet required
✅ **No external dependencies** - Everything included
✅ **Single executable** - Can be packaged as installer
✅ **Data stays local** - No cloud sync, all files on user's computer

## Performance Notes

- **Faster than web app**: No network latency
- **Lower memory**: No browser overhead
- **Better file handling**: Direct file system access via IPC
- **Responsive UI**: IPC communication is very fast

## Troubleshooting

### "electronApi is undefined"
- Make sure preload.cjs is loading correctly
- Check that contextIsolation is enabled in main.cjs
- Verify preload path in BrowserWindow webPreferences

### File processing fails
- Check that xlsx library is installed: `npm list xlsx`
- Ensure input file is valid Excel format
- Check browser console (F12) and main process console for errors

### Vite dev server not loading in development
- Run `npm run dev` in another terminal
- Make sure port 5173 is available
- Check that Vite server is running before starting Electron

## Next Steps

1. Test file processing locally
2. Customize validators for your specific data format
3. Add custom sibling detection rules in `siblingDetector.cjs`
4. Update column mappings in `config.cjs` if needed
5. Build and distribute as executable

## License

Same as parent project.
