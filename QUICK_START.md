# Quick Start Guide

## What You Have

A fully local desktop application that processes camp registrations **without any server, cloud, or external dependencies**.

## How to Run

### For End Users (Production)
```bash
start_app.bat
```
That's it! App builds, starts, and opens.

### For Developers (Development)
```bash
start_app_dev.bat
```
This runs Vite dev server so you can edit React code and see changes instantly.

## What Happens

1. **start_app.bat** runs:
   - Builds React frontend
   - Starts Electron desktop window
   - Flask backend? **NO** ❌
   - Servers? **NO** ❌
   - External processes? **NO** ❌

2. **Desktop app opens** with:
   - File upload form
   - Live Excel file processing
   - Results in new Excel sheets
   - All done locally on your computer

## Using the App

1. **Click "Upload File"** → Select your Excel file
2. **Wait for processing** → Data validated locally
3. **Results appear** → Check the results sheets
4. **Save/export** → Use file dialogs to save

## How It Works (No Servers!)

```
You upload file
    ↓
React calls window.electronApi.processFile()
    ↓
IPC message to Electron main process
    ↓
JavaScript backend validates & detects siblings
    ↓
Results returned via IPC
    ↓
Display results in React
```

**Zero network calls. Zero Python. Zero servers. Completely local.**

## File Structure

```
dashboard/
├── main.cjs              ← Electron main process
├── preload.cjs           ← Secure IPC bridge
├── backend/              ← All processing logic (Node.js)
│   ├── modules/
│   │   ├── validators.cjs
│   │   ├── siblingDetector.cjs
│   │   ├── excelHandler.cjs
│   │   └── processor.cjs
│   └── ipcHandlers.cjs
├── src/                  ← React components
│   ├── App.jsx
│   ├── api.js           ← Uses IPC (not HTTP!)
│   └── components/
└── package.json
```

## Commands Reference

```bash
# Build frontend
npm run build

# Run for development (with Vite hot reload)
npm run electron-dev

# Run for production (static build)
npm run electron-prod

# Start from scratch
npm start

# Build for distribution
npm run electron-build
```

## Key Files to Understand

### `main.cjs` - Electron Main Process
- Controls window creation
- Registers IPC handlers
- NO Flask, NO spawning processes

### `preload.cjs` - Security Bridge
- Exposes only safe methods to React
- Maintains process isolation
- All file operations are sandboxed

### `backend/ipcHandlers.cjs` - Request Handlers
- Receives IPC messages from React
- Calls backend modules
- Returns results

### `backend/modules/processor.cjs` - Main Logic
- Reads Excel file
- Validates registrations
- Detects siblings
- Writes results

### `src/api.js` - React API Layer
- All React components use this
- Calls `window.electronApi` methods
- No HTTP, no fetch, no servers

## Offline? 100% Yes! ✅

- No internet required
- No cloud services
- No external APIs
- Everything on your computer
- Works in airplane mode
- No data leaves your machine

## Performance

- **Faster** than web app (no network latency)
- **Lower memory** (no browser overhead)
- **More responsive** (direct IPC is instant)
- **Better file handling** (native file system access)

## Customization

### Change validation rules
Edit: `/dashboard/backend/modules/config.cjs`

### Add custom validation
Edit: `/dashboard/backend/modules/validators.cjs`

### Adjust sibling matching
Edit: `/dashboard/backend/modules/siblingDetector.cjs`

### Change Excel output
Edit: `/dashboard/backend/modules/excelHandler.cjs`

### Modify UI
Edit: `/dashboard/src/` (React components)

## Troubleshooting

**App won't start?**
```bash
cd dashboard
npm install
npm run build
npm start
```

**React changes not showing?**
Make sure you're using `start_app_dev.bat` not `start_app.bat`

**File processing fails?**
- Check that file is valid Excel (.xlsx or .xls)
- Check browser console (F12) for errors
- Check main process console (behind Electron window)

## Distribution

Package as standalone executable:
```bash
npm run electron-build
```

Creates installer in `dist/` folder that users can run without Node/npm.

## What's Different From Old App?

| Old | New |
|-----|-----|
| Flask backend | Node.js modules |
| HTTP requests | IPC messages |
| Requires Python | Pure JavaScript |
| Browser window | Electron window |
| Needs server | Pure local app |
| Network lag | Instant |

## Next Steps

1. ✅ Run `start_app.bat` and test it
2. ✅ Upload test Excel file
3. ✅ Verify results are correct
4. ✅ Customize validators if needed
5. ✅ Build and share with users

## Got Issues?

1. Check `ARCHITECTURE.md` - detailed explanation
2. Check `MIGRATION_GUIDE.md` - what changed and why
3. Check main process console - click behind Electron window
4. Check browser console - F12 in Electron window

---

**Enjoy your new desktop app! No servers, no complicated setup, just works.** 🚀
