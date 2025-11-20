const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./backend/ipcHandlers.cjs');

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
let mainWindow;

/**
 * Create the main application window
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server during development
    : `file://${path.join(__dirname, 'dist', 'index.html')}`; // Built app in production

  console.log(`Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl, { userAgent: 'Chrome' });

  // Add a simple check after page load
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully!');
    mainWindow.webContents.executeJavaScript(`
      console.log('React app loaded');
      console.log('electronApi available:', typeof window.electronApi !== 'undefined');
      document.body.style.background = '#f5f7fa';
    `);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed!');
  });

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * App event handlers
 */
app.on('ready', async () => {
  console.log('App starting...');
  console.log(`Mode: ${isDev ? 'development' : 'production'}`);
  
  // Register all IPC handlers
  registerIpcHandlers();
  
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  // On macOS, keep app running until user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
